import React, { useState } from 'react';
import Language from 'features/shared/languages/Language';
import { FormGroup, Input, Label, Table } from 'reactstrap';
import PropTypes from 'prop-types';
import testScenarioAnsCaseStorage from 'features/project/work/services/TestScenarioAnsCaseStorage';

function TableTestScenarioAndCase(props) {
  const { rows, columns, setRows, isCheckAllTestScenarios } = props;

  const [expandId, setExpandId] = useState({});
  const [groupRows, setGroupRows] = useState([]);

  const _getGroupRows = React.useCallback(
    (rows) => {
      const groups = [];
      rows.forEach((row) => {
        const isExists = groups.findIndex((group) => group?.key === row.results);
        if (isExists === -1) {
          groups.push({
            key: row.results,
            isSelected: false,
            values: [{ ...row, testCases: row.testCases.slice() }],
          });
        } else {
          groups[isExists].values?.push({ ...row, testCases: row.testCases.slice() });
        }
        return groups;
      });
      groups.sort((a, b) => {
        if (a.key < b.key) {
          return -1;
        }
        if (a.key > b.key) {
          return 1;
        }
        return 0;
      });
      setGroupRows(groups);
    },
    [rows]
  );

  React.useEffect(() => {
    _getGroupRows(rows);
  }, [rows]);

  const _toggleRow = (e, id) => {
    e.preventDefault();
    setExpandId((prevState) => ({ ...prevState, [id]: !prevState[id] }));
  };

  const _handleCheckedAll = (checked) => {
    testScenarioAnsCaseStorage.checkAllTestScenarios(checked);
    const newRows = testScenarioAnsCaseStorage.checkAllTestScenarios(checked, rows);
    _getGroupRows(newRows);

    setRows(newRows);
  };

  const _handleTestScenarioChecked = (scenarioId, checked) => {
    testScenarioAnsCaseStorage.checkTestScenario(scenarioId, checked);
    const newRows = testScenarioAnsCaseStorage.checkTestScenario(scenarioId, checked, rows);
    _getGroupRows(newRows);

    setRows(newRows);
  };

  const _handleTestCaseChecked = (scenarioId, caseId, checked) => {
    testScenarioAnsCaseStorage.checkTestCase(scenarioId, caseId, checked);
    const newRows = testScenarioAnsCaseStorage.checkTestCase(scenarioId, caseId, checked, rows);
    _getGroupRows(newRows);

    setRows(newRows);
  };

  const _handleCheckboxChange = (scenarioId, key, checked) => {
    testScenarioAnsCaseStorage.changeTestScenario(scenarioId, key, checked);
    const newRows = testScenarioAnsCaseStorage.changeTestScenario(scenarioId, key, checked, rows);
    _getGroupRows(newRows);

    setRows(newRows);
  };

  const _handleCheckedByGroup = (groupKey, checked) => {
    const checkedIndex = groupRows.findIndex((groupRow) => groupRow.key === groupKey);
    if (checkedIndex > -1) {
      groupRows[checkedIndex].isSelected = checked;
      groupRows[checkedIndex].values.forEach((testScenario) => _handleTestScenarioChecked(testScenario.id, checked));
    }
  };
  console.log('expandId', expandId);

  return (
    <Table bordered className="scenario-case-table">
      <thead className="text-primary">
        <tr>
          <td style={{ minWidth: '170px' }}>
            <FormGroup check className="d-inline-flex align-items-center">
              {rows.length > 0 && (
                <Label check>
                  <Input
                    type="checkbox"
                    style={{ left: -4, top: 0 }}
                    onChange={(e) => _handleCheckedAll(e.target.checked)}
                    checked={isCheckAllTestScenarios}
                  />
                </Label>
              )}
              <span className="font-weight-500" style={{ lineHeight: '21px' }}>
                {Language.get('name')}
              </span>
            </FormGroup>
          </td>
          {columns.map((column, colIndex) => (
            <td key={colIndex} title={column.title} style={{ cursor: column.title ? 'pointer' : 'default' }}>
              {column.headerName}
            </td>
          ))}
        </tr>
      </thead>
      <tbody>
        {groupRows.map((row, rowIndex) => {
          return (
            <React.Fragment key={rowIndex}>
              <tr key={`${rowIndex}-grouped-test-scenario`}>
                <td className="treeview" rowSpan={expandId[row?.key] ? row.values.length : 1}>
                  <ul>
                    <li>
                      <ul className="d-inline-flex">
                        <a
                          style={{ paddingTop: '2px' }}
                          href="#collapse"
                          className="text-dark"
                          onClick={(e) => _toggleRow(e, row?.key)}
                        >
                          <i
                            className={`mr-1 cursor-pointer ${
                              expandId[row?.key] ? 'bi bi-dash-square-fill' : 'bi bi-plus-square-fill'
                            }`}
                          />
                        </a>
                        <FormGroup check>
                          <Label check>
                            <Input
                              type="checkbox"
                              className="mt-1"
                              onChange={(e) => _handleCheckedByGroup(row?.key ?? '', e.target.checked)}
                              checked={row?.isSelected ?? false}
                            />
                            <span className="font-weight-500" style={{ lineHeight: '21px' }}>
                              {row?.key}
                            </span>
                          </Label>
                        </FormGroup>
                      </ul>
                      <ul>
                        {expandId[row.key] &&
                          row.values.map((testScenario) => (
                            <li key={`${row.key}-${testScenario.id}`}>
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
                                    <li key={`${testIndex}test-case-tree`}>
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
                          ))}
                      </ul>
                    </li>
                  </ul>
                </td>
                {expandId[row?.key] &&
                  row.values.map((testScenario) =>
                    columns.map((column, colIndex) => (
                      <td
                        key={`${colIndex}test-scenario-col`}
                        style={{
                          visibility:
                            (expandId[row?.key] && !expandId[testScenario.id]) || !expandId[row?.key]
                              ? 'visible'
                              : 'collapse',
                        }}
                        rowSpan={expandId[testScenario.id] ? testScenario.testCases.length + 2 : 1}
                      >
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
                    ))
                  )}
              </tr>
              {row.values.map(
                (testScenario) =>
                  expandId[row.key] &&
                  expandId[testScenario.id] && (
                    <tr key={`test-scenario-columns-${testScenario.id}`}>
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
                  )
              )}
              {row.values.map(
                (testScenario) =>
                  expandId[row.key] &&
                  expandId[testScenario.id] &&
                  testScenario.testCases.map((testCase, tcIndex) => (
                    <tr
                      key={`${tcIndex}test-case-row`}
                      style={{
                        visibility: expandId[row.key] && expandId[testScenario.id] ? 'visible' : 'collapse',
                      }}
                    >
                      {columns.map((column, colIndex) => (
                        <td key={`${colIndex}test-case-col`}>{testCase[column.key]}</td>
                      ))}
                    </tr>
                  ))
              )}
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
