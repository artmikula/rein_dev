import { uuid } from 'features/project/work/components/GridPanels/Graph/lib/cytoscapejs/util';
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
}

interface ITestCase {
  id: string;
  testScenarioId: string;
  results: string[];
  testDatas: ITestData[];
  testScenario?: ITestScenario;
}

interface ISimpleTestScenario {
  // basic fields
  id: string;
  key: string;
  targetNodeId: string;
  testAssertions: ITestAssertion[];

  result: boolean; // expected value of Target, should be true if is EffectAssertion
  resultType: string;

  isFeasible?: boolean;
  targetType?: string;
  isEffectAssertion?: boolean;

  // Other fields for graph and inspetion
  isBaseScenario?: boolean;
  isViolated?: boolean;

  // Fields for generate process
  isFlattened?: boolean;

  // methods
  invertedClone: (exceptId?: any) => ISimpleTestScenario;
}

export class SimpleTestScenario implements ISimpleTestScenario {
  id: string;

  key: string;

  targetNodeId: string;

  testAssertions: ITestAssertion[];

  result: boolean;

  resultType: string;

  isFeasible: boolean | undefined;

  targetType: string | undefined;

  isEffectAssertion: boolean | undefined;

  isBaseScenario: boolean | undefined;

  isViolated: boolean | undefined;

  constructor(target: any, isEffectAssertion: boolean, testAssertions: ITestAssertion[]) {
    this.id = uuid();
    this.key = target.id;
    this.targetNodeId = target.nodeId;
    this.targetType = target.targetType;

    this.isEffectAssertion = isEffectAssertion;
    this.testAssertions = testAssertions;

    this.isFeasible = true;
    this.result = true;
    this.resultType = RESULT_TYPE.True;
  }

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
  ITestCase,
  ISimpleTestScenario,
};
