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
import constraintHelper from '../../Constraint';
import TestScenarioHelper from '../TestScenarioHelper';
import TestScenarioGenerator from '../TestScenarioGenerator';
import TestScenarioInspector from '../TestScenarioInspector';

class MyerTechnique {
  constructor() {
    this.graphLinks = [];
    this.graphNodes = [];
    this.causeNodes = [];
    this.effectNodes = [];
    this.groupNodes = [];
    this.constraints = [];
  }

  _initValue(graphLinks = [], constraints = [], graphNodes = []) {
    this.graphLinks = graphLinks;
    this.graphNodes = [...graphNodes];
    this.causeNodes = [...graphNodes.filter((x) => x.type === GRAPH_NODE_TYPE.CAUSE)];
    this.effectNodes = [...graphNodes.filter((x) => x.type === GRAPH_NODE_TYPE.EFFECT)];
    this.groupNodes = [...graphNodes.filter((x) => x.type === GRAPH_NODE_TYPE.GROUP)];
    this.constraints = constraints;
  }

  buildTestScenario(graphLinks = [], constraints = [], graphNodes = []) {
    this._initValue(graphLinks, constraints, graphNodes);

    if (window.isDebugMode) {
      console.log('================== START BUILD SCENARIO with MyersTechnique =============');
      console.log('graphLinks', this.graphLinks);
      console.log('constraints', this.constraints);
      console.log('graphNodes', this.graphNodes);
    }

    const scenarioDictionary = TestScenarioGenerator.calculateScenarioDictionary(this.graphLinks, this.effectNodes);

    if (window.isDebugMode) {
      console.log('scenarioDictionary', scenarioDictionary);
    }

    return this.updateTestScenario(scenarioDictionary);
  }

  updateTestScenario(scenarioDictionary = new Map()) {
    let inspectionDictionary = new Map();
    const causeGroupInspection =
      NODE_INSPECTION.DisconnectedNode | NODE_INSPECTION.MissingIsRelation | NODE_INSPECTION.MissingNotRelation;
    const effectInspection = NODE_INSPECTION.DisconnectedNode;

    for (let i = 0; i < this.causeNodes.length; i++) {
      inspectionDictionary.set(this.causeNodes[i].id, causeGroupInspection);
    }

    for (let i = 0; i < this.groupNodes.length; i++) {
      inspectionDictionary.set(this.groupNodes[i].id, causeGroupInspection);
    }

    for (let i = 0; i < this.effectNodes.length; i++) {
      inspectionDictionary.set(this.effectNodes[i].id, effectInspection);
    }

    // const effectAssertionDictionary = new Map(
    //   [...assertionDictionary].filter(([key]) => this.effectNodes.some((y) => y.id === key))
    // );

    // const tmpScenarioList = [];

    // effectAssertionDictionary.forEach((value) => {
    //   const merged = this._mergeScenarioFragments(assertionDictionary, value);
    //   tmpScenarioList.push(...merged);
    // });

    const tmpScenarioList = TestScenarioGenerator.generateScenariosForEffectNodes(
      scenarioDictionary,
      appConfig.showReducedScenariosAndCases
    );

    for (let i = 0; i < tmpScenarioList.length; i++) {
      const scenario = tmpScenarioList[i];
      scenario.expectedResults = TestScenarioGenerator.buildExpectedResultsOfTestScenario(scenario, this.graphNodes);
    }

    console.log('tmpScenarioList', tmpScenarioList);

    const testScenarios = [];
    // let index = 0;
    const oderedTestScenarios = Enumerable.from(tmpScenarioList)
      .orderBy((x) => x.expectedResults)
      .toArray();

    for (let i = 0; i < oderedTestScenarios.length; i++) {
      // add condition in option ShowReducedScenariosAndCases
      const scenario = oderedTestScenarios[i];
      scenario.scenarioType = TEST_SCENARIO_TYPE.Myers;

      if (appConfig.showReducedScenariosAndCases || !scenario.isViolated) {
        // oderedTestScenarios[i].id = ++index;
        const scenarioInspection = TestScenarioInspector._inspectScenario(scenario, inspectionDictionary);
        scenario.isViolated = scenarioInspection.violated;
        inspectionDictionary = scenarioInspection.inspectionDictionary;

        if (!scenario.isViolated) {
          testScenarios.push(scenario);
        }
      }
    }

    // TODO T4BL-47: Rework inspection, move to TestScenarioInspector
    // const scenarioInspection = TestScenarioInspector._inspectEffectRelation(
    //   testScenarios,
    //   this.graphLinks,
    //   this.constraints,
    //   inspectionDictionary
    // );
    // testScenarios = scenarioInspection.scenarios;
    // inspectionDictionary = scenarioInspection.inspectionDictionary;
    // testScenarios = TestScenarioHelper.findBaseScenario(testScenarios, this.causeNodes);

    // inspectionDictionary.forEach((value, key) => {
    //   const nodeIndex = this.graphNodes.findIndex((x) => key === x.id);
    //   const node = this.graphNodes[nodeIndex];

    //   this.graphNodes[nodeIndex] = { ...node, inspection: value };
    // });

    // for (let i = 0; i < testScenarios.length; i++) {
    //   testScenarios[i].id = uuid();
    //   testScenarios[i].scenarioType = TEST_SCENARIO_TYPE.Myers;
    //   if (testScenarios[i].isValid === undefined) {
    //     testScenarios[i].isValid = true;
    //   }

    //   if (testScenarios[i].isFeasible === undefined) {
    //     testScenarios[i].isFeasible = true;
    //   }
    // }

    // testScenarios = testScenarios.filter((x) => x.expectedResults);

    console.log('testScenarios', testScenarios);

    return {
      scenarios: this._mapToOldScenarios(testScenarios),
      graphNodes: this.graphNodes,
    };
  }

