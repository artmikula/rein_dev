/* eslint-disable no-bitwise */
import { GRAPH_NODE_TYPE, OPERATOR_TYPE, RESULT_TYPE, SCENARIO_PROPERTIES } from 'features/shared/constants';
import Enumerable from 'linq';
import { v4 as uuid } from 'uuid';

class TestScenarioHelper {
  buildAssertionDictionary(graphLinks) {
    const assertionDictionary = new Map();
    const effectToEffectLinks = [];
    for (let i = 0; i < graphLinks.length; i++) {
      const { source } = graphLinks[i];
      const { target } = graphLinks[i];

      if (source !== null && target !== null) {
        const scenario = assertionDictionary.get(target.id);
        if (source.type === GRAPH_NODE_TYPE.EFFECT) {
          effectToEffectLinks.push(graphLinks[i]);
        } else if (scenario) {
          const assertion = {
            graphNode: source,
            result: !graphLinks[i].isNotRelation,
          };
          scenario.testAssertions.push(assertion);
        } else {
          const testResult = {
            type: RESULT_TYPE.True,
            graphNodeId: target.id,
          };

          const scenario = {
            id: uuid(),
            targetType: target.targetType,
            isFeasible: true,
            testResults: [testResult],
            testAssertions: [{ graphNode: source, result: !graphLinks[i].isNotRelation }],
          };
          assertionDictionary.set(target.id, scenario);
        }
      }
    }

    for (let i = 0; i < effectToEffectLinks.length; i++) {
      const link = effectToEffectLinks[i];
      const { source, target } = link;

      assertionDictionary.forEach((value) => {
        if (value.testResults.some((x) => x.graphNodeId === source.id)) {
          const testResult = {
            type: RESULT_TYPE.True,
            graphNodeId: target.id,
          };
          value.testResults.push(testResult);
        }
      });
    }

    return assertionDictionary;
  }

  findBaseScenario(scenarios = [], causeNodes = []) {
    if (scenarios.length > 0) {
      const maxCount = Enumerable.from(scenarios).max(
        (x) => x.testAssertions.filter((y) => causeNodes.some((z) => y.graphNode.id === z.id)).length
      );
      const results = [...scenarios];
      for (let i = 0; i < results.length; i++) {
        const { testAssertions } = results[i];
        const isBaseScenario =
          testAssertions.filter((x) => causeNodes.some((y) => x.graphNode.id === y.id)).length >= maxCount;
        if (isBaseScenario) {
          results[i].isBaseScenario = true;
        }
      }

      return results;
    }

    return scenarios;
  }

  invertedCloneWithExceptId(testScenario, exceptId = null) {
    const cloneAssertions = [];
    const { testAssertions } = testScenario;
    for (let i = 0; i < testAssertions.length; i++) {
      const testAssertion = {
        graphNode: testAssertions[i].graphNode ? { ...testAssertions[i].graphNode } : null,
        testScenario: testAssertions[i].testScenario ? { ...testAssertions[i].testScenario } : null,
        result:
          ((!!testAssertions[i].graphNode && !!exceptId && testAssertions[i].graphNode.id === exceptId) ||
            (!!testAssertions[i].testScenario && !!exceptId && testAssertions[i].testScenario.id === exceptId)) ===
          testAssertions[i].result,
      };

      cloneAssertions.push(testAssertion);
    }

    return {
      ...testScenario,
      testAssertions: cloneAssertions,
    };
  }

  invertedCloneWithExceptIds(testScenario, exceptIds = []) {
    const cloneAssertions = [];
    const { testAssertions } = testScenario;
    const { length } = testAssertions;
    for (let i = 0; i < length; i++) {
      const testAssertion = {
        graphNode: testAssertions[i].graphNode ? { ...testAssertions[i].graphNode } : null,
        testScenario: testAssertions[i].testScenario ? { ...testAssertions[i].testScenario } : null,
        result: !testAssertions[i].result,
      };

      cloneAssertions.push(testAssertion);
    }

    for (let i = 0; i < exceptIds.length; i++) {
      const assertion = cloneAssertions.find((x) => x.graphNode.id === exceptIds[i]);
      if (assertion) {
        assertion.result = !assertion.result;
      }
    }

    return {
      ...testScenario,
      testAssertions: cloneAssertions,
    };
  }

  clone(scenario) {
    return {
      ...scenario,
      testAssertions: [
        ...scenario.testAssertions.map((x) => {
          return { ...x };
        }),
      ],
      testResults: scenario.testResults ? [...scenario.testResults] : [],
    };
  }

