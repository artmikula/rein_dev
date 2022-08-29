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

  constructor() {
    this.db = null;
    this.testScenarioSet = null;
    this.testCaseSet = null;
  }

  async init(workId: string) {
    this.db = await indexedDbHelper.initIndexedDb(workId);
    if (this.db) {
      const tblTestScenario = await indexedDbHelper.getTable(this.db, TABLES.TEST_SCENARIOS);
      const tblTestCase = await indexedDbHelper.getTable(this.db, TABLES.TEST_CASES);
      this.testScenarioSet = new TestScenarioSet(this.db, tblTestScenario);
      this.testCaseSet = new TestCaseSet(this.db, tblTestCase);
    }
  }

  close() {
    if (this.db) {
      indexedDbHelper.close(this.db);
      this.db = null;
      this.testScenarioSet = null;
      this.testCaseSet = null;
    }
  }
}
