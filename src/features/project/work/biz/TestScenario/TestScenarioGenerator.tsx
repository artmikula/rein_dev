/* eslint-disable no-bitwise */
import { GRAPH_NODE_TYPE } from 'features/shared/constants';
import {
  IGraphLink,
  ITestScenario,
  ITestAssertion,
  ISimpleTestScenario,
  SimpleTestScenario,
  IGraphNode,
} from 'types/models';
import FlattenScenarioProcess from './FlattenScenarioProcess';

class TestScenarioGenerator {
  calculateScenarioDictionary(graphLinks: IGraphLink[], effectNodes: IGraphNode[]) {
    // original: calculateAssertionDictionary
    // Return: list of scenarios
    // Assertions: key, targetNodeId, targetType, isEffectAssertion, resultType, scenarioId, testAssertions
    // TestAssertions: nodeId, value

    const scenarioDictionary = new Map<string, ISimpleTestScenario>();

    // currently we do not suppport relation "Effect to Effect", so remove this handle
    // const effectToEffectRelationList = [];

    for (let i = 0; i < graphLinks.length; i++) {
      const { source, target } = graphLinks[i];

      const validLink = !!source && !!target && source.type !== GRAPH_NODE_TYPE.EFFECT;

      if (validLink) {
        const scenario = scenarioDictionary.get(target.id);

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
          scenarioDictionary.set(key, scenario);
        }
      }
    }

    // Log for debug mode
    // const w: any = window;
    // if (w.isDebugMode) {
    //   console.log('ASSERTIONS');
    //   scenarioDictionary.forEach((value) => console.log(this.getExpressionString(value)));
    // }

    return scenarioDictionary;
  }

  /* TODO: need check again, because there's no references */
  getExpressionString(scenario: ISimpleTestScenario) {
    return `${scenario.targetType}(${scenario.testAssertions.map(
      (x: ITestAssertion) => `${x.nodeId}:${x.result === true ? 'T' : 'F'}`
    )}) = ${scenario.result ? '' : '!'}${scenario.targetNodeId}`;
  }

  generateScenariosForEffectNodes(
    scenarioDictionary: Map<string, ISimpleTestScenario>,
    showOmmittedTestCases = false
  ): ISimpleTestScenario[] {
    // assertionDictionary: all assertions for Effect, Group
    // Ex: Or(C2:F,C1:T) = E1
    //     Or(G1:F) = E2
    //     And(C4:T,C3:T) = G1
    // After reduce, there are only effect assertion without groups
    //     Or(C2:F,C1:T) = E1
    //     Or((And(C4:T,C3:T)):F) = E2

    const resultList: ISimpleTestScenario[] = [];
    const scenarios = Array.from(scenarioDictionary.values());
    const effectScenarios = scenarios.filter((x) => x.targetNodeId.startsWith('E'));
    // const groupScenarios = scenarios.filter((x) => x.targetNodeId.startsWith('G'));

    for (let i = 0; i < effectScenarios.length; i++) {
      const scenario = effectScenarios[i];
      const process = new FlattenScenarioProcess(scenario, scenarioDictionary, showOmmittedTestCases);
      process.run();

      process.resultList.forEach((tc) => {
        resultList.push(tc);
      });
    }

    // console.log('RESULT SCENARIOS', resultList);
    // resultList.forEach((value) => console.log(this.getExpressionString(value)));

    return resultList;
  }

  /* TODO: need check again, because there's no references */
  getAssertions(scenario: ISimpleTestScenario, expectedResult: boolean): ITestAssertion[] {
    if (!expectedResult) {
      // apply DeMorganLaw to invert assertions if expected result is FALSE
      return scenario.testAssertions.map((x) => {
        return { ...x, result: !x.result };
      });
    }

    return scenario.testAssertions;
  }

  /* TODO: need check again, because there's no references */
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

  buildExpectedResultsOfTestScenario(scenario: ISimpleTestScenario) {
    if (!scenario.result) {
      return `!${scenario.targetNodeId}`;
    }

    return scenario.targetNodeId;
  }

  /* TODO: need check again, because there's no references */
  combination(inputs = []) {
    const combinations: any[] = []; //
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
}

export default new TestScenarioGenerator();
