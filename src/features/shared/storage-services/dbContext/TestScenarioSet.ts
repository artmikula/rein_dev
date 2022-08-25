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

  /** get all or get by filter */
  async get(filter?: lf.Predicate): Promise<Object[]> {
    if (filter) {
      return this.db.select().from(this.table).where(filter).exec();
    }
    return this.db.select().from(this.table).exec();
  }

  /** delete all table */
  async delete(): Promise<void> {
    return indexedDbHelper.deleteTable(this.db, this.table);
  }

  /** add all rows to table */
  async add(data: ISimpleTestScenario | ISimpleTestScenario[]) {
    const query = await indexedDbHelper.addData(this.db, this.table);
    if (Array.isArray(data)) {
      return data.map((item) => {
        return query.bind([this.table.createRow(item)]).exec();
      });
    }
    return query.bind([this.table.createRow(data)]).exec();
  }

  /** actions: checked/unchecked */
  async update(columnName: string, value: any, filter?: lf.Predicate): Promise<Object[]> {
    const query = await indexedDbHelper.updateByFilter(this.db, this.table, columnName, filter);
    return query.bind([value]).exec();
  }
}
