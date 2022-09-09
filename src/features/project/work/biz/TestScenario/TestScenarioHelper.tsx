/* eslint-disable max-lines */
/* eslint-disable no-bitwise */
import { GRAPH_NODE_TYPE, OPERATOR_TYPE, RESULT_TYPE, SCENARIO_PROPERTIES } from 'features/shared/constants';
import Enumerable from 'linq';
import { ITestCaseRow, ITestScenarioAndCaseColumn, ITestScenarioAndCaseRow } from 'types/bizModels';
import {
  IGraphLink,
  IGraphNode,
  ITestScenario,
  ITestAssertion,
  ITestResult,
  ISimpleTestScenario,
  ITestCase,
  ITestData,
} from 'types/models';
import { v4 as uuid } from 'uuid';

interface IRow extends ISimpleTestScenario {
  testCases: ITestCase[];
}

class TestScenarioHelper {
  /* TODO: need check again, because there's no references */
  buildAssertionDictionary(graphLinks: IGraphLink[]) {
    // CalculateAssertionDictionary
    const assertionDictionary = new Map<string, ITestScenario>();
    const effectToEffectRelationList: IGraphLink[] = [];

    for (let i = 0; i < graphLinks.length; i++) {
      const { source, target } = graphLinks[i];

      if (source && source !== null && target && target !== null) {
        const scenario = assertionDictionary.get(target.id);
        if (source.type === GRAPH_NODE_TYPE.EFFECT) {
          effectToEffectRelationList.push(graphLinks[i]);
        } else if (scenario) {
          const assertion = {
            graphNodeId: source.id,
            graphNode: source,
            result: !graphLinks[i].isNotRelation,
          };
          scenario.testAssertions.push(assertion);
        } else {
          const testResult = {
            type: RESULT_TYPE.True,
            graphNodeId: target.id,
          };

          const scenario: ITestScenario = {
            id: uuid(),
            targetType: target.targetType,
            isFeasible: true,
            testResults: [testResult],
            testAssertions: [{ graphNodeId: source.id, graphNode: source, result: !graphLinks[i].isNotRelation }],
          };
          assertionDictionary.set(target.id, scenario);
        }
      }
    }

    for (let i = 0; i < effectToEffectRelationList.length; i++) {
      const link = effectToEffectRelationList[i];
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

  /* TODO: need check again, because there's no references */
  findBaseScenario(scenarios: ITestScenario[] = [], causeNodes: IGraphNode[] = []) {
    if (scenarios.length > 0) {
      const maxCount = Enumerable.from(scenarios).max(
        (x) => x.testAssertions.filter((y) => causeNodes.some((z) => y.graphNode?.id === z.id)).length
      );
      const results = [...scenarios];
      for (let i = 0; i < results.length; i++) {
        const { testAssertions } = results[i];
        const isBaseScenario =
          testAssertions.filter((x) => causeNodes.some((y) => x.graphNode?.id === y.id)).length >= maxCount;
        if (isBaseScenario) {
          results[i].isBaseScenario = true;
        }
      }

      return results;
    }

    return scenarios;
  }

  /* TODO: need check again, testScenario should not exist in testAssertion */
  invertedCloneWithExceptId(testScenario: ITestScenario, exceptId = null) {
    const cloneAssertions: ITestAssertion[] = [];
    const { testAssertions } = testScenario;
    for (let i = 0; i < testAssertions.length; i++) {
      const testAssertion: any = {
        graphNodeId: testAssertions[i].graphNodeId,
        // graphNode: testAssertions[i].graphNode ? { ...testAssertions[i].graphNode } : null,
        testScenario: testAssertions[i].testScenario ? { ...testAssertions[i].testScenario } : undefined,
        result:
          ((!!testAssertions[i].graphNode && !!exceptId && testAssertions[i].graphNode?.id === exceptId) ||
            (!!testAssertions[i].testScenario && !!exceptId && testAssertions[i].testScenario?.id === exceptId)) ===
          testAssertions[i].result,
      };

      cloneAssertions.push(testAssertion);
    }

    return {
      ...testScenario,
      testAssertions: cloneAssertions,
    };
  }

  /* TODO: need check again, because there's no references */
  invertedCloneWithExceptIds(testScenario: ITestScenario, exceptIds = []) {
    const cloneAssertions: ITestAssertion[] = [];
    const { testAssertions } = testScenario;
    const { length } = testAssertions;
    for (let i = 0; i < length; i++) {
      const testAssertion: any = {
        graphNode: testAssertions[i].graphNode ? { ...testAssertions[i].graphNode } : null,
        testScenario: testAssertions[i].testScenario ? { ...testAssertions[i].testScenario } : null,
        result: !testAssertions[i].result,
      };

      cloneAssertions.push(testAssertion);
    }

    for (let i = 0; i < exceptIds.length; i++) {
      const assertion = cloneAssertions.find((x) => x.graphNode?.id === exceptIds[i]);
      if (assertion) {
        assertion.result = !assertion.result;
      }
    }

    return {
      ...testScenario,
      testAssertions: cloneAssertions,
    };
  }

  invertedCloneSimple(testScenario: ISimpleTestScenario, exceptIds: any = []) {
    const cloneAssertions: ITestAssertion[] = [];
    const { testAssertions } = testScenario;
    const { length } = testAssertions;
    for (let i = 0; i < length; i++) {
      const isExept = exceptIds.includes(testAssertions[i].nodeId);

      // const scenario = testAssertions[i].testScenarioId ? { ...testAssertions[i].testScenario } : null;

      const testAssertion: ITestAssertion = {
        ...testAssertions[i],
        // testScenarioId: scenario?.id,
        result: isExept ? testAssertions[i].result : !testAssertions[i].result,
      };

      cloneAssertions.push(testAssertion);
    }

    return {
      ...testScenario,
      id: uuid(),
      testAssertions: cloneAssertions,
    };
  }

  clone(scenario: ITestScenario) {
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

  mergeAssertion(currentScenario: ITestScenario, otherScenario: ITestScenario, parentValue = true) {
    const { testAssertions } = otherScenario;
    const scenarioResult = {
      ...currentScenario,
      isViolated: otherScenario.isViolated,
      isFeasible: otherScenario.isFeasible,
    };
    for (let i = 0; i < testAssertions.length; i++) {
      const value = parentValue === testAssertions[i].result;
      const assertion: ITestAssertion | undefined = currentScenario.testAssertions.find(
        (x) =>
          (!!x.graphNode && x.graphNode.id === testAssertions[i].graphNode?.id) ||
          (!!x.testScenario && x.testScenario.id === testAssertions[i].testScenario?.id)
      );
      if (assertion && assertion.result !== value) {
        return {
          testScenario: scenarioResult,
          isMergeSuccessfully: false,
        };
      }
      if (!assertion) {
        const testAssertion: ITestAssertion = {
          graphNodeId: testAssertions[i].graphNode?.id || testAssertions[i].graphNodeId,
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

  mergeTestAssertions(currentScenario: ISimpleTestScenario, otherScennario: ISimpleTestScenario, parentValue = true) {
    const { testAssertions } = otherScennario;
    const scenarioResult = {
      ...currentScenario,
      id: uuid(),
      isViolated: otherScennario.isViolated,
      isFeasible: otherScennario.isFeasible,
    };
    for (let i = 0; i < testAssertions.length; i++) {
      const value = parentValue === testAssertions[i].result;
      const assertion = currentScenario.testAssertions.find(
        (x) =>
          (!!x.graphNodeId && x.graphNodeId === testAssertions[i].graphNodeId) ||
          (!!x.testScenarioId && x.testScenarioId === testAssertions[i].testScenarioId)
      );
      if (assertion && assertion.result !== value) {
        return {
          testScenario: scenarioResult,
          isMergeSuccessfully: false,
        };
      }

      if (!assertion) {
        const testAssertion = {
          nodeId: testAssertions[i].nodeId,
          graphNodeId: testAssertions[i].graphNodeId,
          // testScenario: testAssertions[i].testScenario,
          testScenarioId: testAssertions[i].testScenarioId,
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

  buildExpectedResultsOfTestScenario(testResults: ITestResult[] = [], graphNodes: IGraphNode[] = []) {
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

  combination(inputs: any[] = []) {
    const combinations: any[] = [];
    const { length } = inputs;
    const k = 1 << length;
    for (let i = 0; i < k; i++) {
      const combination: any[] = [];
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

  // TODO: - implement
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  validate(testScenario: any, otherScenario: any, trueAssertion: any) {
    return true;
  }

  applyDeMorgansLaw(testScenario: ITestScenario) {
    const result = this.clone(testScenario);
    result.targetType = result.targetType === OPERATOR_TYPE.AND ? OPERATOR_TYPE.OR : OPERATOR_TYPE.AND;
    const { testAssertions } = testScenario;
    for (let i = 0; i < testAssertions.length; i++) {
      const testAssertion = result.testAssertions.find(
        (testAssertion) => testAssertion.graphNodeId === testAssertions[i].graphNodeId
      );
      if (testAssertion) {
        testAssertion.result = !testAssertions[i].result;
      }
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

  /* TODO: need check again, because there's no references */
  toString(testScenario: ITestScenario, graphNodes: IGraphNode[] = []) {
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
    }{${assertionString}} = ${this.buildExpectedResultsOfTestScenario(testScenario.testResults, graphNodes)}`;
  }

  _compareScenario(scenario1: ITestScenario, scenario2: ITestScenario) {
    if (!scenario1 || !scenario2) {
      return false;
    }

    if (!this._compareScenarioProperty(scenario1, scenario2, SCENARIO_PROPERTIES.ScenarioType)) {
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
    if (!this._compareTestAssertions(scenario1.testAssertions, scenario2.testAssertions)) {
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

  /* TODO: need check again, because there's no references */
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

  convertToRows(
    testCases: ITestCase[] = [],
    scenarios: ISimpleTestScenario[] = [],
    columns: ITestScenarioAndCaseColumn[] = [],
    graphNodes: IGraphNode[] = []
  ) {
    const rows: IRow[] = scenarios.map((scenario) => ({
      ...scenario,
      testCases: testCases.filter((e) => e.testScenarioId === scenario.id),
      isSelected: !testCases.filter((e) => e.testScenarioId === scenario.id).some((x) => !x.isSelected),
    }));

    const testScenarios: ITestScenarioAndCaseRow[] = rows.map((testScenario, testScenarioIndex: number) => {
      const testScenarioItem: ITestScenarioAndCaseRow = {
        Name: `TS#${testScenarioIndex + 1}(${testScenario.scenarioType})`,
        isSelected: !!testScenario.isSelected,
        id: testScenario.id,
        isViolated: testScenario.isViolated,
        sourceTargetType: testScenario.sourceTargetType,
        resultType: testScenario.resultType ?? RESULT_TYPE.True,
        effectDefinition:
          graphNodes.find((graphNode) => graphNode.nodeId === testScenario.expectedResults)?.definition ?? '',
      };

      columns.forEach((column) => {
        if (column.key === 'results') {
          testScenarioItem[column.key] = testScenario.expectedResults;
        } else if (column.key === 'isValid' || column.key === 'isBaseScenario') {
          testScenarioItem[column.key] = !!testScenario[column.key];
        } else {
          const testAssertion = testScenario.testAssertions.find((x: ITestAssertion) => x.graphNodeId === column.key);
          if (testAssertion) {
            testScenarioItem[column.key] = testAssertion.result ? 'T' : 'F';
          } else {
            testScenarioItem[column.key] = '';
          }
        }
      });

      testScenarioItem.testAssertions = testScenario.testAssertions.map(
        ({ graphNodeId, result }: { graphNodeId: string; result: boolean }) => {
          const causeNode = graphNodes.find((graphNode) => graphNode.id === graphNodeId);
          return {
            graphNodeId,
            nodeId: causeNode?.nodeId ?? '',
            definition: causeNode?.definition ?? '',
            result,
          };
        }
      );

      testScenarioItem.testCases = testScenario.testCases.map((testCase: ITestCase, testCaseIndex: number) => {
        const testCaseItem: ITestCaseRow = {
          id: testCase.id,
          Name: `TC#${testScenarioIndex + 1}-${testCaseIndex + 1}`,
          isSelected: !!testCase.isSelected,
        };

        columns.forEach((column) => {
          if (column.key === 'results') {
            testCaseItem[column.key] = testCase[column.key].join(', ');
          } else if (column.key === 'isValid' || column.key === 'isBaseScenario') {
            testCaseItem[column.key] = '';
          } else {
            const testData = testCase.testDatas.find((x: ITestData) => x.graphNodeId === column.key);
            testCaseItem[column.key] = testData ? testData.data : '';
          }
        });

        return testCaseItem;
      });

      return testScenarioItem;
    });

    return testScenarios;
  }

  convertToColumns(graphNodes: IGraphNode[] = [], language: any): ITestScenarioAndCaseColumn[] {
    const columns: ITestScenarioAndCaseColumn[] = [
      {
        headerName: 'V',
        key: 'isValid',
      },
      {
        headerName: 'B',
        key: 'isBaseScenario',
      },
    ];

    const orderedCauseNodes = Enumerable.from(graphNodes)
      .where((x) => x.type === GRAPH_NODE_TYPE.CAUSE)
      .orderBy((x) => parseInt(x.nodeId.substr(1, x.nodeId.length), 10))
      .toArray();

    const orderedGroupNodes = Enumerable.from(graphNodes)
      .where((x) => x.type === GRAPH_NODE_TYPE.GROUP)
      .orderBy((x) => parseInt(x.nodeId.substr(1, x.nodeId.length), 10))
      .toArray();

    const orderedGraphNodes = orderedCauseNodes.concat(orderedGroupNodes);
    const graphNodeHeaders = orderedGraphNodes.map((x) => {
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