  _mapToOldScenarios(testScenarios = []) {
    const result = testScenarios.map((scenario) => {
      const sce = scenario;
      sce.testResults = [
        {
          graphNodeId: scenario.targetGraphNodeId,
          type: scenario.resultType,
        },
      ];
      return sce;
    });

    return result;
  }

  _mergeScenarioFragments(
    assertionDictionary = new Map(),
    scenario = {},
    showReducedScenariosAndCases = false,
    relationIsTrue = true
  ) {
    const results = [];
    const clone = relationIsTrue ? scenario : TestScenarioHelper.invertedCloneWithExceptId(scenario);
    const operatorAndOr = clone.targetType === OPERATOR_TYPE.AND ? OPERATOR_TYPE.OR : OPERATOR_TYPE.AND;
    clone.targetType = relationIsTrue ? clone.targetType : operatorAndOr;

    if (clone.targetType === OPERATOR_TYPE.AND) {
      results.push(clone);
      const { testAssertions } = clone;
      for (let i = 0; i < testAssertions.length; i++) {
        const testScenario = assertionDictionary.get(testAssertions[i].graphNode.id);
        if (testScenario) {
          const subsets = this._mergeScenarioFragments(
            assertionDictionary,
            testScenario,
            relationIsTrue === testAssertions[i].result
          );
          const limitedLength = results.length;
          for (let j = 0; j < limitedLength; j++) {
            for (let k = 0; k < subsets.length; k++) {
              let merged = TestScenarioHelper.clone(results[0]);
              const mergedResult = TestScenarioHelper.mergeAssertion(merged, subsets[k]);
              if (mergedResult.isMergeSuccessfully) {
                merged = mergedResult.testScenario;
                if (
                  !results.some(
                    (x) =>
                      TestScenarioHelper.toString(x, this.graphNodes) ===
                      TestScenarioHelper.toString(merged, this.graphNodes)
                  )
                ) {
                  results.push(merged);
                }
              }
            }

            results.splice(0, 1);
          }
        } else {
          for (let j = 0; j < results.length; j++) {
            const item = results[j].testAssertions.find((x) => x.graphNode.id === testAssertions[i].graphNode.id);
            if (item) {
              item.result = testAssertions[i].result;
            } else {
              const testAssertion = {
                graphNode: testAssertions[i].graphNode,
                result: testAssertions[i].result,
              };
              if (
                !results[j].testAssertions.some((x) => x.graphNode && x.graphNode.id === testAssertion.graphNode.id)
              ) {
                results[j].testAssertions.push(testAssertion);
              }
            }
          }
        }
      }
    } else {
      const combinationArray = TestScenarioHelper.combination(clone.testAssertions.map((x) => x.graphNode.id));
      const combinations = Enumerable.from(combinationArray).groupBy((x) => x.length);
      if (scenario.targetType === OPERATOR_TYPE.AND) {
        combinations.forEach((combination) => {
          combination.forEach((excepts) => {
            const inverted = TestScenarioHelper.invertedCloneWithExceptIds(clone, excepts);
            inverted.targetType = OPERATOR_TYPE.AND;
            results.push(...this._mergeScenarioFragments(assertionDictionary, inverted, showReducedScenariosAndCases));
          });
        });
      } else {
        const first = combinations.first();
        first.forEach((exceptIds) => {
          const inverted = TestScenarioHelper.invertedCloneWithExceptIds(clone, exceptIds);
          inverted.targetType = OPERATOR_TYPE.AND;
          results.push(...this._mergeScenarioFragments(assertionDictionary, inverted, showReducedScenariosAndCases));
        });

        if (showReducedScenariosAndCases && combinations.count() > 1) {
          const last = combinations.last();
          last.forEach((exceptIds) => {
            const inverted = TestScenarioHelper.invertedCloneWithExceptIds(clone, exceptIds);
            inverted.targetType = OPERATOR_TYPE.AND;
            results.push(...this._mergeScenarioFragments(assertionDictionary, inverted, showReducedScenariosAndCases));
          });
        }
      }
    }

    return results;
  }

