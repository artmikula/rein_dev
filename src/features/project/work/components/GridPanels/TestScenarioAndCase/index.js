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
  effectNodes: undefined,
  results: undefined,
  resultType: undefined,
  isBaseScenario: undefined,
  isValid: undefined,
  targetType: undefined,
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

  componentDidMount() {
    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, (event) => {
      if (event.message.action === domainEvents.ACTION.GENERATE) {
        this.setState({ isCheckAllTestScenarios: false });
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

  _clearData = () => {
    this._setColumnsAndRows([], [], []);
    this.setState({ isCheckAllTestScenarios: false, filterRows: undefined });
    testScenarioAnsCaseStorage.set([]);
  };

  _initData = () => {
    const { graph, workLoaded } = this.props;
    const testCases = [];
    const testScenariosAndCases = testScenarioAnsCaseStorage.get();

    if (!this.initiatedData && workLoaded) {
      testScenariosAndCases.forEach((testScenario) => {
        testScenario.testCases.forEach((testCase) => {
          const testDatas = testCase.testDatas.map((x) => {
            const result = {
              graphNodeId: x.graphNodeId,
              data: x.data,
            };

            return result;
          });

          testCases.push({
            ...testCase,
            testScenario: { ...testScenario },
            testDatas,
            results: testCase.results,
          });
        });
      });

      this.initiatedData = true;
      this._setColumnsAndRows(testCases, testScenariosAndCases, graph.graphNodes);
    }
  };

  _calculateTestScenarioAndCase = async (domainAction) => {
    const { graph, testDatas, setGraph, match } = this.props;
    const { workId } = match.params;
    let scenarioAndGraphNodes = null;

    if (appConfig.general.testCaseMethod === TEST_CASE_METHOD.MUMCUT) {
      scenarioAndGraphNodes = DNFLogicCoverage.buildTestScenario(graph.graphLinks, graph.constraints, graph.graphNodes);
    } else {
      scenarioAndGraphNodes = MyersTechnique.buildTestScenario(graph.graphLinks, graph.constraints, graph.graphNodes);
    }

    const newTestScenarios = scenarioAndGraphNodes.scenarios
      .filter((x) => !x.isViolated)
      .map((x) => {
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
          // testResults: x.testResults.map((y) => {
          //   return {
          //     ...y,
          //     workId,
          //   };
          // }),
        };

        return scenario;
      });

    const newGraphNodes = scenarioAndGraphNodes.graphNodes;

    const testCases = testCaseHelper.updateTestCase(newTestScenarios, testDatas, newGraphNodes);

    this._setColumnsAndRows(testCases, newTestScenarios, newGraphNodes);

    const newTestScenariosAndCases = newTestScenarios.map((x) => {
      const scenario = {
        ...x,
        testCases: testCases
          .filter((e) => e.testScenarioId === x.id)
          .map((y) => {
            return {
              ...y,
              workId,
            };
          }),
      };

      return scenario;
    });

    testScenarioAnsCaseStorage.set(newTestScenariosAndCases);
    setGraph({ ...graph, graphNodes: newGraphNodes });

    this._raiseEvent({
      action: domainAction,
      value: domainAction === domainEvents.ACTION.ACCEPTGENERATE ? scenarioAndGraphNodes : newGraphNodes,
      receivers: [domainEvents.DES.GRAPH, domainEvents.DES.SSMETRIC],
    });
  };

  _raiseEvent = (message) => {
    eventBus.publish(domainEvents.TEST_SCENARIO_DOMAINEVENT, message);
  };

  _setColumnsAndRows = (testCases = [], scenarios = [], graphNodes = []) => {
    const columns = TestScenarioHelper.convertToColumns(graphNodes, Language);
    const rows = TestScenarioHelper.convertToRows(testCases, scenarios, columns);

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
    const { filterOptions } = this.state;
    this.setState({ filterOptions: structuredClone(defaultFilterOptions) }, () =>
      this._onChangeFilterOptions(filterOptions, 'reset')
    );
  };

  _onChangeFilterOptions = (filterOptions, type = 'default') => {
    const { rows } = this.state;
    const { effectNodes, targetType, resultType, isBaseScenario, isValid } = filterOptions;
    const filterRows = rows.filter((row) => {
      if (typeof effectNodes !== 'undefined' && effectNodes?.some((effectNode) => row.results !== effectNode.value)) {
        return false;
      }
      if (typeof targetType !== 'undefined' && targetType !== row.targetType) {
        return false;
      }
      if (typeof resultType !== 'undefined' && resultType !== row.resultType) {
        return false;
      }
      if (typeof isBaseScenario !== 'undefined' && isBaseScenario !== row.isBaseScenario) {
        return false;
      }
      if (typeof isValid !== 'undefined' && isValid !== row.isValid) {
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

    const effectNodes = rows
      .filter((row, index, array) => array.findIndex((arr) => arr.results === row.results) === index)
      .map((row) => ({ value: row.results, label: row.results }))
      .sort((a, b) => {
        if (a.label < b.label) {
          return -1;
        }
        if (a.label > b.label) {
          return 1;
        }
        return 0;
      });

    return (
      <div>
        <FilterBar
          effectNodes={effectNodes}
          filterOptions={filterOptions}
          resetFilter={this._clearFilterOptions}
          onChangeFilter={this._setFilterOptions}
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
};

TestScenarioAndCase.defaultProps = {
  workId: undefined,
  workName: undefined,
};

const mapStateToProps = (state) => ({
  workId: state.work.id,
  workName: state.work.name,
  graph: state.work.graph,
  testDatas: state.work.testDatas,
  workLoaded: state.work.loaded,
});

const mapDispatchToProps = { setGraph };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TestScenarioAndCase));
