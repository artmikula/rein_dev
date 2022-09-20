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
  async get(filter?: lf.Predicate): Promise<Object[] | ITestCase[]> {
    if (filter) {
      return this.db.select().from(this.table).where(filter).exec();
    }
    return this.db.select().from(this.table).exec();
  }

  async delete(): Promise<Object[]> {
    const testCases = await this.get();
    if (testCases.length > 0) {
      return indexedDbHelper.deleteTable(this.db, this.table);
    }
    return [];
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

  async totalTestCases(testScenarioId?: string): Promise<number> {
    let query: { [key: string]: any }[];
    if (testScenarioId) {
      query = await this.db
        .select(lf.fn.count(this.table.id))
        .from(this.table)
        .where(this.table.testScenarioId.eq(testScenarioId))
        .exec();
    } else {
      query = await this.db.select(lf.fn.count(this.table.id)).from(this.table).exec();
    }
    return query[0]['COUNT(id)'] as number;
  }

  /** actions: checked/unchecked */
  async update(columnName: string, value: unknown, filter?: lf.Predicate): Promise<Object[]> {
    const query = await indexedDbHelper.update(this.db, this.table, columnName, filter);
    return query.bind([value]).exec();
  }
}
