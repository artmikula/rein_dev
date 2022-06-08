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
import TestScenarioStringHelper from './TestScenarioStringHelper';

class TestScenarioHelper {
  graphNodes: any[] = [];

  calculateAssertionDictionary(graphLinks: IGraphLink[], effectNodes: any[]) {
    // Return: list of assertions
    // Assertions: key, targetNodeId, targetType, isEffectAssertion, resultType, scenarioId, testAssertions
    // TestAssertions: nodeId, value

    const assertionDictionary = new Map<string, ISimpleTestScenario>();

    // currently we do not suppport relation "Effect to Effect", so remove this handle
    // const effectToEffectRelationList = [];

    for (let i = 0; i < graphLinks.length; i++) {
      const { source, target } = graphLinks[i];

      const validLink = !!source && !!target && source.type !== GRAPH_NODE_TYPE.EFFECT;

      if (validLink) {
        const scenario = assertionDictionary.get(target.id);

        // add to exist scenario when has multiple link to 1 targets
        if (scenario) {
          const assertion = {
            // graphNode: source,
            graphNodeId: source.id,
            nodeId: source.nodeId,
            result: !graphLinks[i].isNotRelation,
          };
          scenario.testAssertions.push(assertion);
        } else {
          const key = target.id;
          const scenario = new SimpleTestScenario(
            target,
            effectNodes.some((y) => y.id === key),
            [{ graphNodeId: source.id, nodeId: source.nodeId, result: !graphLinks[i].isNotRelation }]
          );
          assertionDictionary.set(key, scenario);
        }
      }
    }

    // Log for debug mode
    const w: any = window;
    if (w.isDebugMode) {
      console.log('ASSERTIONS');
      assertionDictionary.forEach((value: any) => {
        const str = value.toString ? value.toString() : '';
        console.log(str);
      });
    }

    return assertionDictionary;
  }

  // Flat OR expression to multiple assertions
  mergeScenarioFragmentsRoot(
    assertionDictionary: Map<string, ISimpleTestScenario> = new Map(),
    scenario: ISimpleTestScenario,
    graphNodes: any[]
  ) {
    this.graphNodes = graphNodes;
    return this.mergeScenarioFragments(assertionDictionary, scenario);
  }

