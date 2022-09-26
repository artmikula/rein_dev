import { v4 as uuid } from 'uuid';
import { RESULT_TYPE } from 'features/shared/constants';
import { ISimpleTestScenario, ITestAssertion, ITestResult } from 'types/models';

class SimpleTestScenario implements ISimpleTestScenario {
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

export default SimpleTestScenario;
