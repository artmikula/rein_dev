import lf from 'lovefield';
import { ISimpleTestScenario } from 'types/models';
import { TABLES } from '../indexedDb/constants';
import indexedDbHelper from '../indexedDb/indexedDbHelper';
import { ITestScenarioSet } from './models';

export default class TestScenarioSet implements ITestScenarioSet {
  db: lf.Database;

  constructor(db: lf.Database) {
    this.db = db;
  }

  async get(): Promise<ISimpleTestScenario[] | Object[]> {
    const tbl = await indexedDbHelper.getTable(this.db, TABLES.TEST_SCENARIOS);
    return this.db.select().from(tbl).exec();
  }

  async delete(): Promise<void> {
    const tbl = await indexedDbHelper.getTable(this.db, TABLES.TEST_SCENARIOS);
    return indexedDbHelper.deleteTable(this.db, tbl);
  }

  async add(data: ISimpleTestScenario | ISimpleTestScenario[]) {
    const tbl = await indexedDbHelper.getTable(this.db, TABLES.TEST_SCENARIOS);
    return indexedDbHelper.addData(this.db, tbl, data);
  }
}