  _inspectionScenario(scenario, inspectionDictionary = new Map()) {
    const scenarioResult = {};
    const { testAssertions } = scenario;
    for (let i = 0; i < testAssertions.length; i++) {
      const inspection = inspectionDictionary.get(testAssertions[i].graphNode.id) & ~NODE_INSPECTION.DisconnectedNode;
      inspectionDictionary.set(testAssertions[i].graphNode.id, inspection);
      if (testAssertions[i].result) {
        inspectionDictionary.set(testAssertions[i].graphNode.id, inspection & ~NODE_INSPECTION.MissingIsRelation);
      } else {
        inspectionDictionary.set(testAssertions[i].graphNode.id, inspection & ~NODE_INSPECTION.MissingNotRelation);
      }
    }

    for (let i = 0; i < this.constraints.length; i++) {
      const validation = constraintHelper.validate(this.constraints[i], scenario);
      if (validation !== NODE_INSPECTION.None) {
        const nodes = this.constraints[i].nodes.filter((x) =>
          scenario.testAssertions.some((y) => x.graphNodeId === y.graphNode.id)
        );

        nodes.forEach((item) => {
          const newValidation = inspectionDictionary.get(item.graphNodeId) | validation;
          inspectionDictionary.set(item.graphNodeId, newValidation);
        });

        scenarioResult.isViolated = true;
      }
    }

    const { testResults } = scenario;
    for (let i = 0; i < testResults.length; i++) {
      const inspection = inspectionDictionary.get(testResults[i].graphNodeId) & ~NODE_INSPECTION.DisconnectedNode;
      inspectionDictionary.set(testResults[i].graphNodeId, inspection);
    }

    return {
      scenario: { ...scenario, ...scenarioResult },
      inspectionDictionary,
    };
  }
}
export default new MyerTechnique();
