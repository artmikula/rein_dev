/* eslint-disable no-console */
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
    try {
      if (filter) {
        return this.db.select().from(this.table).where(filter).exec();
      }
      return this.db.select().from(this.table).exec();
    } catch (error) {
      console.log('error when get test scenario', error);
      return [];
    }
  }

  /** delete all table */
  async delete(): Promise<Object[]> {
    try {
      return indexedDbHelper.deleteTable(this.db, this.table);
    } catch (error) {
      console.log('error when delete test scenario', error);
      return [];
    }
  }

  /** add all rows to table */
  async add(data: ISimpleTestScenario | ISimpleTestScenario[]): Promise<Object[]> {
    try {
      const query = await indexedDbHelper.addData(this.db, this.table);
      if (Array.isArray(data)) {
        return data.map((item) => {
          return query.bind([this.table.createRow(item)]).exec();
        });
      }
      return query.bind([this.table.createRow(data)]).exec();
    } catch (error) {
      console.log('error when add test scenario', error);
      return [];
    }
  }

  /** actions: checked/unchecked */
  async update(columnName: string, value: unknown, filter?: lf.Predicate): Promise<Object[]> {
    try {
      const query = await indexedDbHelper.update(this.db, this.table, columnName, filter);
      return query.bind([value]).exec();
    } catch (error) {
      console.log('error when update test scenario', error);
      return [];
    }
  }
}
