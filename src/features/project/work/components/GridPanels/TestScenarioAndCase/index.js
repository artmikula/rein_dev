/* eslint-disable max-lines */
import Download from 'downloadjs';
import testCaseHelper from 'features/project/work/biz/TestCase';
import TestScenarioHelper from 'features/project/work/biz/TestScenario/TestScenarioHelper';
import MyersTechnique from 'features/project/work/biz/TestScenario/TestScenarioMethodGenerate/MyersTechnique';
import DNFLogicCoverage from 'features/project/work/biz/TestScenario/TestScenarioMethodGenerate/DNFLogicCoverage';
import reInCloudService from 'features/project/work/services/reInCloudService';
import testScenarioAnsCaseStorage from 'features/project/work/services/TestScenarioAnsCaseStorage';
import { setGraph, setGenerating } from 'features/project/work/slices/workSlice';
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
import worker from 'features/project/work/biz/worker/testCase.worker';
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
  [FILTER_OPTIONS.TYPE]: FILTER_TYPE.DEFAULT,
};

class TestScenarioAndCase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      columns: [],
      filterOptions: structuredClone(defaultFilterOptions),
      isLoading: false,
    };
    this.worker = null;
    this.initiatedData = false;
  }

  async componentDidMount() {
    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, async (event) => {
      if (event.message.action === domainEvents.ACTION.GENERATE) {
        this.setState({ filterOptions: structuredClone(defaultFilterOptions) });
        await this._calculateTestScenarioAndCase(domainEvents.ACTION.ACCEPTGENERATE);
      } else if (
        event.message.action !== domainEvents.ACTION.REPORTWORK &&
        event.message.action !== domainEvents.ACTION.GRAPH_ALIGN
      ) {
        this._clearData();
      }
    });

    eventBus.subscribe(this, domainEvents.TEST_CASE_MENU_DOMAINEVENT, (event) => {
      const { code } = event.message;
      this._handleShortCutEvents(code);
    });

    eventBus.subscribe(this, domainEvents.TEST_DATA_DOMAINEVENT, async (event) => {
      if (event.message.action === domainEvents.ACTION.UPDATE) {
        await this._calculateTestScenarioAndCase(domainEvents.ACTION.UPDATE);
      }
    });

    eventBus.subscribe(this, domainEvents.WORK_MENU_DOMAINEVENT, (event) => {
      this._handleWorkMenuEvents(event);
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
    this.worker = new Worker(worker, { type: 'module' });
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
  }

  _clearData = async () => {
    const { dbContext } = this.props;
    this.setState({ columns: [] });

    const { testScenarioSet } = dbContext;
    await testScenarioSet.delete();

    /** TODO: remove this after finish implement indexedDb */
    testScenarioAnsCaseStorage.set([]);
  };

  _calculateTestScenarioAndCase = async (domainAction) => {
    try {
      const { graph, testDatas, setGraph, dbContext, match, setGenerating } = this.props;
      const { workId } = match.params;

      let scenarioAndGraphNodes = null;
      setGenerating(GENERATE_STATUS.START);

      const { testScenarioSet, testCaseSet } = dbContext;
      await testScenarioSet.delete();

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

      const testScenarios = scenarios.map((testScenario) => {
        const _testScenario = testScenario;
        _testScenario.workId = workId;
        _testScenario.isSelected = Boolean(_testScenario.isSelected);
        _testScenario.isBaseScenario = Boolean(_testScenario.isBaseScenario);
        return _testScenario;
      });
      await testScenarioSet.add(testScenarios);

      const _testScenarios = await testScenarioSet.get();

      await testCaseHelper.init(_testScenarios, graphNodes, testDatas, testCaseSet);
      const _dbInfo = {
        name: dbContext.name,
        version: dbContext.version,
        table: TABLES.TEST_CASES,
      };

      this.worker.postMessage({
        dbInfo: JSON.stringify(_dbInfo),
        testScenarios: JSON.stringify(_testScenarios),
        graphNodes: JSON.stringify(graphNodes),
        testDatas: JSON.stringify(testDatas),
      });
      this.worker.onmessage = (e) => console.log('post', e);

      // const _testCases = await testCaseHelper.generateTestCases(testCaseSet);
      // await testCaseHelper.createTestCases();
      setGenerating(GENERATE_STATUS.COMPLETE);

      // this.worker.postMessage('Start');
      // this.worker.onmessage = async (ev) => {
      //   try {
      //
      //     const result = await ev.data;
      //     if (result) {
      //       const columns = TestScenarioHelper.convertToColumns(graph.graphNodes, Language);
      //       setGenerating(GENERATE_STATUS.COMPLETE);
      //       this.setState({ isLoading: true, columns });
      //       await this._getTestScenarioAndCase();
      //       this.setState({ isLoading: false });
      //       this.worker.terminate();
      //     }
      //   } catch (error) {
      //     console.log('cannot generate', error);
      //     setGenerating(GENERATE_STATUS.FAIL);
      //     this.worker.terminate();
      //   }
      // };

      /** TODO: remove this after finish implement indexedDb */
      // const newTestScenariosAndCases = newTestScenarios.map((x) => {
      //   const scenario = {
      //     ...x,
      //     testCases: testCases.filter((e) => e.testScenarioId === x.id).map((y) => y),
      //   };

      //   return scenario;
      // });

      // testScenarioAnsCaseStorage.set(newTestScenariosAndCases);
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

  _getTestScenarioAndCase = async () => {
    const { dbContext, graph } = this.props;
    if (dbContext && dbContext.db) {
      const { testScenarioSet, testCaseSet } = dbContext;
      const testScenarios = await testScenarioSet.get();
      const testCases = await testCaseSet.get();
      const columns = TestScenarioHelper.convertToColumns(graph.graphNodes, Language);
      return TestScenarioHelper.convertToRows(testCases, testScenarios, columns, graph.graphNodes);
    }
    return [];
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

  _handleWorkMenuEvents = async (event) => {
    const { action } = event.message;
    if (action === domainEvents.ACTION.REPORTWORK) {
      const data = await this._getTestScenarioAndCase();
      if (data.length > 0) {
        const reportData = testCaseHelper.generateReportData(data);
        this._raiseEvent({
          action: domainEvents.ACTION.REPORTWORK,
          value: reportData,
          receivers: [domainEvents.DES.WORKMENU],
        });
      }
    }
  };

  /** TODO: remove this after finish implement indexedDb */
  // _setRows = (rows) => {
  //   this._raiseEvent({
  //     action: domainEvents.ACTION.UPDATE,
  //   });

  //   this.setState({ rows }, this._isCheckedAllTestScenarios);
  // };

  _createTestCasesFile = async () => {
    const { graph } = this.props;
    const { columns } = this.state;
    const dataToConvert = [];
    const testScenarioAndCase = await this._getTestScenarioAndCase();

    testScenarioAndCase.forEach((testScenario) => {
      testScenario.testCases.forEach((testCase) => {
        dataToConvert.push(this._createExportRowData(testCase, columns));
      });
    });
    return arrayToCsv(dataToConvert, graph.graphNodes, EXPORT_TYPE_NAME.TestCase);
  };

  _setFilterOptions = (key, value) => {
    if (key === 'type' && value === FILTER_TYPE.RESET) {
      this.setState({ filterOptions: { ...defaultFilterOptions, type: 'reset' } });
    } else {
      this.setState((prevState) => ({ filterOptions: { ...prevState.filterOptions, [key]: value } }));
    }
  };

  _createExportRowData(item, columns) {
    const row = { Name: item.Name, Checked: item.isSelected };
    columns.forEach((col) => {
      row[col.headerName] = item[col.key];
    });
    return row;
  }

  async _exportData() {
    const { workName, graph, workId } = this.props;
    const { columns } = this.state;
    const dataToConvert = [];
    const testScenarioAndCase = await this._getTestScenarioAndCase();

    testScenarioAndCase.forEach((testScenario) => {
      dataToConvert.push(this._createExportRowData(testScenario, columns));
      testScenario.testCases.forEach((testCase) => {
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
    const { columns } = this.state;
    const dataToConvert = [];
    const testScenarioAndCase = await this._getTestScenarioAndCase();

    testScenarioAndCase.forEach((testScenario) => {
      dataToConvert.push(this._createExportRowData(testScenario, columns));
    });
    const csvFile = arrayToCsv(dataToConvert, graph.graphNodes, EXPORT_TYPE_NAME.TestCase);
    Download(csvFile, FILE_NAME.EXPORT_TEST_SCENARIO.replace('workname', workName), 'text/csv;charset=utf-8');
  }

  _exportTestCase() {
    const { workName } = this.props;
    const csvFile = this._createTestCasesFile();

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
    const { columns, filterOptions, isLoading } = this.state;

    return isLoading ? (
      <div className="loading_text" />
    ) : (
      <div>
        <FilterBar
          filterOptions={filterOptions}
          setFilterOptions={this._setFilterOptions}
          getData={this._getTestScenarioAndCase}
        />
        <TableTestScenarioAndCase
          filterOptions={filterOptions}
          getData={this._getTestScenarioAndCase}
          columns={columns}
        />
      </div>
    );
  }
}

TestScenarioAndCase.propTypes = {
  workId: PropTypes.string,
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
};

TestScenarioAndCase.defaultProps = {
  workId: undefined,
  workName: undefined,
  dbContext: null,
};

const mapStateToProps = (state) => ({
  workId: state.work.id,
  workName: state.work.name,
  graph: state.work.graph,
  testDatas: state.work.testDatas,
  dbContext: state.work.dbContext,
});

const mapDispatchToProps = { setGraph, setGenerating };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TestScenarioAndCase));
