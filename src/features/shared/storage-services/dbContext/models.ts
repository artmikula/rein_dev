import { ISimpleTestScenario, ITestCase } from 'types/models';

interface ITestScenarioSet {
  get: () => Promise<ISimpleTestScenario[] | Object[]>;
  delete: () => Promise<Object[]>;
  add: (data: ISimpleTestScenario | ISimpleTestScenario[]) => Promise<void>;
}

interface ITestCaseSet {
  getByTestScenario: (testScenarioId: string) => Promise<ITestCase[] | Object[]>;
  add: (data: ITestCase | ITestCase[]) => Promise<void>;
}

interface IDbContext {
  testScenarioSet: ITestScenarioSet | null;
  testCaseSet: ITestCaseSet | null;
}

export type { ITestScenarioSet, ITestCaseSet, IDbContext };
