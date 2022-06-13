/* eslint-disable no-bitwise */
import { GRAPH_NODE_TYPE, NODE_INSPECTION, TEST_SCENARIO_TYPE } from 'features/shared/constants';
import appConfig from 'features/shared/lib/appConfig';
import Enumerable from 'linq';
import { v4 as uuid } from 'uuid';
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

    let testScenarios = [];
    // let index = 0;
    const orderedTestScenarios = Enumerable.from(tmpScenarioList)
      .orderBy((x) => x.expectedResults)
      .toArray();

    for (let i = 0; i < orderedTestScenarios.length; i++) {
      // add condition in option ShowReducedScenariosAndCases
      const scenario = orderedTestScenarios[i];
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
    const scenarioInspection = TestScenarioInspector._inspectEffectRelation(
      testScenarios,
      this.constraints,
      inspectionDictionary
    );

    testScenarios = scenarioInspection.scenarios;
    inspectionDictionary = scenarioInspection.inspectionDictionary;
    // testScenarios = TestScenarioHelper.findBaseScenario(testScenarios, this.causeNodes);

    inspectionDictionary.forEach((value, key) => {
      const nodeIndex = this.graphNodes.findIndex((x) => key === x.id);
      const node = this.graphNodes[nodeIndex];

      this.graphNodes[nodeIndex] = { ...node, inspection: value };
    });

    for (let i = 0; i < testScenarios.length; i++) {
      testScenarios[i].id = uuid();
      testScenarios[i].scenarioType = TEST_SCENARIO_TYPE.Myers;
      if (testScenarios[i].isValid === undefined) {
        testScenarios[i].isValid = true;
      }

      if (testScenarios[i].isFeasible === undefined) {
        testScenarios[i].isFeasible = true;
      }
    }

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
}
export default new MyerTechnique();
