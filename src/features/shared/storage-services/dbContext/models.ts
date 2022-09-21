import lf from 'lovefield';
import { ISimpleTestScenario, ITestCase } from 'types/models';

interface IDbSet {
  get: (filter?: lf.Predicate) => Promise<Object[] | any[]>;
  update: (columnName: string, value: any, filter: lf.Predicate) => Promise<Object[]>;
}

interface ITestScenarioSet extends IDbSet {
  add: (data: ISimpleTestScenario | ISimpleTestScenario[]) => Promise<Object[]>;
}

interface ITestCaseSet extends IDbSet {
  table: lf.schema.Table;
  add: (data: ITestCase | ITestCase[]) => Promise<Object[]>;
  delete: () => Promise<Object[]>;
  getWithPaging(limit: number, skip: number, filter?: lf.Predicate): Promise<Object[] | ITestCase[]>;
}

interface IDbContext {
  db: lf.Database | null;
  testScenarioSet: ITestScenarioSet | null;
  testCaseSet: ITestCaseSet | null;
}

export type { ITestScenarioSet, ITestCaseSet, IDbContext };
