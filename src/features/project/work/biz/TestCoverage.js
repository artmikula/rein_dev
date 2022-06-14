/* eslint-disable max-lines */
import { COMPLEX_LOGICAL, COVERAGE_ASPECT, GRAPH_NODE_TYPE } from 'features/shared/constants';
import appConfig from 'features/shared/lib/appConfig';
import Enumerable from 'linq';

class TestCoverage {
  constructor() {
    this.graphNodes = [];
    this.causeNodes = [];
    this.effectNodes = [];
    this.testCases = [];
    this.testScenarios = [];
    this.graphLinks = [];
    this.testDatas = [];
  }

  initValue(graphNodes = [], testCases = [], testScenarios = [], graphLinks = [], testDatas = []) {
    this.graphNodes = [...graphNodes];
    this.testCases = [...testCases];
    this.causeNodes = this.graphNodes.filter((x) => x.type === GRAPH_NODE_TYPE.CAUSE);
    this.effectNodes = this.graphNodes.filter((x) => x.type === GRAPH_NODE_TYPE.EFFECT);
    this.testScenarios = [...testScenarios];
    this.graphLinks = [...graphLinks];
    this.testDatas = [...testDatas];
  }

  calculateCoverage(aspect) {
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

  calculateCoverageByTestCase() {
    const casesCount = this.testCases.length;
    const checkedCasesCount = this.testCases.filter((x) => x.isSelected).length;

    return {
      numerator: checkedCasesCount,
      denominator: casesCount,
    };
  }

  calculateCoverageByCause() {
    const causes = this.causeNodes.length;
    const trueCauses = [];
    const falseCauses = [];

    const checkedCases = this.testCases.filter((x) => x.isSelected);
    checkedCases.forEach((checkedCase) => {
      const testAssertions = checkedCase.testScenario.testAssertions.filter(
        (x) => x.graphNode && x.graphNode.type === GRAPH_NODE_TYPE.CAUSE
      );

      testAssertions.forEach((testAssertion) => {
        if (testAssertion.result) {
          trueCauses.push(testAssertion);
        } else {
          falseCauses.push(testAssertion);
        }
      });
    });

    const intersectsCause = trueCauses.filter((x) => falseCauses.some((y) => x.graphNode.id === y.graphNode.id));

    return {
      numerator: intersectsCause.length,
      denominator: causes,
    };
  }

  calculateCoverageByCauseTestData() {
    const causesCount = this.causeNodes.length;
    const trueCauses = [];
    const falseCauses = [];

    const trueDatas = new Map();
    const falseDatas = new Map();

    const checkedCases = this.testCases.filter((x) => x.isSelected);
    checkedCases.forEach((checkedCase) => {
      const testAssertions = checkedCase.testScenario.testAssertions.filter(
        (x) => x.graphNode && x.graphNode.type === GRAPH_NODE_TYPE.CAUSE
      );

      testAssertions.forEach((testAssertion) => {
        if (testAssertion.result) {
          if (!trueDatas.has(testAssertion.graphNode.id)) {
            trueDatas.set(testAssertion.graphNode.id, []);
          }

          const value = trueDatas.get(testAssertion.graphNode.id);
          value.push(checkedCase.testDatas.find((x) => x.graphNodeId === testAssertion.graphNode.id));
          trueDatas.set(testAssertion.graphNode.id, value);
        } else {
          if (!falseDatas.has(testAssertion.graphNode.id)) {
            falseDatas.set(testAssertion.graphNode.id, []);
          }

          const value = falseDatas.get(testAssertion.graphNode.id);
          value.push(checkedCase.testDatas.find((x) => x.graphNodeId === testAssertion.graphNode.id));
          falseDatas.set(testAssertion.graphNode.id, value);
        }
      });

      trueDatas.forEach((value, key) => {
        const cause = this.causeNodes.find((x) => x.id === key);
        const testData = this.testDatas.find((x) => x.nodeId === cause.nodeId);
        const trueDataArray = testData.trueDatas ? testData.trueDatas.split(',') : [''];
        if (Enumerable.from(trueDataArray).sequenceEqual(value)) {
          trueCauses.push(key);
        }
      });

      falseDatas.forEach((value, key) => {
        const cause = this.causeNodes.find((x) => x.id === key);
        const testData = this.testDatas.find((x) => x.nodeId === cause.nodeId);
        const trueDataArray = testData.falseDatas ? testData.falseDatas.split(',') : [''];
        if (Enumerable.from(trueDataArray).sequenceEqual(value)) {
          falseDatas.push(key);
        }
      });
    });

    const intersectsCause = trueCauses.filter((x) => falseCauses.some((y) => x.graphNode.id === y.graphNode.id));

    return {
      numerator: intersectsCause.length,
      denominator: causesCount,
    };
  }

  calculateCoverageByEffect() {
    const effects = this.effectNodes.length;
    const unCheckedCases = this.testCases.filter((x) => !x.isSelected);

    const allResults = Enumerable.from(this.testScenarios)
      .select((x) => {
        return { graphNodeId: x.targetGraphNodeId, type: x.resultType };
      })
      .selectMany((x) => x.testResults)
      .toArray();
    const exceptedEffects = [...this.effectNodes.filter((x) => !allResults.some((y) => y.graphNodeId === x.id))];

    unCheckedCases.forEach((unCheckedCase) => {
      const resultIds = [unCheckedCase.testScenario.targetGraphNodeId];
      const results = this.effectNodes.filter((x) => resultIds.some((y) => x.id === y));

      results.forEach((result) => {
        if (!exceptedEffects.some((x) => x.id === result.id)) {
          exceptedEffects.push(result);
        }
      });
    });

    return {
      numerator: effects - exceptedEffects.length,
      denominator: effects,
    };
  }

  calculateCoverageByComplexLogicalRelation() {
    const causes = this._findComplexCauses();
    const causesIds = causes.map((x) => x.id);
    const testCasesContainsCauses = this.testCases.filter((x) =>
      x.testDatas.some((y) => causesIds.some((z) => y.graphNodeId === z))
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

  calculateCoverageByScenario() {
    const scenariosCount = this.testScenarios.length;
    const checkedScenariosCount = this.testScenarios.filter((x) => x.isSelected).length;

    return {
      numerator: checkedScenariosCount,
      denominator: scenariosCount,
    };
  }

  calculateCoverageByBaseScenario() {
    let cases = 0.0;
    let checkedCases = 0.0;

    this.testCases.forEach((testCase) => {
      if (testCase.testScenario.isBaseScenario) {
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

  calculateCoverageByValidScenario() {
    let cases = 0.0;
    let checkedCases = 0.0;

    this.testCases.forEach((testCase) => {
      if (testCase.testScenario.isValid) {
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

  calculateCoverageByInvalidScenario() {
    let cases = 0.0;
    let checkedCases = 0.0;

    this.testCases.forEach((testCase) => {
      if (!testCase.testScenario.isValid) {
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

  _findComplexCauses() {
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
      const causeComplexity = this.graphLinks.filter((x) => x.source.id === causeNode.id).length;
      causeComplexities.set(causeNode.id, causeComplexity);
      totalComplexities += causeComplexity;
    });

    return { totalComplexities, causeComplexities };
  };

  _findComplexCausesByAverage() {
    const { totalComplexities, causeComplexities } = this._getCauseComplexities();

    const averageComplexities = totalComplexities / this.causeNodes.length;
    const resultIds = [];
    causeComplexities.forEach((value, key) => {
      if (value > averageComplexities) {
        resultIds.push(key);
      }
    });
    return [...this.causeNodes.filter((x) => resultIds.some((y) => x.id === y))];
  }

  _findComplexCausesByWeightedAverage() {
    const { totalComplexities, causeComplexities } = this._getCauseComplexities();

    let weightedAverage = 0.0;
    causeComplexities.forEach((value) => {
      weightedAverage += value * (value / totalComplexities);
    });

    const resultIds = [];
    causeComplexities.forEach((value, key) => {
      if (value > weightedAverage) {
        resultIds.push(key);
      }
    });

    return [...this.causeNodes.filter((x) => resultIds.some((y) => x.id === y))];
  }

  findComplexCausesByUserDefinedThreshold() {
    const { threshold } = appConfig.testCoverage;
    const { causeComplexities } = this._getCauseComplexities();

    const resultIds = [];
    causeComplexities.forEach((value, key) => {
      if (value > threshold) {
        resultIds.push(key);
      }
    });

    return [...this.causeNodes.filter((x) => resultIds.some((y) => x.id === y))];
  }

  generateReportData = (data) => {
    let testCoverage = [
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

    testCoverage = testCoverage.map((e) => {
      const percent = data[e.key].actualPercent || 0;
      let numerator = ((percent * data[e.key].denominator) / 100).toFixed(0);
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
