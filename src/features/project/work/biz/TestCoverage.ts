/* eslint-disable max-lines */
import Enumerable from 'linq';
import cloneDeep from 'lodash.clonedeep';
import { COMPLEX_LOGICAL, COVERAGE_ASPECT, GRAPH_NODE_TYPE } from 'features/shared/constants';
import {
  ITestDataDetail,
  IGraphLink,
  IGraphNode,
  ISimpleTestScenario,
  ITestAssertion,
  ITestData,
  ITestCase,
} from 'types/models';
import appConfig from 'features/shared/lib/appConfig';
import TestCase from './TestCase';

interface ITestCoverageResult {
  numerator: number;
  denominator: number;
}

interface ITestCoverageReportData {
  name: string;
  percent: number;
  denominator: number;
  numerator: number;
}

interface ITestCoverageReportDataType {
  [key: string]: {
    actualPercent: number;
    planPercent: number;
    denominator: number;
  };
}

interface ITestCoverageReport {
  key: string;
  name: string;
}

interface ITestScenario extends ISimpleTestScenario {
  testCases: ITestCase[];
}

class TestCoverage {
  graphLinks: IGraphLink[];

  graphNodes: IGraphNode[];

  causeNodes: IGraphNode[];

  effectNodes: IGraphNode[];

  testCases: ITestCase[];

  testScenarios: ITestScenario[];

  testDatas: ITestDataDetail[];

  constructor() {
    this.graphNodes = [];
    this.causeNodes = [];
    this.effectNodes = [];
    this.testCases = [];
    this.testScenarios = [];
    this.graphLinks = [];
    this.testDatas = [];
  }

  initValue(
    graphNodes: IGraphNode[] = [],
    testCases: ITestCase[] = [],
    testScenarios: ITestScenario[] = [],
    graphLinks: IGraphLink[] = [],
    testDatas: ITestDataDetail[] = []
  ) {
    this.graphNodes = cloneDeep(graphNodes);
    this.testCases = cloneDeep(testCases);
    this.causeNodes = this.graphNodes.filter((graphNode) => graphNode.type === GRAPH_NODE_TYPE.CAUSE);
    this.effectNodes = this.graphNodes.filter((graphNode) => graphNode.type === GRAPH_NODE_TYPE.EFFECT);
    this.graphLinks = cloneDeep(graphLinks);
    this.testDatas = cloneDeep(testDatas);
    this.testScenarios = cloneDeep(testScenarios);
  }

  calculateCoverage(aspect: string): ITestCoverageResult {
    switch (aspect) {
      case COVERAGE_ASPECT.TestCase:
        return this.calculateCoverageByTestCase();
      case COVERAGE_ASPECT.Cause:
        return this.calculateCoverageByCause();
      case COVERAGE_ASPECT.CauseTestData:
        return this.calculateCoverageByCauseTestData();
      case COVERAGE_ASPECT.Effect:
        return this.calculateCoverageByEffect();
      case COVERAGE_ASPECT.ComplexLogicalRelation:
        return this.calculateCoverageByComplexLogicalRelation();
      case COVERAGE_ASPECT.Scenario:
        return this.calculateCoverageByScenario();
      case COVERAGE_ASPECT.BaseScenario:
        return this.calculateCoverageByBaseScenario();
      case COVERAGE_ASPECT.ValidScenario:
        return this.calculateCoverageByValidScenario();
      case COVERAGE_ASPECT.InvalidScenario:
        return this.calculateCoverageByInvalidScenario();
      default:
        return this.calculateCoverageByTestCase();
    }
  }

  calculateCoverageByTestCase(): ITestCoverageResult {
    const casesCount: number = this.testCases.length;
    const checkedCasesCount: number = this.testCases.filter((testCase) => testCase.isSelected).length;

    return {
      numerator: checkedCasesCount,
      denominator: casesCount,
    };
  }

