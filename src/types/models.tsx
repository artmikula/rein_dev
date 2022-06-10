interface IGraphNode {
  id: string;
  definition: string;
  definitionId: string;
  workId: string;
  nodeId: string;
  childs?: any;
  effectGroup?: number;
  inspection?: number;
  inspectionPalettes?: any;
  isLocked?: boolean;
  positionX?: number;
  positionY?: number;
  targetType?: string;
  type?: string;
  createdDate?: Date;
  lastModifiedDate?: Date;
}

interface IGraphLink {
  id: string;
  sourceId: string;
  targetId: string;
  source: IGraphNode;
  target: IGraphNode;
  type: string;
  isNotRelation?: boolean;
}

interface ITestResult {
  graphNodeId: string;
  type?: string;
}

interface ITestAssertion {
  graphNodeId: string;
  result: boolean;
  workId?: string;
  testScenarioId?: string;
  graphNode?: IGraphNode;
  // eslint-disable-next-line no-use-before-define
  testScenario?: ITestScenario;
}

interface ITestScenario {
  id: string;
  testAssertions: ITestAssertion[];
  testResults: ITestResult[];
  scenarioType?: string;
  expectedResults?: string;
  isFeasible?: boolean;
  isValid?: boolean;
  isViolated?: boolean;
  targetType?: string;
  isBaseScenario?: boolean;

  // Not sure, to check this prop
  testResult?: any;
}

interface ITestData {
  graphNodeId: string;
  data: string;
}

interface ITestCase {
  id: string;
  testScenarioId: string;
  results: string[];
  testDatas: ITestData[];
  testScenario?: ITestScenario;
}

export type { IGraphLink, ITestScenario, IGraphNode, ITestAssertion, ITestResult, ITestData, ITestCase };
