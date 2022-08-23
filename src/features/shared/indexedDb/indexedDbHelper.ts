import lf from 'lovefield';
import { INDEXED_DB, TABLES } from './constants';

interface ICustomWindow extends Window {
  LocalIndexedDb?: any;
}

class IndexedDbHelper {
  db: lf.Database | null;

  builder: lf.schema.Builder | null;

  constructor() {
    this.db = null;
    this.builder = null;
  }

  async initIndexedDb(dbName: string = INDEXED_DB.NAME, dbVersion: number = INDEXED_DB.VERSION) {
    const schemaBuilder: lf.schema.Builder = await lf.schema.create(dbName, dbVersion);
    this.builder = schemaBuilder;

    schemaBuilder
      .createTable(TABLES.TEST_SCENARIOS)
      .addColumn('id', lf.Type.STRING)
      .addColumn('isEffectAssertion', lf.Type.BOOLEAN)
      .addColumn('isFeasible', lf.Type.BOOLEAN)
      .addColumn('isValid', lf.Type.BOOLEAN)
      .addColumn('result', lf.Type.BOOLEAN)
      .addColumn('resultType', lf.Type.STRING)
      .addColumn('scenarioType', lf.Type.STRING)
      .addColumn('sourceTargetType', lf.Type.STRING)
      .addColumn('targetGraphNodeId', lf.Type.STRING)
      .addColumn('targetNodeId', lf.Type.STRING)
      .addColumn('targetType', lf.Type.STRING)
      .addColumn('expectedResults', lf.Type.STRING)
      .addColumn('testAssertions', lf.Type.OBJECT)
      .addColumn('testResults', lf.Type.OBJECT)
      .addColumn('workId', lf.Type.STRING)
      .addPrimaryKey(['id']);

    schemaBuilder
      .createTable(TABLES.TEST_CASES)
      .addColumn('id', lf.Type.STRING)
      .addColumn('results', lf.Type.STRING)
      .addColumn('testDatas', lf.Type.BOOLEAN)
      .addColumn('testScenarioId', lf.Type.STRING)
      .addPrimaryKey(['id'])
      .addForeignKey('fk_testScenarioId', {
        local: 'testScenarioId',
        ref: `${TABLES.TEST_SCENARIOS}.id`,
        action: lf.ConstraintAction.CASCADE,
      });

    return schemaBuilder.connect();
  }

  set(db: lf.Database) {
    this.db = db;
  }

  get() {
    return this.db;
  }

  async addData(db: lf.Database, tableName: string, data: lf.Row[] | lf.Row) {
    if (db) {
      const tbl = await db.getSchema().table(tableName);
      if (Array.isArray(data)) {
        const newRows = data.map((item) => tbl.createRow(item));
        await db.insertOrReplace().into(tbl).values(newRows).exec();
      } else {
        const newRow = tbl.createRow(data);
        await db.insertOrReplace().into(tbl).values([newRow]).exec();
      }
    }
  }

  async getTable(db: lf.Database, tableName: string) {
    if (db) {
      const tbl = await db.getSchema().table(tableName);
      return tbl;
    }
    return null;
  }

  async deleteTable(db: lf.Database, tableName: string) {
    if (db) {
      const tbl = await db.getSchema().table(tableName);
      await db.delete().from(tbl).exec();
    }
  }
}

const indexedDbHelper = new IndexedDbHelper();

const customWindow: ICustomWindow = window;

customWindow.LocalIndexedDb = indexedDbHelper;

export default indexedDbHelper;