  mergeScenarioFragments(
    assertionDictionary: Map<string, ISimpleTestScenario> = new Map(),
    testScenario: ISimpleTestScenario,
    showReducedScenariosAndCases = false,
    relationIsTrue = true
  ) {
    const results: any[] = [];

    // const clone = relationIsTrue ? testScenario : testScenario.invertedClone();
    // const operatorAndOr = clone.targetType === OPERATOR_TYPE.AND ? OPERATOR_TYPE.OR : OPERATOR_TYPE.AND;
    // clone.targetType = relationIsTrue ? clone.targetType : operatorAndOr;

    // if (clone.targetType === OPERATOR_TYPE.AND) {
    //   results.push(clone);
    //   const { testAssertions } = clone;
    //   for (let i = 0; i < testAssertions.length; i++) {
    //     const testScenario = assertionDictionary.get(testAssertions[i].graphNodeId);
    //     if (testScenario) {
    //       const subsets = this.mergeScenarioFragments(
    //         assertionDictionary,
    //         testScenario,
    //         relationIsTrue === testAssertions[i].result
    //       );
    //       const limitedLength = results.length;
    //       for (let j = 0; j < limitedLength; j++) {
    //         for (let k = 0; k < subsets.length; k++) {
    //           let merged = this.cloneSimple(results[0]);
    //           const mergedResult = this.mergeAssertionSimple(merged, subsets[k]);
    //           if (mergedResult.isMergeSuccessfully) {
    //             merged = mergedResult.testScenario;
    //             if (
    //               !results.some(
    //                 (x) =>
    //                   TestScenarioStringHelper.toString(x, this.graphNodes) ===
    //                   TestScenarioStringHelper.toString(merged, this.graphNodes)
    //               )
    //             ) {
    //               results.push(merged);
    //             }
    //           }
    //         }

    //         results.splice(0, 1);
    //       }
    //     } else {
    //       for (let j = 0; j < results.length; j++) {
    //         const item = results[j].testAssertions.find((x) => x.graphNode.id === testAssertions[i].graphNode.id);
    //         if (item) {
    //           item.result = testAssertions[i].result;
    //         } else {
    //           const testAssertion = {
    //             graphNode: testAssertions[i].graphNode,
    //             result: testAssertions[i].result,
    //           };
    //           if (
    //             !results[j].testAssertions.some((x) => x.graphNode && x.graphNode.id === testAssertion.graphNode.id)
    //           ) {
    //             results[j].testAssertions.push(testAssertion);
    //           }
    //         }
    //       }
    //     }
    //   }
    // } else {
    //   const combinationArray = this.combination(clone.testAssertions.map((x) => x.graphNode.id));
    //   const combinations = Enumerable.from(combinationArray).groupBy((x) => x.length);
    //   if (testScenario.targetType === OPERATOR_TYPE.AND) {
    //     combinations.forEach((combination) => {
    //       combination.forEach((excepts) => {
    //         const inverted = this.invertedCloneWithExceptIds(clone, excepts);
    //         inverted.targetType = OPERATOR_TYPE.AND;
    //         results.push(...this.mergeScenarioFragments(assertionDictionary, inverted, showReducedScenariosAndCases));
    //       });
    //     });
    //   } else {
    //     const first = combinations.first();
    //     first.forEach((exceptIds) => {
    //       const inverted = this.invertedCloneWithExceptIds(clone, exceptIds);
    //       inverted.targetType = OPERATOR_TYPE.AND;
    //       results.push(...this.mergeScenarioFragments(assertionDictionary, inverted, showReducedScenariosAndCases));
    //     });

    //     if (showReducedScenariosAndCases && combinations.count() > 1) {
    //       const last = combinations.last();
    //       last.forEach((exceptIds) => {
    //         const inverted = this.invertedCloneWithExceptIds(clone, exceptIds);
    //         inverted.targetType = OPERATOR_TYPE.AND;
    //         results.push(...this.mergeScenarioFragments(assertionDictionary, inverted, showReducedScenariosAndCases));
    //       });
    //     }
    //   }
    // }

    return results;
  }

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

  invertedCloneWithExceptId(testScenario: ISimpleTestScenario, exceptId = null) {
    const cloneAssertions = [];
    const { testAssertions } = testScenario;
    for (let i = 0; i < testAssertions.length; i++) {
      const testAssertion = {
        graphNode: testAssertions[i].graphNode ? { ...testAssertions[i].graphNode } : null,
        testScenario: testAssertions[i].testScenario ? { ...testAssertions[i].testScenario } : null,
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

  cloneSimple(scenario: ISimpleTestScenario) {
    return {
      ...scenario,
      testAssertions: [
        ...scenario.testAssertions.map((x) => {
          return { ...x };
        }),
      ],
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

  mergeAssertionSimple(currentScenario: ISimpleTestScenario, otherScennario: ISimpleTestScenario, parentValue = true) {
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

  mergeAssertion(currentScenario: ITestScenario, otherScennario: ITestScenario, parentValue = true) {
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

  combination(inputs = []) {
    const combinations = []; //
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

  // TODO - implement
  validate(testScenario: any, otherScenario: any, trueAssertion: any) {
    return true;
  }

  applyDeMorgansLaw(testScenario: ITestScenario) {
    const result = this.clone(testScenario);
    result.targetType = result.targetType === OPERATOR_TYPE.AND ? OPERATOR_TYPE.OR : OPERATOR_TYPE.AND;
    const { testAssertions } = testScenario;
    for (let i = 0; i < testAssertions.length; i++) {
      const testAssertion = result.testAssertions.find((x) => x.graphNode?.id === testAssertions[i].graphNode?.id);
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

export default new TestScenarioHelper();
