import { COVERAGE_ASPECT, GRAPH_NODE_TYPE, COMPLEX_LOGICAL } from 'features/shared/constants';
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
    for (let i = 0; i < checkedCases.length; i++) {
      const testAssertions = checkedCases[i].testScenario.testAssertions.filter(
        (x) => x.graphNode && x.graphNode.type === GRAPH_NODE_TYPE.CAUSE
      );

      for (let j = 0; j < testAssertions.length; j++) {
        if (testAssertions[j].result) {
          trueCauses.push(testAssertions[j].graphNode);
        } else {
          falseCauses.push(testAssertions[j].graphNode);
        }
      }
    }

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
    for (let i = 0; i < checkedCases.length; i++) {
      const testAssertions = checkedCases[i].testScenario.testAssertions.filter(
        (x) => x.graphNode && x.graphNode.type === GRAPH_NODE_TYPE.CAUSE
      );
      for (let j = 0; j < testAssertions.length; j++) {
        if (testAssertions[j].result) {
          if (!trueDatas.has(testAssertions[j].graphNode.id)) {
            trueDatas.set(testAssertions[j].graphNode.id, []);
          }

          const value = trueDatas.get(testAssertions[j].graphNode.id);
          value.push(checkedCases[i].testDatas.find((x) => x.graphNodeId === testAssertions[j].graphNode.id));
          trueDatas.set(testAssertions[j].graphNode.id, value);
        } else {
          if (!falseDatas.has(testAssertions[j].graphNode.id)) {
            falseDatas.set(testAssertions[j].graphNode.id, []);
          }

          const value = falseDatas.get(testAssertions[j].graphNode.id);
          value.push(checkedCases[i].testDatas.find((x) => x.graphNodeId === testAssertions[j].graphNode.id));
          falseDatas.set(testAssertions[j].graphNode.id, value);
        }
      }

      trueDatas.forEach((value, key) => {
        const nodeId = this.causeNodes.find((x) => x.id === key);
        const testData = this.testDatas.find((x) => x.nodeId === nodeId);
        const trueDataArray = testData.trueDatas ? testData.trueDatas.split(',') : [''];
        if (Enumerable.from(trueDataArray).sequenceEqual(value)) {
          trueCauses.push(key);
        }
      });

      falseDatas.forEach((value, key) => {
        const nodeId = this.causeNodes.find((x) => x.id === key);
        const testData = this.testDatas.find((x) => x.nodeId === nodeId);
        const trueDataArray = testData.falseDatas ? testData.falseDatas.split(',') : [''];
        if (Enumerable.from(trueDataArray).sequenceEqual(value)) {
          falseDatas.push(key);
        }
      });
    }

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
      .selectMany((x) => x.testResults)
      .toArray();
    const exceptedEffects = [...this.effectNodes.filter((x) => !allResults.some((y) => y.graphNodeId === x.id))];

    for (let i = 0; i < unCheckedCases.length; i++) {
      const resultIds = unCheckedCases[i].testScenario.testResults.map((x) => x.graphNodeId);
      const results = this.effectNodes.filter((x) => resultIds.some((y) => x.id === y));
      for (let j = 0; j < results.length; j++) {
        if (!exceptedEffects.some((x) => x.id === results[j].id)) {
          exceptedEffects.push(results[j]);
        }
      }
    }

    return {
      numerator: effects - exceptedEffects.length,
      denominator: effects,
    };
  }

  calculateCoverageByComplexLogicalRelation() {
    const causes = this._findComplexCauses();
    const causesIds = causes.map((x) => x.id);
    const testCasesContainsCause = this.testCases.filter((x) =>
      x.testDatas.some((y) => causesIds.some((z) => y.graphNodeId === z))
    );

    let checkedCasesCount = 0;
    let casesCount = 0;
    for (let i = 0; i < testCasesContainsCause.length; i++) {
      if (testCasesContainsCause[i].isSelected) {
        checkedCasesCount++;
      }

      casesCount++;
    }

    return {
      numerator: checkedCasesCount,
      denominator: casesCount,
    };
  }

  calculateCoverageByScenario() {
    const scenariosCount = this.testScenarios.length;
    const notCheckedCases = this.testCases.filter((x) => !x.isSelected);
    const notCheckedScenarios = [];
    for (let i = 0; i < notCheckedCases.length; i++) {
      if (!notCheckedScenarios.some((x) => x.id === notCheckedCases[i].testScenario.id)) {
        notCheckedScenarios.push(notCheckedCases[i].testScenario);
      }
    }

    return {
      numerator: scenariosCount - notCheckedScenarios.length,
      denominator: scenariosCount,
    };
  }

  calculateCoverageByBaseScenario() {
    let cases = 0.0;
    let checkedCases = 0.0;
    const baseTestCases = this.testCases.filter((x) => x.testScenario.isBaseScenario);
    for (let i = 0; i < baseTestCases.length; i++) {
      cases += 1.0;
      if (baseTestCases[i].isSelected) {
        checkedCases += 1.0;
      }
    }

    return {
      numerator: checkedCases,
      denominator: cases,
    };
  }

  calculateCoverageByValidScenario() {
    let cases = 0.0;
    let checkedCases = 0.0;
    const baseTestCases = this.testCases.filter((x) => x.testScenario.isValid);
    for (let i = 0; i < baseTestCases.length; i++) {
      cases += 1.0;
      if (baseTestCases[i].isSelected) {
        checkedCases += 1.0;
      }
    }

    return {
      numerator: checkedCases,
      denominator: cases,
    };
  }

  calculateCoverageByInvalidScenario() {
    let cases = 0.0;
    let checkedCases = 0.0;
    const baseTestCases = this.testCases.filter((x) => x.testScenario.isValid);
    for (let i = 0; i < baseTestCases.length; i++) {
      cases += 1.0;
      if (baseTestCases[i].isSelected) {
        checkedCases += 1.0;
      }
    }

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

  _findComplexCausesByAverage() {
    let complexities = 0;
    const causeComplexities = new Map();
    for (let i = 0; i < this.causeNodes.length; i++) {
      const causeComplexity = this.graphLinks.filter((x) => x.source.id === this.causeNodes[i].id).length;
      causeComplexities.set(this.causeNodes[i].id, causeComplexity);
      complexities += causeComplexity;
    }

    const averageComplexities = complexities / this.causeNodes.length;
    const resultIds = [];
    causeComplexities.forEach((value, key) => {
      if (value > averageComplexities) {
        resultIds.push(key);
      }
    });
    return [...this.causeNodes.filter((x) => resultIds.some((y) => x.id === y))];
  }

  _findComplexCausesByWeightedAverage() {
    let totalComplexities = 0.0;
    const causeComplexities = new Map();
    for (let i = 0; i < this.causeNodes.length; i++) {
      const causeComplexity = this.graphLinks.filter((x) => x.source.id === this.causeNodes[i].id).length;
      causeComplexities.set(this.causeNodes[i].id, causeComplexity);
      totalComplexities += causeComplexity;
    }
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
    const causeComplexities = new Map();
    for (let i = 0; i < this.causeNodes.length; i++) {
      const causeComplexity = this.graphLinks.filter((x) => x.source.id === this.causeNodes[i].id).length;
      causeComplexities.set(this.causeNodes[i].id, causeComplexity);
    }

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
        percent: percent.toFixed(2),
        denominator: data[e.key].denominator,
        numerator,
      };
    });
    return testCoverage;
  };
}

export default new TestCoverage();
