/* eslint-disable max-lines */
import Download from 'downloadjs';
import TestScenarioHelper from 'features/project/work/biz/TestScenario/TestScenarioHelper';
import MyersTechnique from 'features/project/work/biz/TestScenario/TestScenarioMethodGenerate/MyersTechnique';
import DNFLogicCoverage from 'features/project/work/biz/TestScenario/TestScenarioMethodGenerate/DNFLogicCoverage';
import reInCloudService from 'features/project/work/services/reInCloudService';
import { setGraph, setGenerating, setDbContext } from 'features/project/work/slices/workSlice';
import {
  FILE_NAME,
  FILTER_TYPE,
  FILTER_OPTIONS,
  GENERATE_STATUS,
  REIN_SHORTCUT_CODE,
  RESULT_TYPE,
  TEST_CASE_METHOD,
  TEST_CASE_SHORTCUT,
  TEST_CASE_SHORTCUT_CODE,
} from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import { arrayToCsv } from 'features/shared/lib/utils';
import worker from 'features/shared/worker/generateTestCase.worker';
import DbContext from 'features/shared/storage-services/dbContext/DbContext';
import { TABLES } from 'features/shared/storage-services/indexedDb/constants';
import Mousetrap from 'mousetrap';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import appConfig from 'features/shared/lib/appConfig';
import { EXPORT_TYPE_NAME } from '../Graph/constants';
import './style.scss';
import FilterBar from './components/FilterBar';
import TableTestScenarioAndCase from './components/TableTestScenarioAndCase';

const defaultFilterOptions = {
  [FILTER_OPTIONS.CAUSE_NODES]: null,
  [FILTER_OPTIONS.RESULTS]: undefined,
  [FILTER_OPTIONS.RESULT_TYPE]: RESULT_TYPE.All,
  [FILTER_OPTIONS.BASE_SCENARIO]: undefined,
  [FILTER_OPTIONS.VALID]: undefined,
  [FILTER_OPTIONS.SOURCE_TARGET_TYPE]: undefined,
};

