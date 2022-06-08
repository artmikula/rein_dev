/* eslint-disable no-bitwise */
import { GRAPH_NODE_TYPE, OPERATOR_TYPE, RESULT_TYPE, SCENARIO_PROPERTIES } from 'features/shared/constants';
import Enumerable from 'linq';
import {
  IGraphLink,
  IGraphNode,
  ITestScenario,
  ITestAssertion,
  ITestResult,
  ISimpleTestScenario,
  SimpleTestScenario,
} from 'types/models';
import { v4 as uuid } from 'uuid';

class TestScenarioStringHelper {
  // calculateAssertionDictionaryOld(graphLinks: IGraphLink[]) {
  //   const assertionDictionary = new Map<string, ITestScenario>();
  //   const effectToEffectRelationList = [];

  //   for (let i = 0; i < graphLinks.length; i++) {
  //     const { source, target } = graphLinks[i];

  //     if (source && source !== null && target && target !== null) {
  //       const scenario = assertionDictionary.get(target.id);
  //       if (source.type === GRAPH_NODE_TYPE.EFFECT) {
  //         effectToEffectRelationList.push(graphLinks[i]);
  //       } else if (scenario) {
  //         const assertion = {
  //           graphNode: source,
  //           result: !graphLinks[i].isNotRelation,
  //         };
  //         scenario.testAssertions.push(assertion);
  //       } else {
  //         const testResult = {
  //           type: RESULT_TYPE.True,
  //           graphNodeId: target.id,
  //         };

  //         const scenario = {
  //           id: uuid(),
  //           targetType: target.targetType,
  //           isFeasible: true,
  //           testResults: [testResult],
  //           testAssertions: [{ graphNode: source, result: !graphLinks[i].isNotRelation }],
  //         };
  //         assertionDictionary.set(target.id, scenario);
  //       }
  //     }
  //   }

  //   for (let i = 0; i < effectToEffectRelationList.length; i++) {
  //     const link = effectToEffectRelationList[i];
  //     const { source, target } = link;

  //     assertionDictionary.forEach((value) => {
  //       if (value.testResults.some((x) => x.graphNodeId === source.id)) {
  //         const testResult = {
  //           type: RESULT_TYPE.True,
  //           graphNodeId: target.id,
  //         };
  //         value.testResults.push(testResult);
  //       }
  //     });
  //   }

  //   return assertionDictionary;
  // }

  buildExpectedResultsOfTestScenario(testResults: ISimpleTestScenario, graphNodes: IGraphNode[] = []) {
    let result = '';
    const falseResults = testResults.filter((x) => x.type === RESULT_TYPE.False);
    const basicResults = testResults.filter((x) => x.type === RESULT_TYPE.None || x.type === RESULT_TYPE.True);
    if (basicResults.length === 0) {
      return null;
    }

    const firstBasicResultNode = graphNodes.find((x) => x.id === basicResults[0].graphNodeId);

    if (firstBasicResultNode?.nodeId) {
      result = result.concat(firstBasicResultNode.nodeId);
    }

    for (let i = 1; i < basicResults.length; i++) {
      if (falseResults.some((x) => x.graphNodeId === basicResults[i].graphNodeId)) {
        result = result.concat('!');
      }

      const basicResultNode = graphNodes.find((x) => x.id === basicResults[i].graphNodeId);

      result = `${result}, ${basicResultNode?.nodeId}`;
    }

    return result;
  }

  toString(testScenario: ISimpleTestScenario, graphNodes: IGraphNode[] = []) {
    const testAssertions = Enumerable.from(testScenario.testAssertions)
      .orderBy((x) => x.graphNode?.nodeId)
      .where((x) => !!x.graphNode)
      .toArray();
    let assertionString = '';
    for (let i = 0; i < testAssertions.length; i++) {
      const trueFalseString = testAssertions[i].result ? 'T' : 'F';
      assertionString += `${testAssertions[i].graphNode?.nodeId}:${trueFalseString}${
        i === testAssertions.length - 1 ? ', ' : ''
      }`;
    }

    return `${testScenario.id} => ${
      testScenario.targetType
    }{${assertionString}} = ${this.buildExpectedResultsOfTestScenario(testScenario, graphNodes)}`;
  }

