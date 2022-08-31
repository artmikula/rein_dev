import lf from 'lovefield';
import { INDEXED_DB, TABLES } from './constants';

class IndexedDbHelper {
  initIndexedDb(dbName: string = INDEXED_DB.NAME, dbVersion: number = INDEXED_DB.VERSION) {
    const schemaBuilder: lf.schema.Builder = lf.schema.create(dbName, dbVersion);

    schemaBuilder
      .createTable(TABLES.TEST_SCENARIOS)
      .addColumn('id', lf.Type.STRING)
      .addColumn('isBaseScenario', lf.Type.BOOLEAN)
      .addColumn('isEffectAssertion', lf.Type.BOOLEAN)
      .addColumn('isFeasible', lf.Type.BOOLEAN)
      .addColumn('isValid', lf.Type.BOOLEAN)
      .addColumn('isSelected', lf.Type.BOOLEAN)
      .addColumn('isViolated', lf.Type.BOOLEAN)
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
      .addNullable(['isViolated'])
      .addPrimaryKey(['id']);

    schemaBuilder
      .createTable(TABLES.TEST_CASES)
      .addColumn('id', lf.Type.STRING)
      .addColumn('results', lf.Type.STRING)
      .addColumn('testDatas', lf.Type.BOOLEAN)
      .addColumn('testScenarioId', lf.Type.STRING)
      .addColumn('isSelected', lf.Type.BOOLEAN)
      .addPrimaryKey(['id'])
      .addForeignKey('fk_testScenarioId', {
        local: 'testScenarioId',
        ref: `${TABLES.TEST_SCENARIOS}.id`,
        action: lf.ConstraintAction.CASCADE,
      });

    return schemaBuilder.connect();
  }

  close(db: lf.Database) {
    db.close();
  }

  async addData(db: lf.Database, table: lf.schema.Table): Promise<lf.query.Insert> {
    return db
      .insertOrReplace()
      .into(table)
      .values([lf.bind(0)]);
  }

  async getTable(db: lf.Database, tableName: string): Promise<lf.schema.Table> {
    const tbl = await db.getSchema().table(tableName);
    return tbl;
  }

  async deleteTable(db: lf.Database, table: lf.schema.Table): Promise<Object[]> {
    return db.delete().from(table).exec();
  }

  update(db: lf.Database, table: lf.schema.Table, columnName: string, filter?: lf.Predicate): lf.query.Update {
    if (filter) {
      return db.update(table).set(table[columnName], lf.bind(0)).where(filter);
    }
    return db.update(table).set(table[columnName], lf.bind(0));
  }
}

export default new IndexedDbHelper();
