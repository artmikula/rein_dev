/* eslint-disable max-lines */
import Download from 'downloadjs';
import testCaseHelper from 'features/project/work/biz/TestCase';
import TestScenarioHelper from 'features/project/work/biz/TestScenario/TestScenarioHelper';
import MyersTechnique from 'features/project/work/biz/TestScenario/TestScenarioMethodGenerate/MyersTechnique';
import DNFLogicCoverage from 'features/project/work/biz/TestScenario/TestScenarioMethodGenerate/DNFLogicCoverage';
import reInCloudService from 'features/project/work/services/reInCloudService';
import testScenarioAnsCaseStorage from 'features/project/work/services/TestScenarioAnsCaseStorage';
import { setGraph } from 'features/project/work/slices/workSlice';
import {
  FILE_NAME,
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
    };
    this.initiatedData = false;
  }

  async componentDidMount() {
    const { dbContext } = this.props;
    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, async (event) => {
      if (event.message.action === domainEvents.ACTION.GENERATE) {
        this.setState({
          isCheckAllTestScenarios: false,
          filterOptions: structuredClone(defaultFilterOptions),
          filterRows: undefined,
        });
        if (dbContext && dbContext.db) {
          const { testScenarios: testScenariosSet } = dbContext;
          const testScenarios = await testScenariosSet.get();
          if (testScenarios.length > 0) {
            await testScenariosSet.delete();
          }
        }
        this._calculateTestScenarioAndCase(domainEvents.ACTION.ACCEPTGENERATE);
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

    eventBus.subscribe(this, domainEvents.TEST_DATA_DOMAINEVENT, (event) => {
      if (event.message.action === domainEvents.ACTION.UPDATE) {
        this._calculateTestScenarioAndCase(domainEvents.ACTION.UPDATE);
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
    this._initData();
  }

  componentDidUpdate() {
    this._initData();
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
  }

  _clearData = async () => {
    const { dbContext } = this.props;
    this._setColumnsAndRows([], [], []);
    this.setState({ isCheckAllTestScenarios: false, filterRows: undefined });
    const { testScenarios: testScenariosSet } = dbContext;
    const testScenarios = await testScenariosSet.get();
    if (testScenarios.length > 0) {
      await testScenariosSet.delete();
    }
    /** TODO: remove this after finish implement indexedDb */
    testScenarioAnsCaseStorage.set([]);
  };

  _initData = async () => {
    const { graph, workLoaded, dbContext } = this.props;
    const testCasesRows = [];

    if (dbContext && dbContext.db) {
      const { testScenarios: testScenariosSet, testCases: testCasesSet } = dbContext;

      if (!this.initiatedData && workLoaded) {
        const testScenarios = await testScenariosSet.get();

        const promises = testScenarios.map(async (testScenario) => {
          const testCases = await testCasesSet.get(testCasesSet.table.testScenarioId.eq(testScenario.id));

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

          // eslint-disable-next-line no-param-reassign
          testScenario.testCases = testCases;
          return testScenario;
        });

        await Promise.all(promises);

        this.initiatedData = true;
        this._setColumnsAndRows(testCasesRows, testScenarios, graph.graphNodes);
      }
    }
  };

  _calculateTestScenarioAndCase = async (domainAction) => {
    const { graph, testDatas, setGraph, dbContext, match } = this.props;
    const { workId } = match.params;
    let scenarioAndGraphNodes = null;

    if (dbContext && dbContext.db) {
      const { testScenarios: testScenariosSet, testCases: testCasesSet } = dbContext;
      if (appConfig.general.testCaseMethod === TEST_CASE_METHOD.MUMCUT) {
        scenarioAndGraphNodes = DNFLogicCoverage.buildTestScenario(
          graph.graphLinks,
          graph.constraints,
          graph.graphNodes
        );
      } else {
        scenarioAndGraphNodes = MyersTechnique.buildTestScenario(graph.graphLinks, graph.constraints, graph.graphNodes);
      }

      const testScenarioSet = scenarioAndGraphNodes.scenarios.map((testScenario) => {
        const _testScenario = testScenario;
        _testScenario.workId = workId;
        _testScenario.isSelected = false;
        _testScenario.isBaseScenario = Boolean(_testScenario.isBaseScenario);
        return _testScenario;
      });
      await testScenariosSet.add(testScenarioSet);

      const testScenarios = scenarioAndGraphNodes.scenarios.map((x) => {
        const scenario = {
          ...x,
          testAssertions: x.testAssertions.map((y) => {
            const graphNode = graph.graphNodes.find((x) => x.nodeId === y.graphNodeId);
            return {
              ...y,
              result: y.result,
              graphNodeId: y.graphNodeId,
              graphNode,
              workId,
              testScenarioId: x.id,
            };
          }),
          workId,
        };

        return scenario;
      });

      const newGraphNodes = scenarioAndGraphNodes.graphNodes;

      const testCases = testCaseHelper.updateTestCase(testCasesSet, testScenarios, testDatas, newGraphNodes);

      this._setColumnsAndRows(testCases, testScenarios, newGraphNodes);

      // const newTestScenariosAndCases = newTestScenarios.map((x) => {
      //   const scenario = {
      //     ...x,
      //     testCases: testCases.filter((e) => e.testScenarioId === x.id).map((y) => y),
      //   };

      //   return scenario;
      // });

      // testScenarioAnsCaseStorage.set(newTestScenariosAndCases);
      setGraph({ ...graph, graphNodes: newGraphNodes });

      this._raiseEvent({
        action: domainAction,
        value: newGraphNodes,
        receivers: [domainEvents.DES.GRAPH, domainEvents.DES.SSMETRIC],
      });
    }
  };

  _raiseEvent = (message) => {
    eventBus.publish(domainEvents.TEST_SCENARIO_DOMAINEVENT, message);
  };

  _setColumnsAndRows = (testCases = [], scenarios = [], graphNodes = []) => {
    const columns = TestScenarioHelper.convertToColumns(graphNodes, Language);
    const rows = TestScenarioHelper.convertToRows(testCases, scenarios, columns, graphNodes);

    this.setState({ rows, columns });
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

  _handleWorkMenuEvents = (event) => {
    const { action } = event.message;
    const { rows } = this.state;
    if (action === domainEvents.ACTION.REPORTWORK) {
      const reportData = testCaseHelper.generateReportData(rows);
      this._raiseEvent({
        action: domainEvents.ACTION.REPORTWORK,
        value: reportData,
        receivers: [domainEvents.DES.WORKMENU],
      });
    }
  };

  _setRows = (rows) => {
    this._raiseEvent({
      action: domainEvents.ACTION.UPDATE,
    });

    this.setState({ rows }, this._isCheckedAllTestScenarios);
  };

  _isCheckedAllTestScenarios = () => {
    const { rows } = this.state;
    const isCheckAllTestScenarios = rows.every(
      (row) => row.isSelected || row.testCases.every((testCase) => testCase.isSelected)
    );
    this.setState({ isCheckAllTestScenarios });
  };

  _createTestCasesFile = () => {
    const { graph } = this.props;
    const { columns, rows } = this.state;
    const dataToConvert = [];

    rows.forEach((testScenario) => {
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

  _exportData() {
    const { workName, graph, workId } = this.props;
    const { columns, rows } = this.state;
    const dataToConvert = [];

    rows.forEach((testScenario) => {
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

  _exportTestScenario() {
    const { workName, graph } = this.props;
    const { columns, rows } = this.state;
    const dataToConvert = [];

    rows.forEach((testScenario) => {
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
    const { columns, rows, isCheckAllTestScenarios, filterRows, filterOptions } = this.state;

    return (
      <div>
        <FilterBar
          rows={rows}
          filterOptions={filterOptions}
          resetFilter={this._clearFilterOptions}
          setFilterOptions={this._setFilterOptions}
          submitFilter={this._onChangeFilterOptions}
        />
        <TableTestScenarioAndCase
          rows={rows}
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

const mapDispatchToProps = { setGraph };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TestScenarioAndCase));