  _compareScenario(scenario1: ITestScenario, scenario2: ITestScenario) {
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

    // TODO: check this
    if (!this._compareTestAssertions(scenario1.testResult, scenario2.testResult)) {
      return false;
    }

    return true;
  }

  _compareScenarioProperty(scenario1: any, scenario2: any, propertyName: string) {
    if (scenario1[propertyName] && scenario2[propertyName] && scenario1[propertyName] !== scenario2[propertyName]) {
      return false;
    }

    return true;
  }

  _compareTestAssertions(testAssertions1: ITestAssertion[] = [], testAssertions2: ITestAssertion[] = []) {
    if (!testAssertions1 || !testAssertions2) {
      return false;
    }

    if (testAssertions1.length !== testAssertions2.length) {
      return false;
    }

    const orderedArray1 = Enumerable.from(testAssertions1)
      .orderBy((x) => x.graphNode?.id)
      .toArray();

    const orderedArray2 = Enumerable.from(testAssertions2)
      .orderBy((x) => x.graphNode?.id)
      .toArray();

    const isDifferent = orderedArray1.some(
      (x, index) =>
        (!!x.graphNode && !!orderedArray2[index].graphNode && x.graphNode.id !== orderedArray2[index].graphNode?.id) ||
        x.result !== orderedArray2[index].result
    );

    if (isDifferent) {
      return false;
    }

    return true;
  }

  _compareTestResults(testResults1: any[] = [], testResults2: any[] = []) {
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

  convertToRows(testCases: any[] = [], scenarios: ITestScenario[] = [], columns: any[] = []) {
    const rows = scenarios.map((scenario) => ({
      ...scenario,
      testCases: testCases.filter((e) => e.testScenarioId === scenario.id),
      isSelected: !testCases.filter((e) => e.testScenarioId === scenario.id).some((x) => !x.isSelected),
    }));

    const testScenarios = rows.map((testScenario: any, testScenarioIndex: number) => {
      const testScenarioItem: any = {};
      testScenarioItem.Name = `TS#${testScenarioIndex + 1}(${testScenario.scenarioType})`;
      testScenarioItem.isSelected = !!testScenario.isSelected;
      testScenarioItem.id = testScenario.id;
      testScenarioItem.isViolated = testScenario.isViolated;

      columns.forEach((column) => {
        if (column.key === 'results') {
          testScenarioItem[column.key] = testScenario.expectedResults;
        } else if (column.key === 'isValid' || column.key === 'isBaseScenario') {
          testScenarioItem[column.key] = !!testScenario[column.key];
        } else {
          const testAssertion = testScenario.testAssertions.find((x: any) => x.graphNode.id === column.key);
          if (testAssertion) {
            testScenarioItem[column.key] = testAssertion.result ? 'T' : 'F';
          } else {
            testScenarioItem[column.key] = '';
          }
        }
      });

      testScenarioItem.testCases = testScenario.testCases.map((testCase: any, testCaseIndex: number) => {
        const testCaseItem: any = {};
        testCaseItem.Name = `TC#${testScenarioIndex + 1}-${testCaseIndex + 1}`;
        testCaseItem.isSelected = !!testCase.isSelected;
        testCaseItem.id = testCase.id;

        columns.forEach((column) => {
          if (column.key === 'results') {
            testCaseItem[column.key] = testCase[column.key].join(', ');
          } else if (column.key === 'isValid' || column.key === 'isBaseScenario') {
            testCaseItem[column.key] = '';
          } else {
            const testData = testCase.testDatas.find((x: any) => x.graphNodeId === column.key);
            testCaseItem[column.key] = testData ? testData.data : '';
          }
        });

        return testCaseItem;
      });

      return testScenarioItem;
    });

    return testScenarios;
  }

  convertToColumns(graphNodes: IGraphNode[] = [], language: any) {
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

export default new TestScenarioStringHelper();