  mergeAssertion(currentScenario, otherScennario, parentValue = true) {
    const { testAssertions } = otherScennario;
    const scenarioResult = {
      ...currentScenario,
      isViolated: otherScennario.isViolated,
      isFeasible: otherScennario.isFeasible,
    };
    for (let i = 0; i < testAssertions.length; i++) {
      const value = parentValue === testAssertions[i].result;
      const assertion = currentScenario.testAssertions.find(
        (x) =>
          (!!x.graphNode && x.graphNode.id === testAssertions[i].graphNode.id) ||
          (!!x.testScenario && x.testScenario.id === testAssertions[i].testScenario.id)
      );
      if (assertion && assertion.result !== value) {
        return {
          testScenario: scenarioResult,
          isMergeSuccessfully: false,
        };
      }
      if (!assertion) {
        const testAssertion = {
          graphNode: testAssertions[i].graphNode,
          testScenario: testAssertions[i].testScenario,
          result: value,
        };

        currentScenario.testAssertions.push(testAssertion);
      } else {
        assertion.result = value;
      }
    }

    return {
      testScenario: scenarioResult,
      isMergeSuccessfully: true,
    };
  }

  buildExpectedResultsOfTestScenario(testResults = [], graphNodes = []) {
    let result = '';
    const falseResults = testResults.filter((x) => x.type === RESULT_TYPE.False);
    const basicResults = testResults.filter((x) => x.type === RESULT_TYPE.None || x.type === RESULT_TYPE.True);
    if (basicResults.length === 0) {
      return null;
    }

    const firstBasicResultNode = graphNodes.find((x) => x.id === basicResults[0].graphNodeId);

    result = result.concat(firstBasicResultNode.nodeId);

    for (let i = 1; i < basicResults.length; i++) {
      if (falseResults.some((x) => x.graphNodeId === basicResults[i].graphNodeId)) {
        result = result.concat('!');
      }

      const basicResultNode = graphNodes.find((x) => x.id === basicResults[i].graphNodeId);

      result = `${result}, ${basicResultNode.nodeId}`;
    }

    return result;
  }

  combination(inputs = []) {
    const combinations = []; //
    const { length } = inputs;
    const k = 1 << length;
    for (let i = 0; i < k; i++) {
      const combination = [];
      let count = 0;
      for (count; count < length; count++) {
        const conditionValue = i & (1 << count);
        if (conditionValue > 0) {
          combination.push(inputs[count]);
        }
      }

      if (count > 0 && combination.length > 0) {
        combinations.push(combination);
      }
    }

    return combinations;
  }

  // TODO - implement
  validate(testScenario, otherScenario, trueAssertion) {
    return true;
  }

  applyDeMorgansLaw(testScenario) {
    const result = this._clone(testScenario);
    result.targetType = result.targetType === OPERATOR_TYPE.AND ? OPERATOR_TYPE.OR : OPERATOR_TYPE.AND;
    const { testAssertions } = testScenario;
    for (let i = 0; i < testAssertions.length; i++) {
      const testAssertion = result.testAssertions.find((x) => x.graphNode.id === testAssertions[i].graphNode.id);
      testAssertion.result = !testAssertions[i].result;
    }

    return result;
  }

  unionScenarios(scenarios1 = [], scenarios2 = []) {
    const results = [...scenarios1];
    for (let i = 0; i < scenarios2.length; i++) {
      let isExisted = false;
      for (let j = 0; j < scenarios1.length; j++) {
        if (this._compareScenario(scenarios2[i], scenarios1[j])) {
          isExisted = true;
        }
      }

      if (!isExisted) {
        results.push(scenarios2[i]);
      }
    }

    return results;
  }

  toString(testScenario, graphNodes = []) {
    const testAssertions = Enumerable.from(testScenario.testAssertions)
      .orderBy((x) => x.graphNode.nodeId)
      .where((x) => x.graphNode)
      .toArray();
    let assertionString = '';
    for (let i = 0; i < testAssertions.length; i++) {
      const trueFalseString = testAssertions[i].result ? 'T' : 'F';
      assertionString += `${testAssertions[i].graphNode.nodeId}:${trueFalseString}${
        i === testAssertions.length - 1 ? ', ' : ''
      }`;
    }

    return `${testScenario.id} => ${
      testScenario.targetType
    }{${assertionString}} = ${this.buildExpectedResultsOfTestScenario(testScenario.testResults, graphNodes)}`;
  }

  _compareScenario(scenario1, scenario2) {
    if (!scenario1 || !scenario2) {
      return false;
    }

    if (!this._compareScenarioProperty(scenario1, scenario2, SCENARIO_PROPERTIES.SecnarioType)) {
      return false;
    }

    if (!this._compareScenarioProperty(scenario1, scenario2, SCENARIO_PROPERTIES.IsViolated)) {
      return false;
    }

    if (!this._compareScenarioProperty(scenario1, scenario2, SCENARIO_PROPERTIES.IsFeasible)) {
      return false;
    }

    if (!this._compareTestAssertions(scenario1.testAssertions, scenario2.testAssertions)) {
      return false;
    }

    if (!this._compareTestAssertions(scenario1.testResult, scenario2.testResult)) {
      return false;
    }

    return true;
  }

  _compareScenarioProperty(scenario1, scenario2, propertyName) {
    if (scenario1[propertyName] && scenario2[propertyName] && scenario1[propertyName] !== scenario2[propertyName]) {
      return false;
    }

    return true;
  }

