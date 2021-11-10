/* eslint-disable max-lines */
import Download from 'downloadjs';
import testCaseHelper from 'features/project/work/biz/TestCase';
import TestScenarioHelper from 'features/project/work/biz/TestScenario/TestScenarioHelper';
import DNFLogicCoverage from 'features/project/work/biz/TestScenario/TestScenarioMethodGenerate/DNFLogicCoverage';
import MyersTechnique from 'features/project/work/biz/TestScenario/TestScenarioMethodGenerate/MyersTechnique';
import reInCloudService from 'features/project/work/services/reInCloudService';
import testScenarioAnsCaseStorage from 'features/project/work/services/TestScenarioAnsCaseStorage';
import { setGraph } from 'features/project/work/slices/workSlice';
import {
  FILE_NAME,
  TEMPLATE_SHORTCUT_CODE,
  TEST_CASE_METHOD,
  TEST_CASE_SHORTCUT,
  TEST_CASE_SHORTCUT_CODE,
} from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import eventBus from 'features/shared/lib/eventBus';
import { arrayToCsv } from 'features/shared/lib/utils';
import Mousetrap from 'mousetrap';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Select from 'react-select';
import { Button, FormGroup, Input, Label, Table } from 'reactstrap';
import { EXPORT_TYPE_NAME } from '../Graph/constants';
import './style.scss';

const options = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' },
];

