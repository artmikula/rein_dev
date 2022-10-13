/* eslint-disable no-console */
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
    try {
      if (filter) {
        return this.db.select().from(this.table).where(filter).exec();
      }
      return this.db.select().from(this.table).exec();
    } catch (error) {
      console.log('error when get test case', error);
      return [];
    }
  }

  async getWithPaging(limit = 0, skip = 0, filter?: lf.Predicate): Promise<Object[] | ITestCase[]> {
    try {
      if (filter) {
        return this.db.select().from(this.table).limit(limit).skip(skip).where(filter).exec();
      }
      return this.db.select().from(this.table).limit(skip).skip(limit).exec();
    } catch (error) {
      console.log('error when get test case with paging', error);
      return [];
    }
  }

  async delete(): Promise<Object[]> {
    try {
      return indexedDbHelper.deleteTable(this.db, this.table);
    } catch (error) {
      console.log('error when delete test case', error);
      return [];
    }
  }

  /** add all rows to table */
  async add(data: ITestCase | ITestCase[]): Promise<Object[]> {
    try {
      const query = await indexedDbHelper.addData(this.db, this.table);
      if (Array.isArray(data)) {
        return data.map((item) => {
          return query.bind([this.table.createRow(item)]).exec();
        });
      }
      return query.bind([this.table.createRow(data)]).exec();
    } catch (error) {
      console.log('error when add test case', error);
      return [];
    }
  }

  async totalTestCases(testScenarioId?: string): Promise<number> {
    try {
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
    } catch (error) {
      console.log('error when get total test case', error);
      return 0;
    }
  }

  /** actions: checked/unchecked */
  async update(columnName: string, value: unknown, filter?: lf.Predicate): Promise<Object[]> {
    try {
      const query = await indexedDbHelper.update(this.db, this.table, columnName, filter);
      return query.bind([value]).exec();
    } catch (error) {
      console.log('error when update test case', error);
      return [];
    }
  }
}