  calculateCoverageByCause(): ITestCoverageResult {
    const causes: number = this.causeNodes.length;
    const trueCauses: ITestAssertion[] = [];
    const falseCauses: ITestAssertion[] = [];

    const selectedTestCases = this.testCases.filter((selectedTestCase) => selectedTestCase.isSelected);
    selectedTestCases.forEach((selectedTestCase) => {
      const testScenario: ITestScenario | undefined = this.testScenarios.find(
        (testScenario) => testScenario.id === selectedTestCase.testScenarioId
      );
      const testAssertions: ITestAssertion[] | undefined = testScenario?.testAssertions.filter((testAssertion) =>
        this.causeNodes.some((causeNode) => causeNode.id === testAssertion.graphNodeId)
      );

      if (testAssertions) {
        testAssertions.forEach((testAssertion) => {
          if (testAssertion.result) {
            const isExists: boolean = trueCauses.some(
              (trueCause) => trueCause.graphNodeId === testAssertion.graphNodeId
            );
            if (!isExists) {
              trueCauses.push(testAssertion);
            }
          } else {
            const isExists: boolean = falseCauses.some(
              (falseCause) => falseCause.graphNodeId === testAssertion.graphNodeId
            );
            if (!isExists) {
              falseCauses.push(testAssertion);
            }
          }
        });
      }
    });

    const intersectsCause: ITestAssertion[] = trueCauses.filter((trueCause) =>
      falseCauses.some((falseCause) => trueCause.graphNodeId === falseCause.graphNodeId)
    );

    return {
      numerator: intersectsCause.length,
      denominator: causes,
    };
  }

  calculateCoverageByCauseTestData(): ITestCoverageResult {
    const causesCount: number = this.causeNodes.length;
    const trueCauses: string[] = [];
    const falseCauses: string[] = [];

    const trueDatas: Map<string, string[]> = new Map();
    const falseDatas: Map<string, string[]> = new Map();

    const selectedTestCases: ITestCase[] = this.testCases.filter((testCase) => testCase.isSelected);
    selectedTestCases.forEach((selectedTestCase) => {
      const testScenario: ITestScenario | undefined = this.testScenarios.find(
        (testScenario) => testScenario.id === selectedTestCase.testScenarioId
      );
      const testAssertions: ITestAssertion[] | undefined = testScenario?.testAssertions.filter((testAssertion) =>
        this.causeNodes.some((causeNode) => causeNode.id === testAssertion.graphNodeId)
      );

      if (testAssertions && testAssertions.length > 0) {
        testAssertions.forEach((testAssertion) => {
          const testData: ITestData | undefined = selectedTestCase.testDatas.find(
            (testData) => testData.graphNodeId === testAssertion?.graphNodeId
          );
          if (testAssertion?.result) {
            if (!trueDatas.has(testAssertion?.graphNodeId)) {
              trueDatas.set(testAssertion?.graphNodeId, []);
            }

            const value: string[] = trueDatas.get(testAssertion.graphNodeId) ?? [];
            if (testData) {
              const isExists = value.includes(testData?.data);
              if (!isExists) {
                value.push(testData?.data);
                trueDatas.set(testAssertion.graphNodeId, value);
              }
            }
          } else {
            if (!falseDatas.has(testAssertion.graphNodeId)) {
              falseDatas.set(testAssertion?.graphNodeId, []);
            }

            const value: string[] = falseDatas.get(testAssertion.graphNodeId) ?? [];
            if (testData) {
              const isExists = value.includes(testData?.data);
              if (!isExists) {
                value.push(testData?.data);
                falseDatas.set(testAssertion?.graphNodeId, value);
              }
            }
          }
        });
      }

      trueDatas.forEach((value, key) => {
        const causeNode: IGraphNode | undefined = this.causeNodes.find((causeNode) => causeNode.id === key);
        const testData: ITestDataDetail | undefined = this.testDatas.find(
          (testData) => testData.nodeId === causeNode?.nodeId
        );
        const trueDataArray: string[] = testData?.trueDatas
          ? TestCase.convertTestDataToList(testData?.trueDatas, testData?.type)
          : [''];
        if (Enumerable.from(trueDataArray.sort()).sequenceEqual(value.sort())) {
          const isExists: boolean = trueCauses.includes(key);
          if (!isExists) {
            trueCauses.push(key);
          }
        }
      });

      falseDatas.forEach((value, key) => {
        const causeNode: IGraphNode | undefined = this.causeNodes.find((causeNode) => causeNode.id === key);
        const testData: ITestDataDetail | undefined = this.testDatas.find(
          (testData) => testData.nodeId === causeNode?.nodeId
        );
        const falseDataArray: string[] = testData?.falseDatas
          ? TestCase.convertTestDataToList(testData?.falseDatas, testData?.type)
          : [''];
        if (Enumerable.from(falseDataArray.sort()).sequenceEqual(value.sort())) {
          const isExists = falseCauses.includes(key);
          if (!isExists) {
            falseCauses.push(key);
          }
        }
      });
    });

    const intersectsCause: string[] = trueCauses.filter((trueCause) => falseCauses.includes(trueCause));

    return {
      numerator: intersectsCause.length,
      denominator: causesCount,
    };
  }

