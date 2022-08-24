import lf from 'lovefield';
import indexedDbHelper from '../indexedDb/indexedDbHelper';
import { ITestScenarioSet, ITestCaseSet, IDbContext } from './models';
import TestCaseSet from './TestCaseSet';
import TestScenarioSet from './TestScenarioSet';

export default class DbContext implements IDbContext {
  testScenarios: ITestScenarioSet | null;

  testCases: ITestCaseSet | null;

  db: lf.Database | null;

  constructor() {
    this.testScenarios = null;
    this.testCases = null;
    this.db = null;
  }

  async init(workId: string) {
    this.db = await indexedDbHelper.initIndexedDb(workId);
    this.testScenarios = new TestScenarioSet(this.db);
    this.testCases = new TestCaseSet(this.db);
  }

  close() {
    if (this.db) {
      indexedDbHelper.close(this.db);
    }
  }
}
