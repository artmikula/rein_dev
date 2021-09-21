/* eslint-disable max-lines */
import Download from 'downloadjs';
import testCaseHelper from 'features/project/work/biz/TestCase';
import DNFLogicCoverage from 'features/project/work/biz/TestScenario/TestScenarioMethodGenerate/DNFLogicCoverage';
import MyersTechnique from 'features/project/work/biz/TestScenario/TestScenarioMethodGenerate/MyersTechnique';
import constraintService from 'features/project/work/services/constraintService';
import graphLinkService from 'features/project/work/services/graphLinkService';
import graphNodeService from 'features/project/work/services/graphNodeService';
import testCaseService from 'features/project/work/services/testCaseService';
import testDataService from 'features/project/work/services/testDataService';
import testScenarioService from 'features/project/work/services/testScenarioService';
import { FILE_NAME, TEST_CASE_METHOD, TEST_CASE_SHORTCUT, TEST_CASE_SHORTCUT_CODE } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import eventBus from 'features/shared/lib/eventBus';
import { arrayToCsv } from 'features/shared/lib/utils';
import Enumerable from 'linq';
import debounce from 'lodash.debounce';
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
  _setTestScenarioAndCase = debounce(async (domainAction, isRefreshPage = false) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const graphNodeResult = await graphNodeService.getListAsync(projectId, workId);
    const graphLinkResult = await graphLinkService.getListAsync(projectId, workId);
    const constraintResult = await constraintService.getListAsync(projectId, workId);
    const testDataResult = await testDataService.listAsync(projectId, workId);
    if (graphNodeResult) {
      if (isRefreshPage) {
        const testScenarioResult = await testScenarioService.getListAsync(projectId, workId);
        this._setColumns(graphNodeResult.data);
        if (testScenarioResult.data) {
          const testCases = [];
          testScenarioResult.data.forEach((testScenario) => {
            testScenario.testCases.forEach((testCase) => {
              const testDatas = JSON.parse(testCase.testDatas).map((x) => {
                const result = {
                  graphNodeId: x.GraphNodeId,
                  data: x.Data,
                };
                return result;
              });

              testCases.push({
                ...testCase,
                testScenario: { ...testScenario },
                testDatas,
                results: JSON.parse(testCase.results),
              });
            });
          });

          this._setRows(testCases, testScenarioResult.data);
        }
      } else {
        let scenarioAndGraphNodes = null;
        if (appConfig.general.testCaseMethod === TEST_CASE_METHOD.MUMCUT) {
          scenarioAndGraphNodes = DNFLogicCoverage.buildTestScenario(
            graphLinkResult.data,
            constraintResult.data,
            graphNodeResult.data
          );
        } else {
          scenarioAndGraphNodes = MyersTechnique.buildTestScenario(
            graphLinkResult.data,
            constraintResult.data,
            graphNodeResult.data
          );
        }

        const testCases = testCaseHelper.updateTestCase(
          scenarioAndGraphNodes.scenarios,
          testDataResult.data,
          graphNodeResult.data
        );

        this._setColumns(graphNodeResult.data);
        this._setRows(testCases, scenarioAndGraphNodes.scenarios);

        const data = scenarioAndGraphNodes.scenarios.map((x) => {
          const scenario = {
            ...x,
            testAssertions: x.testAssertions.map((y) => {
              const assertion = {
                result: y.result,
                graphNodeId: y.graphNode.id,
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
        await testScenarioService.createBatchAsync(projectId, workId, data);
        this._raiseEvent({
          action: domainAction,
          value: { ...scenarioAndGraphNodes },
          receivers: [domainEvents.DES.GRAPH, domainEvents.DES.SSMETRIC],
        });
      }
    }
  }, 300);

  constructor(props) {
    super(props);
    this.state = {
      selectedOption: null,
      columns: [],
      rows: [],
      expandId: {},
    };
  }

  async componentDidMount() {
    await this._setTestScenarioAndCase(domainEvents.ACTION.UPDATE, true);
    eventBus.subscribe(this, domainEvents.GRAPH_ONCHANGE_DOMAINEVENT, async (event) => {
      if (event.message.action === domainEvents.ACTION.GENERATE) {
        await this._setTestScenarioAndCase(domainEvents.ACTION.ACCEPTGENERATE);
      }
    });

    eventBus.subscribe(this, domainEvents.TEST_CASE_MENU_DOMAINEVENT, (event) => {
      const { code } = event.message;
      this._handleShortCutEvents(code);
    });
    eventBus.subscribe(this, domainEvents.WORK_MENU_DOMAINEVENT, (event) => {
      this._handleWorkMenuEvents(event);
    });
    eventBus.subscribe(this, domainEvents.WORK_DATA_COLLECTION, (event) => {
      this._handleDataCollectionRequest(event.message);
    });
    TEST_CASE_SHORTCUT.forEach(({ code, shortcutKeys }) => {
      Mousetrap.bind(shortcutKeys.join('+'), (e) => {
        e.preventDefault();
        this._handleShortCutEvents(code);
      });
    });

    eventBus.subscribe(this, domainEvents.TEST_DATA_DOMAINEVENT, async (event) => {
      if (event.message.action === domainEvents.ACTION.UPDATE) {
        await this._setTestScenarioAndCase(domainEvents.ACTION.UPDATE);
      }
    });
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
  }

  handleChange = (selectedOption) => {
    this.setState({ selectedOption });
  };

  _getScenarioData = async () => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const graphNodeResult = await graphNodeService.getListAsync(projectId, workId);
    const graphLinkResult = await graphLinkService.getListAsync(projectId, workId);
    const constraintResult = await constraintService.getListAsync(projectId, workId);
    const testDataResult = await testDataService.listAsync(projectId, workId);

    if (graphNodeResult.data && graphLinkResult.data && constraintResult.data && testDataResult.data) {
      let scenarioAndGraphNodes = null;
      if (appConfig.general.testCaseMethod === TEST_CASE_METHOD.MUMCUT) {
        scenarioAndGraphNodes = DNFLogicCoverage.buildTestScenario(
          graphLinkResult.data,
          constraintResult.data,
          graphNodeResult.data
        );
      } else {
        scenarioAndGraphNodes = MyersTechnique.buildTestScenario(
          graphLinkResult.data,
          constraintResult.data,
          graphNodeResult.data
        );
      }

      const testCases = testCaseHelper.updateTestCase(
        scenarioAndGraphNodes.scenarios,
        testDataResult.data,
        graphNodeResult.data
      );

      return this._convertScenariosToSavedData(scenarioAndGraphNodes.scenarios, testCases);
    }

    return null;
  };

  _convertScenariosToSavedData = (scenarios, testCases) => {
    const data = scenarios.map((x) => {
      const scenario = {
        ...x,
        testAssertions: x.testAssertions.map((y) => {
          const assertion = {
            result: y.result,
            graphNodeId: y.graphNode.id,
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

    return data;
  };

  _handleDataCollectionRequest = async () => {
    const data = await this._getScenarioData();
    this._raiseEvent({ action: domainEvents.ACTION.COLLECT_RESPONSE, value: data });
  };

  _raiseEvent = (message) => {
    eventBus.publish(domainEvents.TEST_SCENARIO_DOMAINEVENT, message);
  };

  _toggleRow = (e, id) => {
    e.preventDefault();
    this.setState((state) => ({ expandId: { ...state.expandId, [id]: !state.expandId[id] } }));
  };

  _onCheckboxChange = async (e, id, key) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { rows } = this.state;
    const testScenario = rows.find((x) => x.id === id);
    testScenario[key] = e.target.checked;

    const data = {
      id: testScenario.id,
      isValid: testScenario.V,
      isBaseScenario: testScenario.B,
    };

    await testScenarioService.updateAsync(projectId, workId, data);
  };

  _onTestCaseChecked = async (e, id, testScenarioId) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { rows } = this.state;

    const testScenario = rows.find((x) => x.id === testScenarioId);

    const testCase = testScenario.testCases.find((x) => x.id === id);
    testCase.isChecked = e.target.checked;

    testScenario.isChecked = !testScenario.testCases.some((x) => !x.isChecked);

    const data = [
      {
        id,
        isChecked: e.target.checked,
      },
    ];

    this.setState({ rows: [...rows] });

    await testCaseService.updateBatchAsync(projectId, workId, data);
  };

  _onTestScenarioChecked = async (e, id) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { rows } = this.state;

    const testScenario = rows.find((x) => x.id === id);
    testScenario.isChecked = e.target.checked;
    for (let i = 0; i < testScenario.testCases.length; i++) {
      testScenario.testCases[i].isChecked = e.target.checked;
    }

    this.setState({ rows: [...rows] });

    await testCaseService.updateBatchAsync(projectId, workId, testScenario.testCases);
  };

  _setRows(testCases = [], scenarios = []) {
    if (!testCases || !scenarios) {
      return;
    }

    const { columns } = this.state;
    const rows = scenarios.map((scenario) => ({
      ...scenario,
      testCases: testCases.filter((e) => e.testScenarioId === scenario.id),
      isChecked: !testCases.filter((e) => e.testScenarioId === scenario.id).some((x) => !x.isChecked),
    }));
    const testScenarios = rows.map((testScenario, testScenarioIndex) => {
      const testScenarioItem = {};
      testScenarioItem.Name = `TS#${testScenarioIndex + 1}(${testScenario.scenarioType})`;
      testScenarioItem.isChecked = !!testScenario.isChecked;
      testScenarioItem.id = testScenario.id;
      columns.forEach((column) => {
        if (column.key === 'results') {
          testScenarioItem[column.headerName] = testScenario.expectedResults;
        } else if (column.key === 'isValid' || column.key === 'isBaseScenario') {
          testScenarioItem[column.headerName] = !!testScenario[column.key];
        } else {
          const testAssertion = testScenario.testAssertions.find((x) => x.graphNode.id === column.graphNodeId);
          if (testAssertion) {
            testScenarioItem[column.headerName] = testAssertion.result ? 'T' : 'F';
          } else {
            testScenarioItem[column.headerName] = '';
          }
        }
      });
      testScenarioItem.testCases = testScenario.testCases.map((testCase, testCaseIndex) => {
        const testCaseItem = {};
        testCaseItem.Name = `TC#${testScenarioIndex + 1}-${testCaseIndex + 1}`;
        testCaseItem.isChecked = !!testCase.isChecked;
        testCaseItem.id = testCase.id;
        columns.forEach((column) => {
          if (column.key === 'results') {
            testCaseItem[column.headerName] = testCase[column.key].join(', ');
          } else if (column.key === 'isValid' || column.key === 'isBaseScenario') {
            testCaseItem[column.headerName] = '';
          } else {
            const testData = testCase.testDatas.find((x) => x.graphNodeId === column.graphNodeId);
            testCaseItem[column.headerName] = testData ? testData.data : '';
          }
        });
        return testCaseItem;
      });
      return testScenarioItem;
    });
    this.setState({ rows: testScenarios });
  }

  _setColumns(graphNodes) {
    const columns = [
      {
        headerName: 'V',
        key: 'isValid',
      },
      {
        headerName: 'B',
        key: 'isBaseScenario',
      },
    ];

    const orderdGraphNodes = Enumerable.from(graphNodes)
      .orderBy((x) => x.nodeId)
      .toArray();

    const graphNodeHeaders = orderdGraphNodes.map((x) => {
      return {
        headerName: x.nodeId,
        graphNodeId: x.id,
      };
    });
    columns.push({ headerName: Language.get('expectedresults'), key: 'results' });
    columns.push(...graphNodeHeaders);
    this.setState({
      columns,
    });
  }

  _onCheckboxChange = async (e, id, key) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { rows } = this.state;
    const testScenario = rows.find((x) => x.id === id);
    testScenario[key] = e.target.checked;

    const data = {
      id: testScenario.id,
      isValid: testScenario.isValid,
      isBaseScenario: testScenario.isBaseScenario,
    };

    await testScenarioService.updateAsync(projectId, workId, data);
  };

  _createExportRowData(item, columns) {
    const row = { Name: item.Name, Checked: item.isChecked };
    columns.forEach((col) => {
      row[col.headerName] = item[col.headerName];
    });
    return row;
  }

  async _exportData() {
    const { match, work } = this.props;
    const { projectId, workId } = match.params;
    const { columns, rows } = this.state;

    const graphNodeResult = await graphNodeService.getListAsync(projectId, workId);

    const dataToConvert = [];
    rows.forEach((testScenario) => {
      dataToConvert.push(this._createExportRowData(testScenario, columns));
      testScenario.testCases.forEach((testCase) => {
        dataToConvert.push(this._createExportRowData(testCase, columns));
      });
    });
    const csvFile = arrayToCsv(dataToConvert, graphNodeResult.data, EXPORT_TYPE_NAME.TestCase);
    Download(csvFile, FILE_NAME.EXPORT_TEST_CASE.replace('workname', work.name), 'text/csv;charset=utf-8');
  }

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
                <td key={colIndex}>{column.headerName}</td>
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
                                  onChange={(e) => this._onTestScenarioChecked(e, testScenario.id)}
                                  checked={testScenario.isChecked}
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
                                        onChange={(e) => this._onTestCaseChecked(e, testCase.id, testScenario.id)}
                                        checked={testCase.isChecked}
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
                        {typeof testScenario[column.headerName] === 'boolean' ? (
                          <span className="d-flex">
                            <input
                              type="checkbox"
                              onChange={(e) => this._onCheckboxChange(e, testScenario.id, column.headerName)}
                              defaultChecked={testScenario[column.headerName]}
                            />
                          </span>
                        ) : (
                          testScenario[column.headerName]
                        )}
                      </td>
                    ))}
                  </tr>
                  {expandId[testScenario.id] &&
                    testScenario.testCases.map((testCase, tcIndex) => (
                      <tr key={`${tcIndex}test-case-row`}>
                        {columns.map((column, colIndex) => (
                          <td key={`${colIndex}test-case-col`}>{testCase[column.headerName]}</td>
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
  match: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.bool])).isRequired,
  work: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
};
const mapStateToProps = (state) => ({
  work: state.work,
});
export default connect(mapStateToProps)(withRouter(TestScenarioAndCase));