  _compareTestAssertions(testAssertions1 = [], testAssertions2 = []) {
    if (!testAssertions1 || !testAssertions2) {
      return false;
    }

    if (testAssertions1.length !== testAssertions2.length) {
      return false;
    }

    const orderedArray1 = Enumerable.from(testAssertions1)
      .orderBy((x) => x.graphNode.id)
      .toArray();

    const orderedArray2 = Enumerable.from(testAssertions2)
      .orderBy((x) => x.graphNode.id)
      .toArray();

    const isDifferent = orderedArray1.some(
      (x, index) =>
        (!!x.graphNode && !!orderedArray2[index].graphNode && x.graphNode.id !== orderedArray2[index].graphNode.id) ||
        x.result !== orderedArray2[index].result
    );

    if (isDifferent) {
      return false;
    }

    return true;
  }

  _compareTestResults(testResults1 = [], testResults2 = []) {
    if (!testResults1 || !testResults2) {
      return false;
    }

    if (testResults1.length !== testResults2.length) {
      return false;
    }

    const orderedArray1 = Enumerable.from(testResults1)
      .orderBy((x) => x.graphNodeId)
      .toArray();

    const orderedArray2 = Enumerable.from(testResults2)
      .orderBy((x) => x.graphNodeId)
      .toArray();

    const isDifferent = orderedArray1.some(
      (x, index) => x.graphNodeId !== orderedArray2[index].graphNodeId || x.type !== orderedArray2[index].type
    );

    if (isDifferent) {
      return false;
    }

    return true;
  }

  convertToRows(testCases = [], scenarios = [], columns = []) {
    const rows = scenarios.map((scenario) => ({
      ...scenario,
      testCases: testCases.filter((e) => e.testScenarioId === scenario.id),
      isSelected: !testCases.filter((e) => e.testScenarioId === scenario.id).some((x) => !x.isSelected),
    }));

    const testScenarios = rows.map((testScenario, testScenarioIndex) => {
      const testScenarioItem = {};
      testScenarioItem.Name = `TS#${testScenarioIndex + 1}(${testScenario.scenarioType})`;
      testScenarioItem.isSelected = !!testScenario.isSelected;
      testScenarioItem.id = testScenario.id;

      columns.forEach((column) => {
        if (column.key === 'results') {
          testScenarioItem[column.key] = testScenario.expectedResults;
        } else if (column.key === 'isValid' || column.key === 'isBaseScenario') {
          testScenarioItem[column.key] = !!testScenario[column.key];
        } else {
          const testAssertion = testScenario.testAssertions.find((x) => x.graphNode.id === column.key);
          if (testAssertion) {
            testScenarioItem[column.key] = testAssertion.result ? 'T' : 'F';
          } else {
            testScenarioItem[column.key] = '';
          }
        }
      });

      testScenarioItem.testCases = testScenario.testCases.map((testCase, testCaseIndex) => {
        const testCaseItem = {};
        testCaseItem.Name = `TC#${testScenarioIndex + 1}-${testCaseIndex + 1}`;
        testCaseItem.isSelected = !!testCase.isSelected;
        testCaseItem.id = testCase.id;

        columns.forEach((column) => {
          if (column.key === 'results') {
            testCaseItem[column.key] = testCase[column.key].join(', ');
          } else if (column.key === 'isValid' || column.key === 'isBaseScenario') {
            testCaseItem[column.key] = '';
          } else {
            const testData = testCase.testDatas.find((x) => x.graphNodeId === column.key);
            testCaseItem[column.key] = testData ? testData.data : '';
          }
        });

        return testCaseItem;
      });

      return testScenarioItem;
    });

    return testScenarios;
  }

  convertToColumns(graphNodes = [], language) {
    const columns = [
      {
        headerName: 'V',
        key: 'isValid',
      },
      {
        headerName: 'B',
        key: 'isBaseScenario',
      },
    ];

    const orderdCauseNodes = Enumerable.from(graphNodes)
      .where((x) => x.type === GRAPH_NODE_TYPE.CAUSE)
      .orderBy((x) => parseInt(x.nodeId.substr(1, x.nodeId.length), 10))
      .toArray();

    const orderdGroupNodes = Enumerable.from(graphNodes)
      .where((x) => x.type === GRAPH_NODE_TYPE.GROUP)
      .orderBy((x) => parseInt(x.nodeId.substr(1, x.nodeId.length), 10))
      .toArray();

    const orderdGraphNodes = orderdCauseNodes.concat(orderdGroupNodes);
    const graphNodeHeaders = orderdGraphNodes.map((x) => {
      return {
        headerName: x.nodeId,
        key: x.id,
        title: x.definition,
      };
    });

    columns.push({ headerName: language.get('expectedresults'), key: 'results' });
    columns.push(...graphNodeHeaders);

    return columns;
  }
}

export default new TestScenarioHelper();
