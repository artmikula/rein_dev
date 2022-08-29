import lf from 'lovefield';
import { ISimpleTestScenario, ITestCase } from 'types/models';

interface IDbSet {
  get: (filter?: lf.Predicate) => Promise<Object[]>;
}

interface ITestScenarioSet extends IDbSet {
  delete: () => Promise<Object[]>;
  add: (data: ISimpleTestScenario | ISimpleTestScenario[]) => Promise<Object[]>;
}

interface ITestCaseSet extends IDbSet {
  add: (data: ITestCase | ITestCase[]) => Promise<Object[]>;
}

interface IDbContext {
  db: lf.Database | null;
  testScenarioSet: ITestScenarioSet | null;
  testCaseSet: ITestCaseSet | null;
}

export type { ITestScenarioSet, ITestCaseSet, IDbContext };
