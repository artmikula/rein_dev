import lf from 'lovefield';
import { ITestCase } from 'types/models';
import indexedDbHelper from '../indexedDb/indexedDbHelper';
import { ITestCaseSet } from './models';

export default class TestCaseSet implements ITestCaseSet {
  db: lf.Database;

  table: lf.schema.Table;

  constructor(db: lf.Database, table: lf.schema.Table) {
    this.db = db;
    this.table = table;
  }

  async getByTestScenario(testScenarioId: string): Promise<ITestCase[] | Object[]> {
    const result = await this.db.select().from(this.table).where(this.table.testScenarioId.eq(testScenarioId)).exec();
    return result;
  }

  async add(data: ITestCase | ITestCase[]) {
    return indexedDbHelper.addData(this.db, this.table, data);
  }
}