class TestScenarioAndCase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedOption: null,
      columns: [],
      rows: [],
      expandId: {},
    };
    this.initiatedData = false;
  }

  componentDidMount() {
    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, (event) => {
      if (event.message.action === domainEvents.ACTION.GENERATE) {
        this._caculateTestScenarioAndCase(domainEvents.ACTION.ACCEPTGENERATE);
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
        this._caculateTestScenarioAndCase(domainEvents.ACTION.UPDATE);
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

  _caculateTestScenarioAndCase = (domainAction) => {
    const { graph, testDatas, setGraph, match } = this.props;
    const { workId } = match.params;
    let scenarioAndGraphNodes = null;

    if (appConfig.general.testCaseMethod === TEST_CASE_METHOD.MUMCUT) {
      scenarioAndGraphNodes = DNFLogicCoverage.buildTestScenario(graph.graphLinks, graph.constraints, graph.graphNodes);
    } else {
      scenarioAndGraphNodes = MyersTechnique.buildTestScenario(graph.graphLinks, graph.constraints, graph.graphNodes);
    }

    const testCases = testCaseHelper.updateTestCase(scenarioAndGraphNodes.scenarios, testDatas, graph.graphNodes);

    this._setColumnsAndRows(testCases, scenarioAndGraphNodes.scenarios, scenarioAndGraphNodes.graphNodes);

    const newTestScenariosAndCases = scenarioAndGraphNodes.scenarios.map((x) => {
      const scenario = {
        ...x,
        testAssertions: x.testAssertions.map((y) => {
          const assertion = {
            ...y,
            result: y.result,
            graphNodeId: y.graphNode.id,
            graphNode: y.graphNode,
            workId,
          };
          return assertion;
        }),
        testResults: x.testResults.map((y) => {
          const testResult = {
            ...y,
            workId,
          };
          return testResult;
        }),
        testCases: testCases
          .filter((e) => e.testScenarioId === x.id)
          .map((y) => {
            const testCase = {
              ...y,
              workId,
            };

            return testCase;
          }),
      };

      return scenario;
    });

    testScenarioAnsCaseStorage.set(newTestScenariosAndCases);
    setGraph({ ...graph, graphNodes: scenarioAndGraphNodes.graphNodes });

    this._raiseEvent({
      action: domainAction,
      value: scenarioAndGraphNodes.graphNodes,
      receivers: [domainEvents.DES.GRAPH, domainEvents.DES.SSMETRIC],
    });
  };

  handleChange = (selectedOption) => {
    this.setState({ selectedOption });
  };

  _raiseEvent = (message) => {
    eventBus.publish(domainEvents.TEST_SCENARIO_DOMAINEVENT, message);
  };

  _toggleRow = (e, id) => {
    e.preventDefault();
    this.setState((state) => ({ expandId: { ...state.expandId, [id]: !state.expandId[id] } }));
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
      case TEMPLATE_SHORTCUT_CODE.UPLOAD_TEST_CASE:
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

    this.setState({ rows });
  };

  _handleTestCaseChecked = (scenarioId, caseId, checked) => {
    testScenarioAnsCaseStorage.checkTestCase(scenarioId, caseId, checked);
    const { rows } = this.state;
    const newRows = testScenarioAnsCaseStorage.checkTestCase(scenarioId, caseId, checked, rows);

    this._setRows(newRows);
  };

  _handleTestScenarioChecked = (scenarioId, checked) => {
    testScenarioAnsCaseStorage.checkTestScenario(scenarioId, checked);
    const { rows } = this.state;
    const newRows = testScenarioAnsCaseStorage.checkTestScenario(scenarioId, checked, rows);

    this._setRows(newRows);
  };

  _handleCheckboxChange = (scenarioId, key, checked) => {
    testScenarioAnsCaseStorage.changeTestScenario(scenarioId, key, checked);
    const { rows } = this.state;
    const newRows = testScenarioAnsCaseStorage.changeTestScenario(scenarioId, key, checked, rows);

    this._setRows(newRows);
  };

  _createExportRowData(item, columns) {
    const row = { Name: item.Name, Checked: item.isSelected };
    columns.forEach((col) => {
      row[col.headerName] = item[col.key];
    });
    return row;
  }

  _exportData() {
    const { workName, graph } = this.props;
    const { columns, rows } = this.state;
    const dataToConvert = [];

    rows.forEach((testScenario) => {
      dataToConvert.push(this._createExportRowData(testScenario, columns));
      testScenario.testCases.forEach((testCase) => {
        dataToConvert.push(this._createExportRowData(testCase, columns));
      });
    });
    const csvFile = arrayToCsv(dataToConvert, graph.graphNodes, EXPORT_TYPE_NAME.TestCase);
    Download(csvFile, FILE_NAME.EXPORT_TEST_CASE.replace('workname', workName), 'text/csv;charset=utf-8');
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
    console.log(typeof csvFile, csvFile);
    formData.append('file', csvFile, FILE_NAME.EXPORT_TEST_CASE.replace('workname', workName));

    const result = await reInCloudService.uploadTestCases(formData);
    alertCloseFunction();
    if (result.error) {
      alert(result.error, { title: 'error', iconClassName: 'bi bi-cloud-arrow-up' });
    } else {
      alert(Language.get('uploadtestcasesuccess'), {
        title: Language.get('success'),
        iconClassName: 'bi bi-cloud-arrow-up',
      });
    }
  }

  render() {
    const { selectedOption, columns, rows, expandId } = this.state;

    return (
      <div>
        <div className="d-flex justify-content-between m-2">
          <div className="d-flex justify-content-around align-items-center small filter-wrapper">
            <div className="auto-complete">
              <Select
                isMulti
                value={selectedOption}
                onChange={this.handleChange}
                options={options}
                placeholder={Language.get('select')}
              />
            </div>
            <Input type="select" bsSize="sm" className="ml-2" style={{ minWidth: 66 }}>
              <option value="true">True</option>
              <option value="false">False</option>
            </Input>
            <div className="vertical-line d-flex ml-2" />
            <div className="ml-2 d-flex justify-content-center">
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="inlineRadioOptions" value="option1" />
                <Label className="form-check-label">{Language.get('and')}</Label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="inlineRadioOptions" value="option2" />
                <Label className="form-check-label">{Language.get('or')}</Label>
              </div>
            </div>
            <div className="vertical-line" />
            <div className="d-flex ml-2">
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="checkbox" value="option1" />
                <Label className="form-check-label">{Language.get('base')}</Label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="checkbox" value="option2" />
                <Label className="form-check-label">{Language.get('valid')}</Label>
              </div>
            </div>
          </div>
          <Button color="primary" size="sm">
            {Language.get('apply')}
          </Button>
        </div>
        <Table bordered className="scenario-case-table">
          <thead className="text-primary">
            <tr>
              <td>{Language.get('name')}</td>
              {columns.map((column, colIndex) => (
                <td key={colIndex} title={column.title} style={{ cursor: column.title ? 'pointer' : 'default' }}>
                  {column.headerName}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((testScenario, tsIndex) => {
              return (
                <React.Fragment key={tsIndex}>
                  <tr key={`${tsIndex}test-scenario-row`}>
                    <td
                      rowSpan={expandId[testScenario.id] ? testScenario.testCases.length + 1 : 1}
                      className="treeview"
                    >
                      <ul>
                        <li>
                          <ul className="d-inline-flex">
                            <a
                              style={{ paddingTop: '2px' }}
                              href="#collapse"
                              className="text-dark"
                              onClick={(e) => this._toggleRow(e, testScenario.id)}
                            >
                              <i
                                className={`mr-1 cursor-pointer ${
                                  expandId[testScenario.id] ? 'bi bi-dash-square-fill' : 'bi bi-plus-square-fill'
                                }`}
                              />
                            </a>
                            <FormGroup check>
                              <Label check>
                                <Input
                                  type="checkbox"
                                  className="mt-1"
                                  onChange={(e) => this._handleTestScenarioChecked(testScenario.id, e.target.checked)}
                                  checked={testScenario.isSelected ?? false}
                                />
                                <span className="font-weight-500" style={{ lineHeight: '21px' }}>
                                  {testScenario.Name}
                                </span>
                              </Label>
                            </FormGroup>
                          </ul>
                          <ul>
                            {expandId[testScenario.id] &&
                              testScenario.testCases.map((testCase, testIndex) => (
                                <li className="align-middle" key={`${testIndex}test-case-tree`}>
                                  <FormGroup check>
                                    <Label check>
                                      <Input
                                        type="checkbox"
                                        className="mt-1"
                                        onChange={(e) =>
                                          this._handleTestCaseChecked(testScenario.id, testCase.id, e.target.checked)
                                        }
                                        checked={testCase.isSelected ?? false}
                                      />
                                      {testCase.Name}
                                    </Label>
                                  </FormGroup>
                                </li>
                              ))}
                          </ul>
                        </li>
                      </ul>
                    </td>
                    {columns.map((column, colIndex) => (
                      <td key={`${colIndex}test-scenario-col`}>
                        {typeof testScenario[column.key] === 'boolean' ? (
                          <span className="d-flex">
                            <input
                              type="checkbox"
                              onChange={(e) =>
                                this._handleCheckboxChange(testScenario.id, column.key, e.target.checked)
                              }
                              checked={testScenario[column.key]}
                            />
                          </span>
                        ) : (
                          testScenario[column.key]
                        )}
                      </td>
                    ))}
                  </tr>
                  {expandId[testScenario.id] &&
                    testScenario.testCases.map((testCase, tcIndex) => (
                      <tr key={`${tcIndex}test-case-row`}>
                        {columns.map((column, colIndex) => (
                          <td key={`${colIndex}test-case-col`}>{testCase[column.key]}</td>
                        ))}
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  }
}

TestScenarioAndCase.propTypes = {
  workName: PropTypes.string.isRequired,
  graph: PropTypes.shape({
    graphNodes: PropTypes.arrayOf(PropTypes.object).isRequired,
    graphLinks: PropTypes.arrayOf(PropTypes.object).isRequired,
    constraints: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  testDatas: PropTypes.arrayOf(PropTypes.object).isRequired,
  workLoaded: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
  workName: state.work.name,
  graph: state.work.graph,
  testDatas: state.work.testDatas,
  workLoaded: state.work.loaded,
});

const mapDispatchToProps = { setGraph };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TestScenarioAndCase));
