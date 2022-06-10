/* eslint-disable max-lines */
/* eslint-disable no-bitwise */
import {
  CONSTRAINT_TYPE,
  GRAPH_NODE_TYPE,
  NODE_INSPECTION,
  OPERATOR_TYPE,
  RESULT_TYPE,
  TEST_SCENARIO_TYPE,
} from 'features/shared/constants';
import appConfig from 'features/shared/lib/appConfig';
import Enumerable from 'linq';
import { v4 as uuid } from 'uuid';
import { ISimpleTestScenario } from 'types/models';
import constraintHelper from '../Constraint';
import TestScenarioHelper from './TestScenarioHelper';
import TestScenarioGenerator from './TestScenarioGenerator';

class TestScenarioInspector {
  _inspectScenario(scenario: ISimpleTestScenario, constraints: any[], inspectionDictionary = new Map()) {
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
        const nodes = constraints[i].nodes.filter((x: any) =>
          scenario.testAssertions.some((y) => x.graphNodeId === y.graphNodeId)
        );

        nodes.forEach((item: any) => {
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
    graphLinks: any[],
    originConstraints: any[],
    inspectionDictionary = new Map()
  ) {
    // remove hanlde for effectToEffectLinks because currently we do not have this kind of links

    // const constraints = originConstraints.filter((x) => x.type === CONSTRAINT_TYPE.MASK);
    // for (let i = 0; i < constraints.length; i++) {
    //   const source = constraints[i].nodes[0];
    //   const target = constraints[i].nodes[1];
    //   const scenarioList = scenarios.filter((x) => x.targetGraphNodeId === source.graphNodeId);
    //   // testResults.some((y) => y.graphNodeId === source.graphNodeId));
    //   for (let j = 0; j < scenarioList.length; j++) {
    //     const isExistedFalseResult = scenarioList[j].result === false;
    //     // const isExistedFalseResult = scenarioList[j].testResults.some(
    //     //   (x) => x.graphNodeId === target.graphNodeId && x.type === RESULT_TYPE.True
    //     // );
    //     if (!isExistedFalseResult) {
    //       scenarioList[j].testResults.push({ graphNodeId: target.graphNodeId, type: RESULT_TYPE.False });
    //     }

    //     const inspection = inspectionDictionary.get(target.graphNodeId) & NODE_INSPECTION.HasRelationInSameGroup;
    //     inspectionDictionary.set(target.graphNodeId, inspection);
    //   }

    //   if (
    //     scenarioList.some(
    //       (x) =>
    //         x.testResults.some((y) => y.graphNodeId === target.graphNodeId) &&
    //         !x.testResults.some((y) => y.graphNodeId === target.graphNodeId && y.type === RESULT_TYPE.False)
    //     )
    //   ) {
    //     const inspection = inspectionDictionary.get(target.graphNodeId) & NODE_INSPECTION.MConstraintViolation;
    //     inspectionDictionary.set(target.graphNodeId, inspection);
    //   }
    // }

    return {
      scenarios,
      inspectionDictionary,
    };
  }
}

export default new TestScenarioInspector();