class TestScenarioAndCase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filterOptions: structuredClone(defaultFilterOptions),
      filterSubmitType: '',
      webWorker: null,
      maxTestCase: 0,
    };
    this.initiatedData = false;
  }

  async componentDidMount() {
    const { setGenerating } = this.props;
    const initWorker = new Worker(worker, { type: 'module' });
    if (initWorker) {
      initWorker.onmessage = async (e) => {
        if (e.data === GENERATE_STATUS.SUCCESS) {
          setGenerating(e.data);
        }
        if (e.data === GENERATE_STATUS.RESET) {
          setGenerating(e.data);
        }
      };
      this.setState({ webWorker: initWorker });
    }

    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, async (event) => {
      if (event.message.action === domainEvents.ACTION.GENERATE) {
        setGenerating(GENERATE_STATUS.START);
        this.setState({ filterOptions: structuredClone(defaultFilterOptions), filterSubmitType: '' });
        await this._calculateTestScenarioAndCase(domainEvents.ACTION.ACCEPTGENERATE);
      }
    });

    eventBus.subscribe(this, domainEvents.TEST_CASE_MENU_DOMAINEVENT, (event) => {
      const { code } = event.message;
      this._handleShortCutEvents(code);
    });

    eventBus.subscribe(this, domainEvents.TEST_DATA_DOMAINEVENT, async (event) => {
      if (event.message.action === domainEvents.ACTION.UPDATE) {
        setGenerating(GENERATE_STATUS.START);
        this.setState({ filterOptions: structuredClone(defaultFilterOptions), filterSubmitType: '' });
        await this._calculateTestScenarioAndCase(domainEvents.ACTION.UPDATE);
      }
    });

    eventBus.subscribe(this, domainEvents.REIN_MENU_DOMAINEVENT, (event) => {
      const { code } = event.message;
      this._handleShortCutEvents(code);
    });

    TEST_CASE_SHORTCUT.forEach(({ code, shortcutKeys }) => {
      if (shortcutKeys) {
        Mousetrap.bind(shortcutKeys.join('+'), (e) => {
          e.preventDefault();
          this._handleShortCutEvents(code);
        });
      }
    });
  }

  async componentDidUpdate(prevProps) {
    const { webWorker } = this.state;
    const { generating, dbContext, setDbContext } = this.props;
    if (prevProps.generating === GENERATE_STATUS.START && generating === GENERATE_STATUS.REQUEST_CANCEL) {
      setGenerating(GENERATE_STATUS.RESET);
      webWorker.postMessage(generating);
    } else if (prevProps.generating === GENERATE_STATUS.START && generating === GENERATE_STATUS.SUCCESS) {
      // need recreate the dbcontext to load new IndexedDb data from worker
      const newContext = new DbContext();
      await newContext.init(dbContext.name);
      setDbContext(newContext);
    }
    if (
      (prevProps.dbContext === null && dbContext && dbContext.db) ||
      (generating === GENERATE_STATUS.SUCCESS && prevProps.generating === GENERATE_STATUS.START)
    ) {
      const indexedDb = window.indexedDB;
      const request = indexedDb.open(dbContext.name, dbContext.version);
      request.onsuccess = async (e) => {
        const db = e.target.result;
        const transaction = await db.transaction([TABLES.TEST_CASES], 'readonly');
        const objectStore = await transaction.objectStore(TABLES.TEST_CASES);
        const keys = await objectStore.getAllKeys();
        keys.onsuccess = async () => {
          const maxTestCase = keys.result[keys.result.length - 1];
          if (typeof maxTestCase === 'number') {
            this.setState({ maxTestCase });
          }
        };
        transaction.oncomplete = function () {
          db.close();
        };
      };
    }
  }

  componentWillUnmount() {
    const { webWorker } = this.state;
    eventBus.unsubscribe(this);
    if (webWorker) {
      webWorker.terminate();
    }
  }

  _calculateTestScenarioAndCase = async (domainAction) => {
    try {
      const { graph, testDatas, setGraph, dbContext, match } = this.props;
      const { webWorker, maxTestCase } = this.state;
      const { workId } = match.params;

      const { testScenarioSet, testCaseSet } = dbContext;
      await testScenarioSet.delete();
      await testCaseSet.delete();

      let scenarioAndGraphNodes = null;

      if (appConfig.general.testCaseMethod === TEST_CASE_METHOD.MUMCUT) {
        scenarioAndGraphNodes = DNFLogicCoverage.buildTestScenario(
          graph.graphLinks,
          graph.constraints,
          graph.graphNodes
        );
      } else {
        scenarioAndGraphNodes = MyersTechnique.buildTestScenario(graph.graphLinks, graph.constraints, graph.graphNodes);
      }

      const { scenarios, graphNodes } = scenarioAndGraphNodes;

      const testScenarios = scenarios.map((testScenario, index) => {
        const _testScenario = testScenario;
        _testScenario.workId = workId;
        _testScenario.tsIndex = index;
        _testScenario.isSelected = Boolean(_testScenario.isSelected);
        _testScenario.isBaseScenario = Boolean(_testScenario.isBaseScenario);
        return _testScenario;
      });
      await testScenarioSet.add(testScenarios);

      const _dbInfo = {
        name: dbContext.name,
        version: dbContext.version,
        table: TABLES.TEST_CASES,
      };

      webWorker.postMessage({
        dbInfo: JSON.stringify(_dbInfo),
        testScenarios: JSON.stringify(testScenarios),
        graphNodes: JSON.stringify(graphNodes),
        testDatas: JSON.stringify(testDatas),
        lastKey: maxTestCase,
      });

      await setGraph({ ...graph, graphNodes });

      this._raiseEvent({
        action: domainAction,
        value: graphNodes,
        receivers: [domainEvents.DES.GRAPH, domainEvents.DES.SSMETRIC],
      });
    } catch (error) {
      setGenerating(GENERATE_STATUS.FAIL);
    }
  };

  _raiseEvent = (message) => {
    eventBus.publish(domainEvents.TEST_SCENARIO_DOMAINEVENT, message);
  };

  _getTestScenarioAndCase = async (isFilter = true) => {
    const { dbContext, graph } = this.props;
    if (dbContext && dbContext.db) {
      const { testScenarioSet, testCaseSet } = dbContext;
      const columns = TestScenarioHelper.convertToColumns(graph.graphNodes);
      const testScenarios = await testScenarioSet.get();
      const promises = testScenarios.map(async (testScenario) => {
        const _testScenario = testScenario;
        _testScenario.testCases = await testCaseSet.get(testCaseSet.table.testScenarioId.eq(testScenario.id));
        return _testScenario;
      });

      const testScenariosAndCases = await Promise.all(promises);
      const rows = TestScenarioHelper.convertToRows(testScenariosAndCases, testScenarios, columns, graph.graphNodes);

      if (isFilter) {
        const selectedRows = rows.filter(
          (row) => row.isSelected || row.testCases.some((testCase) => testCase.isSelected)
        );
        selectedRows.forEach((testScenario) => {
          const _testScenario = testScenario;
          _testScenario.testCases = testScenario.testCases.filter((testCase) => testCase.isSelected);
          return _testScenario;
        });

        return { rows: selectedRows.length > 0 ? selectedRows : rows, columns };
      }
      return { rows, columns };
    }
    return { rows: [], columns: [] };
  };

  _handleShortCutEvents = (code) => {
    switch (code) {
      case TEST_CASE_SHORTCUT_CODE.EXPORT:
        this._exportData();
        break;
      case TEST_CASE_SHORTCUT_CODE.METHOLOGY:
        console.log('METHOLOGY');
        break;
      case TEST_CASE_SHORTCUT_CODE.CONTRACTION:
        console.log('CONTRACTION');
        break;
      case TEST_CASE_SHORTCUT_CODE.EXPORT_TEST_SCENARIO:
        this._exportTestScenario();
        break;
      case TEST_CASE_SHORTCUT_CODE.EXPORT_TEST_CASE:
        this._exportTestCase();
        break;
      case REIN_SHORTCUT_CODE.UPLOAD_TEST_CASE:
        this._uploadTestCasesToCloud();
        break;
      default:
        break;
    }
  };

  _createTestCasesFile = async () => {
    const { graph } = this.props;
    const dataToConvert = [];
    const { rows, columns } = await this._getTestScenarioAndCase();

    rows.forEach((row) => {
      row.testCases.forEach((testCase) => {
        dataToConvert.push(this._createExportRowData(testCase, columns));
      });
    });
    return arrayToCsv(dataToConvert, graph.graphNodes, EXPORT_TYPE_NAME.TestCase);
  };

  _setFilterOptions = (key, value) => {
    if (key === FILTER_OPTIONS.TYPE && value === FILTER_TYPE.RESET) {
      this.setState({ filterOptions: structuredClone(defaultFilterOptions) });
    } else {
      this.setState((prevState) => ({ filterOptions: { ...prevState.filterOptions, [key]: value } }));
    }
  };

  _handleFilterTestScenario = (filterSubmitType) => {
    this.setState({ filterSubmitType });
  };

  _createExportRowData(item, columns) {
    const row = { Name: item.Name, Checked: item.isSelected };
    columns.forEach((col) => {
      row[col.headerName] = item[col.key];
    });
    return row;
  }

  async _exportData() {
    const { workName, graph, match } = this.props;
    const { workId } = match.params;
    const dataToConvert = [];
    const { rows, columns } = await this._getTestScenarioAndCase();

    rows.forEach((row) => {
      dataToConvert.push(this._createExportRowData(row, columns));
      row.testCases.forEach((testCase) => {
        dataToConvert.push(this._createExportRowData(testCase, columns));
      });
    });
    const csvFile = arrayToCsv(dataToConvert, graph.graphNodes, EXPORT_TYPE_NAME.TestCase);
    Download(
      csvFile,
      `${workId}_${FILE_NAME.EXPORT_TEST_CASE.replace('workname', workName)}`,
      'text/csv;charset=utf-8'
    );
  }

  async _exportTestScenario() {
    const { workName, graph } = this.props;
    const dataToConvert = [];
    const { rows, columns } = await this._getTestScenarioAndCase(false);

    const selectedRows = rows.filter((row) => row.isSelected);

    const _rows = selectedRows.length > 0 ? selectedRows : rows;

    _rows.forEach((row) => {
      dataToConvert.push(this._createExportRowData(row, columns));
    });
    const csvFile = arrayToCsv(dataToConvert, graph.graphNodes, EXPORT_TYPE_NAME.TestCase);
    Download(csvFile, FILE_NAME.EXPORT_TEST_SCENARIO.replace('workname', workName), 'text/csv;charset=utf-8');
  }

  async _exportTestCase() {
    const { workName } = this.props;
    const csvFile = await this._createTestCasesFile();

    Download(csvFile, FILE_NAME.EXPORT_TEST_CASE.replace('workname', workName), 'text/csv;charset=utf-8');
  }

  async _uploadTestCasesToCloud() {
    const alertCloseFunction = alert(Language.get('uploadingtestcase'), {
      title: Language.get('uploading'),
      iconClassName: 'bi bi-cloud-arrow-up',
    });
    const { workName, match } = this.props;
    const { workId, projectId } = match.params;
    const csvFile = new Blob([this._createTestCasesFile()], { type: 'text/csv;charset=UTF-8' });
    const formData = new FormData();

    formData.append('workId', workId);
    formData.append('projectId', projectId);
    formData.append('file', csvFile, FILE_NAME.EXPORT_TEST_CASE.replace('workname', workName));

    const result = await reInCloudService.uploadTestCases(formData);
    alertCloseFunction();
    if (result.error) {
      alert(result.error.message, { title: 'error', iconClassName: 'bi bi-cloud-arrow-up' });
    } else {
      alert(Language.get('uploadtestcasesuccess'), {
        title: Language.get('success'),
        iconClassName: 'bi bi-cloud-arrow-up',
      });
    }
  }

  render() {
    const { filterOptions, filterSubmitType } = this.state;

    return (
      <div>
        <FilterBar
          filterOptions={filterOptions}
          setFilterOptions={this._setFilterOptions}
          onSubmit={this._handleFilterTestScenario}
        />
        <TableTestScenarioAndCase
          filterOptions={filterOptions}
          filterSubmitType={filterSubmitType}
          submitFilter={this._handleFilterTestScenario}
        />
      </div>
    );
  }
}

TestScenarioAndCase.propTypes = {
  workName: PropTypes.string,
  graph: PropTypes.shape({
    graphNodes: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    graphLinks: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    constraints: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  }).isRequired,
  testDatas: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  setGraph: PropTypes.func.isRequired,
  setGenerating: PropTypes.func.isRequired,
  dbContext: PropTypes.oneOfType([PropTypes.object]),
  generating: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  setDbContext: PropTypes.func.isRequired,
};

TestScenarioAndCase.defaultProps = {
  workName: undefined,
  dbContext: null,
};

const mapStateToProps = (state) => ({
  workName: state.work.name,
  graph: state.work.graph,
  testDatas: state.work.testDatas,
  dbContext: state.work.dbContext,
  generating: state.work.generating,
  name: state.work.name,
});

const mapDispatchToProps = { setGraph, setGenerating, setDbContext };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TestScenarioAndCase));
