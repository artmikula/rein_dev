import { ISimpleTestScenario, ITestCase } from 'types/models';

interface ITestScenarioSet {
  get: () => Promise<ISimpleTestScenario[] | Object[]>;
  delete: () => Promise<void>;
  add: (data: ISimpleTestScenario | ISimpleTestScenario[]) => Promise<void>;
}

interface ITestCaseSet {
  getByTestScenario: (testScenarioId: string) => Promise<ITestCase[] | Object[]>;
  add: (data: ITestCase | ITestCase[]) => Promise<void>;
}

interface IDbContext {
  testScenarios: ITestScenarioSet | null;
  testCases: ITestCaseSet | null;
}

export type { ITestScenarioSet, ITestCaseSet, IDbContext };
