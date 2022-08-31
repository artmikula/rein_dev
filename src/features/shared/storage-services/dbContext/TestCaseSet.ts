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

  /** get all or get by filter */
  async get(filter?: lf.Predicate): Promise<Object[]> {
    if (filter) {
      return this.db.select().from(this.table).where(filter).limit(30).exec();
    }
    return this.db.select().from(this.table).limit(30).exec();
  }

  /** add all rows to table */
  async add(data: ITestCase | ITestCase[]): Promise<Object[]> {
    const query = await indexedDbHelper.addData(this.db, this.table);
    if (Array.isArray(data)) {
      return data.map((item) => {
        return query.bind([this.table.createRow(item)]).exec();
      });
    }
    return query.bind([this.table.createRow(data)]).exec();
  }

  /** actions: checked/unchecked */
  async update(columnName: string, value: unknown, filter?: lf.Predicate): Promise<Object[]> {
    const query = await indexedDbHelper.updateByFilter(this.db, this.table, columnName, filter);
    return query.bind([value]).exec();
  }
}
