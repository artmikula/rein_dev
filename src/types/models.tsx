import { uuid } from 'features/project/work/components/GridPanels/Graph/lib/cytoscapejs/util';
import { RESULT_TYPE } from 'features/shared/constants';

interface IGraphNode {
  id: string;
  childs?: any;
  createdDate?: any;
  effectGroup?: number;
  inspection?: number;
  isLocked?: boolean;
  lastModifiedDate?: any;
  nodeId: string;
  positionX?: number;
  positionY?: number;
  targetType?: string;
  type?: string;
  workId: string;
  definition: any;
}

interface IGraphLink {
  id: string;
  isNotRelation?: boolean;
  sourceId: string;
  source: IGraphNode;
  targetId: string;
  target: IGraphNode;
  type: string;
}

interface ITestResult {
  graphNodeId: string;
  type: string;
}

interface ITestAssertion {
  graphNode?: IGraphNode;
  graphNodeId: string;
  nodeId: string;
  // in raw assertion, result true means positive link, false means negative link,
  // ex: E1 OR !E2 will become scenario with 2 assertions OR(E1: true, E2: false)
  result: boolean;
  testScenarioId?: any;
  testScenario?: any;
}

interface ITestScenario {
  id: string;
  expectedResults?: string;
  isFeasible?: boolean;
  targetType?: string;
  testAssertions: ITestAssertion[];
  testResults: ITestResult[];
  isBaseScenario?: boolean;
  isViolated?: boolean;
  // Not sure, to check this prop
  testResult?: any;
  // [id: any]: any;
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

  toString() {
    return `${this.targetType}(${this.testAssertions.map(
      (x: any) => `${x.nodeId}:${x.result === true ? 'T' : 'F'}`
    )}) = ${this.targetNodeId}`;
  }
}

export type { IGraphLink, ITestScenario, IGraphNode, ITestAssertion, ITestResult, ISimpleTestScenario };
