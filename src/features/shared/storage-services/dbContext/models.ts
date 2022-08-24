import lf from 'lovefield';
import { ISimpleTestScenario, ITestCase } from 'types/models';

interface IFilter {
  select?: lf.schema.Column;
  groupBy?: lf.schema.Column[];
  innerJoin?: {
    table?: lf.schema.Table;
    predicate?: lf.Predicate;
  };
  leftOuterJoin?: {
    table?: lf.schema.Table;
    predicate?: lf.Predicate;
  };
  limit?: lf.Binder | number;
  orderBy?: {
    column?: lf.schema.Column;
    order?: lf.Order;
  };
  skip?: lf.Binder | number;
  where?: lf.Predicate;
}

interface ITestScenarioSet {
  get: (filter?: IFilter) => Promise<ISimpleTestScenario[] | Object[]>;
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

export type { ITestScenarioSet, ITestCaseSet, IDbContext, IFilter };