  calculateCoverageByEffect(): ITestCoverageResult {
    const effects: number = this.effectNodes.length;
    const unCheckedCases: ITestCase[] = this.testCases.filter((x) => !x.isSelected);
    const notConnectedEffects: IGraphNode[] = this.effectNodes.filter(
      (effectNode) => !this.testScenarios.some((testScenario) => testScenario.targetGraphNodeId === effectNode.id)
    );
    const exceptedEffects: Map<string, string> = new Map();

    unCheckedCases.forEach((unCheckedCase) => {
      const testScenario: ITestScenario | undefined = this.testScenarios.find(
        (testScenario) => testScenario.id === unCheckedCase.testScenarioId
      );
      const results: IGraphNode | undefined = this.effectNodes.find(
        (effectNode) => effectNode.id === testScenario?.targetGraphNodeId
      );

      if (results) {
        if (!exceptedEffects.has(results?.id)) {
          exceptedEffects.set(results?.id, results?.nodeId);
        }
      }
    });

    notConnectedEffects.forEach((effect) => {
      if (!exceptedEffects.has(effect.id)) {
        exceptedEffects.set(effect.id, effect.nodeId);
      }
    });

    return {
      numerator: effects - exceptedEffects.size,
      denominator: effects,
    };
  }

  calculateCoverageByComplexLogicalRelation(): ITestCoverageResult {
    const causes: IGraphNode[] = this._findComplexCauses();
    const causesIds: string[] = causes.map((cause) => cause.id);
    const testCasesContainsCauses: ITestCase[] = this.testCases.filter((testCase) =>
      testCase.testDatas.some((testData) => causesIds.some((causesId) => testData.graphNodeId === causesId))
    );

    let checkedCasesCount = 0;
    let casesCount = 0;

    testCasesContainsCauses.forEach((testCasesContainsCause) => {
      if (testCasesContainsCause.isSelected) {
        checkedCasesCount++;
      }

      casesCount++;
    });

    return {
      numerator: checkedCasesCount,
      denominator: casesCount,
    };
  }

  calculateCoverageByScenario(): ITestCoverageResult {
    const scenariosCount: number = this.testScenarios.length;
    const checkedScenariosCount: number = this.testScenarios.filter((testScenario) => testScenario.isSelected).length;

    return {
      numerator: checkedScenariosCount,
      denominator: scenariosCount,
    };
  }

  calculateCoverageByBaseScenario(): ITestCoverageResult {
    let cases = 0.0;
    let checkedCases = 0.0;

    this.testCases.forEach((testCase) => {
      const testScenario: ITestScenario | undefined = this.testScenarios.find(
        (testScenario) => testScenario.id === testCase.testScenarioId
      );
      if (testScenario?.isBaseScenario) {
        cases += 1.0;
        if (testCase.isSelected) {
          checkedCases += 1.0;
        }
      }
    });

    return {
      numerator: checkedCases,
      denominator: cases,
    };
  }

  calculateCoverageByValidScenario(): ITestCoverageResult {
    let cases = 0.0;
    let checkedCases = 0.0;

    this.testCases.forEach((testCase) => {
      const testScenario: ITestScenario | undefined = this.testScenarios.find(
        (testScenario) => testScenario.id === testCase.testScenarioId
      );
      if (testScenario?.isValid) {
        cases += 1.0;
        if (testCase.isSelected) {
          checkedCases += 1.0;
        }
      }
    });

    return {
      numerator: checkedCases,
      denominator: cases,
    };
  }

  calculateCoverageByInvalidScenario(): ITestCoverageResult {
    let cases = 0.0;
    let checkedCases = 0.0;

    this.testCases.forEach((testCase) => {
      const testScenario: ITestScenario | undefined = this.testScenarios.find(
        (testScenario) => testScenario.id === testCase.testScenarioId
      );
      if (!testScenario?.isValid) {
        cases += 1.0;
        if (testCase.isSelected) {
          checkedCases += 1.0;
        }
      }
    });

    return {
      numerator: checkedCases,
      denominator: cases,
    };
  }

