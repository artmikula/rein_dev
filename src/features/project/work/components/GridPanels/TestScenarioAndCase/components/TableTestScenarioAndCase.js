import React, { useState } from 'react';
import Language from 'features/shared/languages/Language';
import { FormGroup, Input, Label, Table } from 'reactstrap';
import PropTypes from 'prop-types';
import testScenarioAnsCaseStorage from 'features/project/work/services/TestScenarioAnsCaseStorage';

function TableTestScenarioAndCase(props) {
  const { rows, columns, setRows, isCheckAllTestScenarios } = props;

  const [expandId, setExpandId] = useState(null);

  const _toggleRow = (e, id) => {
    e.preventDefault();
    setExpandId((state) => ({ expandId: { ...state.expandId, [id]: !state.expandId[id] } }));
  };

  const _handleCheckedAll = (checked) => {
    testScenarioAnsCaseStorage.checkAllTestScenarios(checked);
    const newRows = testScenarioAnsCaseStorage.checkAllTestScenarios(checked, rows);

    setRows(newRows);
  };

  const _handleTestScenarioChecked = (scenarioId, checked) => {
    testScenarioAnsCaseStorage.checkTestScenario(scenarioId, checked);
    const newRows = testScenarioAnsCaseStorage.checkTestScenario(scenarioId, checked, rows);

    setRows(newRows);
  };

  const _handleTestCaseChecked = (scenarioId, caseId, checked) => {
    testScenarioAnsCaseStorage.checkTestCase(scenarioId, caseId, checked);
    const newRows = testScenarioAnsCaseStorage.checkTestCase(scenarioId, caseId, checked, rows);

    setRows(newRows);
  };

  const _handleCheckboxChange = (scenarioId, key, checked) => {
    testScenarioAnsCaseStorage.changeTestScenario(scenarioId, key, checked);
    const newRows = testScenarioAnsCaseStorage.changeTestScenario(scenarioId, key, checked, rows);

    setRows(newRows);
  };

  return (
    <Table bordered className="scenario-case-table">
      <thead className="text-primary">
        <tr>
          <td className="position-relative">
            {rows.length > 0 && (
              <div className="position-absolute header-checkbox-container">
                <Input
                  type="checkbox"
                  className="mt-1"
                  onChange={(e) => _handleCheckedAll(e.target.checked)}
                  checked={isCheckAllTestScenarios}
                />
              </div>
            )}
            {Language.get('name')}
          </td>
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
              <tr key={`${tsIndex}test-scenario-row`} className={testScenario.isViolated ? 'isViolated' : ''}>
                <td rowSpan={expandId[testScenario.id] ? testScenario.testCases.length + 1 : 1} className="treeview">
                  <ul>
                    <li>
                      <ul className="d-inline-flex">
                        <a
                          style={{
                            paddingTop: '2px',
                            visibility: testScenario.testCases.length === 0 ? 'hidden' : 'visible',
                          }}
                          href="#collapse"
                          className="text-dark"
                          onClick={(e) => _toggleRow(e, testScenario.id)}
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
                              onChange={(e) => _handleTestScenarioChecked(testScenario.id, e.target.checked)}
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
                                      _handleTestCaseChecked(testScenario.id, testCase.id, e.target.checked)
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
                          onChange={(e) => _handleCheckboxChange(testScenario.id, column.key, e.target.checked)}
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
  );
}

TableTestScenarioAndCase.propTypes = {
  rows: PropTypes.oneOfType([PropTypes.array]).isRequired,
  columns: PropTypes.oneOfType([PropTypes.array]).isRequired,
  isCheckAllTestScenarios: PropTypes.bool.isRequired,
  setRows: PropTypes.func.isRequired,
};

export default TableTestScenarioAndCase;
