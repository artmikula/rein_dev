import lf from 'lovefield';
import { ITestCase } from 'types/models';
import { TABLES } from '../indexedDb/constants';
import indexedDbHelper from '../indexedDb/indexedDbHelper';
import { ITestCaseSet } from './models';

export default class TestCaseSet implements ITestCaseSet {
  db: lf.Database;

  constructor(db: lf.Database) {
    this.db = db;
  }

  async getByTestScenario(testScenarioId: string): Promise<ITestCase[] | Object[]> {
    const tbl = await this.db.getSchema().table(TABLES.TEST_CASES);
    const result = await this.db.select().from(tbl).where(tbl.testScenarioId.eq(testScenarioId)).exec();
    return result;
  }

  async add(data: ITestCase | ITestCase[]) {
    const tbl = await indexedDbHelper.getTable(this.db, TABLES.TEST_CASES);
    return indexedDbHelper.addData(this.db, tbl, data);
  }
}
