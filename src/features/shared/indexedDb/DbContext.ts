/* eslint-disable max-classes-per-file */
import lf from 'lovefield';
import indexedDbHelper from './indexedDbHelper';

interface IDbSet {
  get: (filter: any) => any[];
}

interface IDbContext {
  testScenarios: IDbSet | null;
  testCases: IDbSet | null;
}

class TestCaseSet implements IDbSet {
  db: lf.Database | null;

  get: any;

  constructor(db: lf.Database | null) {
    this.db = db;
  }
}

export default class DbContext implements IDbContext {
  testScenarios: IDbSet | null;

  testCases: IDbSet | null;

  db: lf.Database | null;

  constructor() {
    this.testScenarios = null;
    this.testCases = null;
    this.db = null;
  }

  async init(workId: string) {
    this.db = await indexedDbHelper.initIndexedDb(workId);
    this.testCases = new TestCaseSet(this.db);
  }
}
