/* eslint-disable no-bitwise */
import { CONSTRAINT_TYPE, NODE_INSPECTION, RESULT_TYPE, TEST_SCENARIO_TYPE } from 'features/shared/constants';
import Enumerable from 'linq';
import { IConstraint, IGraphNode, INodeConstraint, ISimpleTestScenario } from 'types/models';
import constraintHelper from '../Constraint';

class TestScenarioInspector {
  runInspections(
    causeNodes: IGraphNode[],
    groupNodes: IGraphNode[],
    effectNodes: IGraphNode[],
    constraints: IConstraint[],
    tmpScenarioList: ISimpleTestScenario[],
    showReducedScenariosAndCases: boolean
  ) {
    let inspectionDictionary: Map<string, number> = new Map();
    const causeGroupInspection =
      NODE_INSPECTION.DisconnectedNode | NODE_INSPECTION.MissingIsRelation | NODE_INSPECTION.MissingNotRelation;
    const effectInspection = NODE_INSPECTION.DisconnectedNode;

    for (let i = 0; i < causeNodes.length; i++) {
      inspectionDictionary.set(causeNodes[i].id, causeGroupInspection);
    }

    for (let i = 0; i < groupNodes.length; i++) {
      inspectionDictionary.set(groupNodes[i].id, causeGroupInspection);
    }

    for (let i = 0; i < effectNodes.length; i++) {
      inspectionDictionary.set(effectNodes[i].id, effectInspection);
    }

    const orderedTestScenarios = Enumerable.from(tmpScenarioList)
      .orderBy((x) => x.expectedResults)
      .toArray();

    let testScenarios: ISimpleTestScenario[] = [];

    for (let i = 0; i < orderedTestScenarios.length; i++) {
      // add condition in option ShowReducedScenariosAndCases
      const scenario = orderedTestScenarios[i];
      scenario.scenarioType = TEST_SCENARIO_TYPE.Myers;

      if (showReducedScenariosAndCases || !scenario.isViolated) {
        // oderedTestScenarios[i].id = ++index;
        const scenarioInspection = this._inspectScenario(scenario, inspectionDictionary);
        scenario.isViolated = scenarioInspection.violated;
        inspectionDictionary = scenarioInspection.inspectionDictionary;

        if (!scenario.isViolated || (scenario.isViolated && showReducedScenariosAndCases)) {
          testScenarios.push(scenario);
        }
      }
    }

    const scenarioInspection = this._inspectEffectRelation(testScenarios, constraints, inspectionDictionary);

    testScenarios = scenarioInspection.scenarios;
    inspectionDictionary = scenarioInspection.inspectionDictionary;

    return {
      testScenarios,
      inspectionDictionary,
    };
  }

  _inspectScenario(
    scenario: ISimpleTestScenario,
    inspectionDictionary: Map<string, any> = new Map(),
    constraints: IConstraint[] = []
  ) {
    const { testAssertions, isViolated, targetGraphNodeId: resultGraphNodeId } = scenario;

    let violated = isViolated;

    for (let i = 0; i < testAssertions.length; i++) {
      const inspection = inspectionDictionary.get(testAssertions[i].graphNodeId) & ~NODE_INSPECTION.DisconnectedNode;
      inspectionDictionary.set(testAssertions[i].graphNodeId, inspection);
      if (testAssertions[i].result) {
        inspectionDictionary.set(testAssertions[i].graphNodeId, inspection & ~NODE_INSPECTION.MissingIsRelation);
      } else {
        inspectionDictionary.set(testAssertions[i].graphNodeId, inspection & ~NODE_INSPECTION.MissingNotRelation);
      }
    }

    for (let i = 0; i < constraints.length; i++) {
      const validation = constraintHelper.validate(constraints[i], scenario);
      if (validation !== NODE_INSPECTION.None) {
        const nodes = constraints[i].nodes.filter((x: INodeConstraint) =>
          scenario.testAssertions.some((y) => x.graphNodeId === y.graphNodeId)
        );

        nodes.forEach((item: INodeConstraint) => {
          const newValidation = inspectionDictionary.get(item.graphNodeId) | validation;
          inspectionDictionary.set(item.graphNodeId, newValidation);
        });

        violated = true;
      }
    }

    const inspection = inspectionDictionary.get(resultGraphNodeId) & ~NODE_INSPECTION.DisconnectedNode;
    inspectionDictionary.set(resultGraphNodeId, inspection);

    return {
      violated,
      inspectionDictionary,
    };
  }

  _inspectEffectRelation(
    scenarios: ISimpleTestScenario[],
    originConstraints: IConstraint[],
    inspectionDictionary = new Map()
  ) {
    // remove handle for effectToEffectLinks because currently we do not have this kind of links

    const constraints = originConstraints.filter((x) => x.type === CONSTRAINT_TYPE.MASK);
    for (let i = 0; i < constraints.length; i++) {
      const source = constraints[i].nodes[0];
      const target = constraints[i].nodes[1];
      const scenarioList = scenarios.filter((x) => x.targetGraphNodeId === source.graphNodeId);
      // testResults.some((y) => y.graphNodeId === source.graphNodeId));
      for (let j = 0; j < scenarioList.length; j++) {
        const isExistedFalseResult = scenarioList[j].result === false;
        // const isExistedFalseResult = scenarioList[j].testResults.some(
        //   (x) => x.graphNodeId === target.graphNodeId && x.type === RESULT_TYPE.True
        // );
        if (!isExistedFalseResult) {
          scenarioList[j].testResults.push({ graphNodeId: target.graphNodeId, type: RESULT_TYPE.False });
        }

        const inspection = inspectionDictionary.get(target.graphNodeId) & NODE_INSPECTION.HasRelationInSameGroup;
        inspectionDictionary.set(target.graphNodeId, inspection);
      }

      if (
        scenarioList.some(
          (x) =>
            x.testResults.some((y) => y.graphNodeId === target.graphNodeId) &&
            !x.testResults.some((y) => y.graphNodeId === target.graphNodeId && y.type === RESULT_TYPE.False)
        )
      ) {
        const inspection = inspectionDictionary.get(target.graphNodeId) & NODE_INSPECTION.MConstraintViolation;
        inspectionDictionary.set(target.graphNodeId, inspection);
      }
    }

    return {
      scenarios,
      inspectionDictionary,
    };
  }
}

export default new TestScenarioInspector();
