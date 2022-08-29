import lf from 'lovefield';
import { ISimpleTestScenario } from 'types/models';
import indexedDbHelper from '../indexedDb/indexedDbHelper';
import { ITestScenarioSet } from './models';

export default class TestScenarioSet implements ITestScenarioSet {
  db: lf.Database;

  table: lf.schema.Table;

  constructor(db: lf.Database, table: lf.schema.Table) {
    this.db = db;
    this.table = table;
  }

  async get(): Promise<ISimpleTestScenario[] | Object[]> {
    return this.db.select().from(this.table).exec();
  }

  async delete(): Promise<Object[]> {
    const testScenarios = await this.get();
    if (testScenarios.length > 0) {
      return indexedDbHelper.deleteTable(this.db, this.table);
    }
    return [];
  }

  async add(data: ISimpleTestScenario | ISimpleTestScenario[]) {
    return indexedDbHelper.addData(this.db, this.table, data);
  }
}
