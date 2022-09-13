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
  causeNodes: null,
  results: undefined,
  resultType: RESULT_TYPE.All,
  isBaseScenario: undefined,
  isValid: undefined,
  sourceTargetType: undefined,
};

class TestScenarioAndCase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      columns: [],
      rows: [],
      isCheckAllTestScenarios: false,
      filterRows: undefined,
      filterOptions: structuredClone(defaultFilterOptions),
      isLoading: false,
    };
    this.worker = null;
    this.initiatedData = false;
  }

  async componentDidMount() {
    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, async (event) => {
      if (event.message.action === domainEvents.ACTION.GENERATE) {
        this.setState({
          isCheckAllTestScenarios: false,
          filterOptions: structuredClone(defaultFilterOptions),
          filterRows: undefined,
        });
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
    await this._getData();
  }

  async componentDidUpdate() {
    if (!this.initiatedData) {
      await this._getData();
    }
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
  }

  _clearData = async () => {
    const { dbContext } = this.props;
    this.setState({ isCheckAllTestScenarios: false, filterRows: undefined, columns: [] });

    const { testScenarioSet } = dbContext;
    await testScenarioSet.delete();

    /** TODO: remove this after finish implement indexedDb */
    testScenarioAnsCaseStorage.set([]);
  };

  _getData = async () => {
    const { graph, workLoaded, dbContext } = this.props;
    const testCasesRows = [];

    if (dbContext && dbContext.db) {
      const { testScenarioSet, testCaseSet } = dbContext;

      if (!this.initiatedData && workLoaded) {
        const testScenarios = await testScenarioSet.get();

        const promises = testScenarios.map(async (testScenario) => {
          const testCases = await testCaseSet.get(testCaseSet.table.testScenarioId.eq(testScenario.id));

          testCases.forEach((testCase) => {
            const testDatas = testCase.testDatas.map((x) => {
              const result = {
                graphNodeId: x.graphNodeId,
                data: x.data,
              };

              return result;
            });

            testCasesRows.push({
              ...testCase,
              testScenario: { ...testScenario },
              testDatas,
              results: testCase.results,
            });
          });

          const _testScenario = testScenario;
          _testScenario.testCases = testCases;
          return _testScenario;
        });

        await Promise.all(promises);

        this.initiatedData = true;
        const columns = TestScenarioHelper.convertToColumns(graph.graphNodes, Language);
        this.setState({ columns });
      }
    }
  };

  _calculateTestScenarioAndCase = async (domainAction) => {
    try {
      const { graph, testDatas, setGraph, dbContext, match, setGenerating } = this.props;
      const { workId } = match.params;

      this.worker = await new Worker('features/project/work/biz/worker/testCase.worker.js');

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

      // const _testCases = await testCaseHelper.generateTestCases(testCaseSet);

      this.worker.postMessage('Start');
      this.worker.onmessage = async (ev) => {
        try {
          await testCaseHelper.createTestCases();
          const result = await ev.data;
          if (result) {
            const columns = TestScenarioHelper.convertToColumns(graph.graphNodes, Language);
            setGenerating(GENERATE_STATUS.COMPLETE);
            this.setState({ isLoading: true, columns });
            await this._getTestScenarioAndCase();
            this.setState({ isLoading: false });
            this.worker.terminate();
          }
        } catch (error) {
          console.log('cannot generate', error);
          setGenerating(GENERATE_STATUS.FAIL);
          this.worker.terminate();
        }
      };

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
    const { columns } = this.state;
    if (dbContext && dbContext.db) {
      const { testScenarioSet, testCaseSet } = dbContext;
      const testScenarios = await testScenarioSet.get();
      const testCases = await testCaseSet.get();
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
  _setRows = (rows) => {
    this._raiseEvent({
      action: domainEvents.ACTION.UPDATE,
    });

    this.setState({ rows }, this._isCheckedAllTestScenarios);
  };

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

  _setFilterOptions = (value) => {
    this.setState((prevState) => ({ filterOptions: { ...prevState.filterOptions, ...value } }));
  };

  _clearFilterOptions = () => {
    this.setState({ filterOptions: structuredClone(defaultFilterOptions) }, () => this._onChangeFilterOptions('reset'));
  };

  _onChangeFilterOptions = (type = 'default') => {
    const { rows, filterOptions } = this.state;
    const { causeNodes, sourceTargetType, resultType, isBaseScenario, isValid } = filterOptions;
    let _resultType;
    if (resultType !== RESULT_TYPE.All) {
      _resultType = resultType === RESULT_TYPE.True;
    } else {
      _resultType = undefined;
    }
    const filterRows = rows.filter((row) => {
      const testAssertionFilter = row.testAssertions?.filter((testAssertion) =>
        causeNodes?.some((causeNode) => causeNode?.value === testAssertion?.graphNodeId)
      );
      const isExist = causeNodes?.every((causeNode) =>
        row.testAssertions?.some((testAssertion) => causeNode?.value === testAssertion?.graphNodeId)
      );
      const causeNodesResultType = testAssertionFilter.every((testAssertion) => testAssertion.result === _resultType);
      if (typeof isExist !== 'undefined' && !isExist) {
        return false;
      }
      if (typeof _resultType !== 'undefined' && !causeNodesResultType) {
        return false;
      }
      if (typeof sourceTargetType !== 'undefined' && isExist && sourceTargetType !== row.sourceTargetType) {
        return false;
      }
      if (
        typeof sourceTargetType !== 'undefined' &&
        typeof isExist === 'undefined' &&
        sourceTargetType !== row.sourceTargetType
      ) {
        return false;
      }
      if (typeof isBaseScenario !== 'undefined' && isBaseScenario === true && isBaseScenario !== row.isBaseScenario) {
        return false;
      }
      if (typeof isValid !== 'undefined' && isValid === true && isValid !== row.isValid) {
        return false;
      }
      return true;
    });
    if (type === 'reset') {
      this.setState({ filterRows: undefined });
    } else {
      this.setState({ filterRows });
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
    const { columns, isCheckAllTestScenarios, filterRows, filterOptions, isLoading } = this.state;

    return isLoading ? (
      <div className="loading_text" />
    ) : (
      <div>
        <FilterBar
          filterOptions={filterOptions}
          resetFilter={this._clearFilterOptions}
          setFilterOptions={this._setFilterOptions}
          submitFilter={this._onChangeFilterOptions}
          getData={this._getTestScenarioAndCase}
        />
        <TableTestScenarioAndCase
          getData={this._getTestScenarioAndCase}
          filterRows={filterRows}
          columns={columns}
          setRows={this._setRows}
          isCheckAllTestScenarios={isCheckAllTestScenarios}
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
  workLoaded: PropTypes.bool.isRequired,
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
  workLoaded: state.work.loaded,
  dbContext: state.work.dbContext,
});

const mapDispatchToProps = { setGraph, setGenerating };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TestScenarioAndCase));
