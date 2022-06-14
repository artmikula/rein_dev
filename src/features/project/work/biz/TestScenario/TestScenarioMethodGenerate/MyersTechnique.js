/* eslint-disable no-bitwise */
import { GRAPH_NODE_TYPE, TEST_SCENARIO_TYPE } from 'features/shared/constants';
import appConfig from 'features/shared/lib/appConfig';
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
    const tmpScenarioList = TestScenarioGenerator.generateScenariosForEffectNodes(
      scenarioDictionary,
      appConfig.general.viewOmitted
    );

    for (let i = 0; i < tmpScenarioList.length; i++) {
      const scenario = tmpScenarioList[i];
      scenario.expectedResults = TestScenarioGenerator.buildExpectedResultsOfTestScenario(scenario, this.graphNodes);
    }

    // let index = 0;
    const scenarioInspection = TestScenarioInspector.runInspections(
      this.causeNodes,
      this.groupNodes,
      this.effectNodes,
      this.constraints,
      tmpScenarioList,
      appConfig.general.viewOmitted
    );

    const { testScenarios, inspectionDictionary } = scenarioInspection;
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
