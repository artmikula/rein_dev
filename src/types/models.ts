import { v4 as uuid } from 'uuid';
import { RESULT_TYPE } from 'features/shared/constants';

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
  graphNodeId: string; // guid
  nodeId?: string; // Node definition name: C1, C2...
  result: boolean;
  // in raw assertion, result true means positive link, false means negative link,
  // ex: E1 OR !E2 will become scenario with 2 assertions OR(E1: true, E2: false)
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
  nodeId?: string;
}

interface ITestDataDetail {
  id: string;
  workId: string;
  type: string;
  trueDatas: string;
  falseDatas: string;
  nodeId: string;
  strength: number;
  createdDate: Date;
  lastModifiedDate: Date;
}

interface ISimpleTestScenario {
  // basic fields
  id: string;
  key: string;
  targetNodeId: string;
  targetGraphNodeId: string;
  testAssertions: ITestAssertion[];

  result: boolean; // expected value of Target, should be true if is EffectAssertion
  resultType: string;

  isFeasible?: boolean;
  targetType?: string;
  sourceTargetType?: string;
  isEffectAssertion?: boolean;

  // Other fields for graph, inspetion and test coverage
  isBaseScenario?: boolean;
  isViolated?: boolean;
  isValid?: boolean;
  isSelected?: boolean;

  // Fields for generate process
  expectedResults?: string; // Ex: E1, or !E1

  // Fields for display in table
  scenarioType?: string;

  // Obsolete: fields to since with api
  // Current: only use for _inspectEffectRelation
  testResults: ITestResult[];

  // methods
  invertedClone: (exceptId?: any) => ISimpleTestScenario;
}

interface ITestCase {
  id: string;
  testScenarioId: string;
  results: string[];
  testDatas: ITestData[];
  isSelected?: boolean;
}

interface ICauseEffect {
  id: string;
  node: string;
  definition: string;
  isMerged: boolean;
  parent: any;
  type: string;
  definitionId: string;
  workId: string;
  orderIndex: number;
  createdDate?: Date;
  lastModifiedDate?: Date;
}

interface ITestCoverage {
  [key: string]: {
    actualPercent: number;
    denominator: number;
    planPercent?: number;
  };
}

interface INodeConstraint {
  graphNodeId: string;
  isNotRelation: boolean;
}

interface IConstraint {
  id: string;
  positionX: number;
  positionY: number;
  nodes: INodeConstraint[];
  isNotRelation: boolean;
  type: string;
  lineWidth: number;
  edgeType: string;
  lineColor: string;
  label: string;
}

export class SimpleTestScenario implements ISimpleTestScenario {
  id: string;

  key: string;

  targetGraphNodeId: string;

  targetNodeId: string;

  testAssertions: ITestAssertion[];

  result: boolean;

  resultType: string;

  testResults: ITestResult[];

  isFeasible: boolean | undefined;

  targetType: string | undefined;

  sourceTargetType: string | undefined;

  isEffectAssertion: boolean | undefined;

  isBaseScenario: boolean | undefined;

  isViolated: boolean | undefined;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(target: any, isEffectAssertion: boolean, testAssertions: ITestAssertion[]) {
    this.id = uuid();
    this.key = target.id;
    this.targetNodeId = target.nodeId;
    this.targetGraphNodeId = target.id;
    this.targetType = target.targetType;
    this.sourceTargetType = target.targetType;
    this.isEffectAssertion = isEffectAssertion;
    this.testAssertions = testAssertions;
    this.isFeasible = true;
    this.result = true;
    this.resultType = RESULT_TYPE.True;
    this.testResults = [];
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  invertedClone = (exceptId?: any) => {
    const testAssertions = this.testAssertions.map((x) => {
      const result = x.nodeId === exceptId ? x.result : !x.result;
      return { ...x, result, testScenarioId: this.id };
    });

    return {
      ...this,
      testAssertions,
    };
  };
}

export type {
  IGraphLink,
  ITestScenario,
  IGraphNode,
  ITestAssertion,
  ITestResult,
  ITestData,
  ITestDataDetail,
  ITestCase,
  ISimpleTestScenario,
  ICauseEffect,
  ITestCoverage,
  IConstraint,
  INodeConstraint,
};
