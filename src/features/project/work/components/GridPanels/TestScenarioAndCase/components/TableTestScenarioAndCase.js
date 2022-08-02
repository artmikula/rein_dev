/* eslint-disable max-lines */
import React, { useState, useEffect } from 'react';
import Language from 'features/shared/languages/Language';
import { FormGroup, Input, Label, Table } from 'reactstrap';
import PropTypes from 'prop-types';
import testScenarioAnsCaseStorage from 'features/project/work/services/TestScenarioAnsCaseStorage';

function TableTestScenarioAndCase(props) {
  const { rows, columns, setRows, isCheckAllTestScenarios } = props;

  const [expandId, setExpandId] = useState({});
  const [groupRows, setGroupRows] = useState([]);
  const [rowSpan, setRowSpan] = useState({});

  const _getGroupRows = React.useCallback(
    (rows) => {
      const groups = [];
      rows.forEach((row) => {
        const isExists = groups.findIndex((group) => group?.key === row.results);
        if (isExists === -1) {
          groups.push({
            key: row.results,
            isSelected: false,
            testScenarios: [{ ...row, testCases: row.testCases.slice() }],
          });
        } else {
          groups[isExists].testScenarios?.push({ ...row, testCases: row.testCases.slice() });
        }
        return groups;
      });
      groups.forEach((group) => {
        const isSelected = group.testScenarios.every((testScenario) => testScenario.isSelected);
        // eslint-disable-next-line no-param-reassign
        group.isSelected = isSelected;
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

  useEffect(() => {
    _getGroupRows(rows);
  }, [rows]);

  useEffect(() => {
    const rowSpanByGroup = {};
    groupRows.forEach((groupRow) => {
      if (expandId[groupRow?.key]) {
        groupRow?.testScenarios?.forEach((testScenario) => {
          if (expandId[testScenario.id]) {
            if (!Object.prototype.hasOwnProperty.call(rowSpanByGroup, groupRow?.key)) {
              rowSpanByGroup[groupRow?.key] = groupRow?.testScenarios?.length + testScenario.testCases.length + 1;
            } else {
              rowSpanByGroup[groupRow?.key] += testScenario.testCases.length;
            }
          }
          if (!expandId[testScenario.id]) {
            rowSpanByGroup[groupRow?.key] = groupRow?.testScenarios?.length + 1;
          }
        });
      } else {
        rowSpanByGroup[groupRow?.key] = 1;
      }
    });
    setRowSpan(rowSpanByGroup);
  }, [expandId]);

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
      groupRows[checkedIndex].testScenarios.forEach((testScenario) =>
        _handleTestScenarioChecked(testScenario.id, checked)
      );
    }
  };

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
        {groupRows.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            <tr key={`${rowIndex}-grouped-test-scenario`}>
              <td className="treeview" rowSpan={rowSpan[row?.key]}>
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
                      {expandId[row?.key] &&
                        row.testScenarios.map((testScenario) => (
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
              {columns.map((_column, colIndex) => (
                <td
                  key={`${colIndex}test-scenario-col`}
                  style={{
                    visibility: 'collapse',
                  }}
                >
                  <input type="checkbox" />
                </td>
              ))}
            </tr>
            {row.testScenarios.map(
              (testScenario) =>
                expandId[row?.key] && (
                  <tr key={`test-scenario-columns-${testScenario.id}`}>
                    {columns.map((column, colIndex) => (
                      <td key={`${colIndex}test-scenario-col`}>
                        <ul style={{ listStyleType: 'none', paddingLeft: 0, marginBottom: 0 }} className="align-middle">
                          <li className="d-flex">
                            {typeof testScenario[column.key] === 'boolean' ? (
                              <FormGroup check>
                                <Label check>
                                  <Input
                                    type="checkbox"
                                    className="mt-1"
                                    onChange={(e) =>
                                      _handleCheckboxChange(testScenario.id, column.key, e.target.checked)
                                    }
                                    checked={testScenario[column.key]}
                                  />
                                </Label>
                              </FormGroup>
                            ) : (
                              <Label>{testScenario[column.key]}</Label>
                            )}
                          </li>
                        </ul>
                        {expandId[testScenario.id] && (
                          <ul style={{ listStyleType: 'none', paddingLeft: 0, marginBottom: 0 }}>
                            {testScenario.testCases.map((testCase, testIndex) => (
                              <li key={`${testIndex}test-case-row`} style={{}}>
                                <Label>{testCase[column.key]}</Label>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    ))}
                  </tr>
                )
            )}
            {/* {row.testScenarios.map((testScenario) =>
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
            )} */}
          </React.Fragment>
        ))}
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