  _findComplexCauses(): IGraphNode[] {
    const { complexLogical } = appConfig.testCoverage;
    switch (complexLogical) {
      case COMPLEX_LOGICAL.Average:
        return this._findComplexCausesByAverage();
      case COMPLEX_LOGICAL.UserDefined:
        return this.findComplexCausesByUserDefinedThreshold();
      case COMPLEX_LOGICAL.WeightedAverage:
        return this._findComplexCausesByWeightedAverage();
      default:
        return this._findComplexCausesByAverage();
    }
  }

  _getCauseComplexities = () => {
    let totalComplexities = 0.0;
    const causeComplexities = new Map();

    this.causeNodes.forEach((causeNode) => {
      const causeComplexity: number = this.graphLinks.filter((x) => x.source.id === causeNode.id).length;
      causeComplexities.set(causeNode.id, causeComplexity);
      totalComplexities += causeComplexity;
    });

    return { totalComplexities, causeComplexities };
  };

  _findComplexCausesByAverage() {
    const { totalComplexities, causeComplexities } = this._getCauseComplexities();

    const averageComplexities: number = totalComplexities / this.causeNodes.length;
    const resultIds: string[] = [];
    causeComplexities.forEach((value, key) => {
      if (value > averageComplexities) {
        resultIds.push(key);
      }
    });
    return [...this.causeNodes.filter((causeNode) => resultIds.some((resultId) => causeNode.id === resultId))];
  }

  _findComplexCausesByWeightedAverage() {
    const { totalComplexities, causeComplexities } = this._getCauseComplexities();

    let weightedAverage = 0.0;
    causeComplexities.forEach((value) => {
      weightedAverage += value * (value / totalComplexities);
    });

    const resultIds: string[] = [];
    causeComplexities.forEach((value, key) => {
      if (value > weightedAverage) {
        resultIds.push(key);
      }
    });

    return [...this.causeNodes.filter((causeNode) => resultIds.some((resultId) => causeNode.id === resultId))];
  }

  findComplexCausesByUserDefinedThreshold() {
    const { threshold } = appConfig.testCoverage;
    const { causeComplexities } = this._getCauseComplexities();

    const resultIds: string[] = [];
    causeComplexities.forEach((value, key) => {
      if (value > threshold) {
        resultIds.push(key);
      }
    });

    return [...this.causeNodes.filter((x) => resultIds.some((y) => x.id === y))];
  }

  generateReportData = (data: ITestCoverageReportDataType) => {
    const testCoverages: ITestCoverageReport[] = [
      {
        name: 'Test Case Coverage',
        key: COVERAGE_ASPECT.TestCase,
      },
      {
        name: 'Cause Coverage',
        key: COVERAGE_ASPECT.Cause,
      },
      {
        name: 'Cause Test Data Coverage',
        key: COVERAGE_ASPECT.CauseTestData,
      },
      {
        name: 'Effect Coverage',
        key: COVERAGE_ASPECT.Effect,
      },
      {
        name: 'Complex Logical Relation Coverage',
        key: COVERAGE_ASPECT.ComplexLogicalRelation,
      },
      {
        name: 'Scenario Coverage',
        key: COVERAGE_ASPECT.Scenario,
      },
      {
        name: 'Base Scenario Coverage',
        key: COVERAGE_ASPECT.BaseScenario,
      },
      {
        name: 'Valid Scenario Coverage',
        key: COVERAGE_ASPECT.ValidScenario,
      },
      {
        name: 'Invalid Scenario Coverage',
        key: COVERAGE_ASPECT.InvalidScenario,
      },
    ];

    const testCoverage: ITestCoverageReportData[] = testCoverages.map((e) => {
      const percent: number = data[e.key].actualPercent || 0;
      let numerator: number | string = ((percent * data[e.key].denominator) / 100).toFixed(0);
      numerator = parseInt(numerator, 10);
      return {
        name: e.name,
        percent: parseFloat(percent.toFixed(2)),
        denominator: data[e.key].denominator,
        numerator,
      };
    });
    return testCoverage;
  };
}

export default new TestCoverage();
