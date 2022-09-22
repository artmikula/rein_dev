import lf from 'lovefield';
import { TABLES } from '../indexedDb/constants';
import indexedDbHelper from '../indexedDb/indexedDbHelper';
import { ITestScenarioSet, ITestCaseSet, IDbContext } from './models';
import TestCaseSet from './TestCaseSet';
import TestScenarioSet from './TestScenarioSet';

export default class DbContext implements IDbContext {
  testScenarioSet: ITestScenarioSet | null;

  testCaseSet: ITestCaseSet | null;

  db: lf.Database | null;

  name: string;

  version: number;

  constructor() {
    this.db = null;
    this.name = '';
    this.version = 0;
    this.testScenarioSet = null;
    this.testCaseSet = null;
  }

  async init(workId: string): Promise<void> {
    const initDb = await indexedDbHelper.initIndexedDb(workId);
    const { connection, dbName, dbVersion } = initDb;
    this.db = await connection;
    this.name = dbName;
    this.version = dbVersion;
    if (this.db) {
      const tblTestScenario = await indexedDbHelper.getTable(this.db, TABLES.TEST_SCENARIOS);
      const tblTestCase = await indexedDbHelper.getTable(this.db, TABLES.TEST_CASES);
      this.testScenarioSet = new TestScenarioSet(this.db, tblTestScenario);
      this.testCaseSet = new TestCaseSet(this.db, tblTestCase);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await indexedDbHelper.close(this.db);
      this.db = null;
      this.testScenarioSet = null;
      this.testCaseSet = null;
    }
  }
}
