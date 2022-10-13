/* eslint-disable max-lines */
import React, { Fragment, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import lf from 'lovefield';
import { useSelector } from 'react-redux';
import { Button } from 'reactstrap';

import Checkbox from './TableCheckbox';

function TableRow(props) {
  const { rows, onLoadMore, columns, onRowsChange, isFilter } = props;

  const [expandId, setExpandId] = useState({});
  const [rowSpan, setRowSpan] = useState({});

  const { dbContext, generating } = useSelector((state) => state.work);

  useEffect(() => {
    // handle get row span by group
    const rowSpanByGroup = {};
    rows.forEach((groupRow) => {
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
            if (!Object.prototype.hasOwnProperty.call(rowSpanByGroup, groupRow?.key)) {
              rowSpanByGroup[groupRow?.key] = groupRow?.testScenarios?.length + 1;
            }
          }
        });
      } else {
        rowSpanByGroup[groupRow?.key] = 1;
      }
    });
    setRowSpan(rowSpanByGroup);
  }, [expandId, rows]);

  useEffect(() => {
    setExpandId({});
  }, [isFilter, generating]);

  const _toggleRow = useCallback(
    (e, id) => {
      e.preventDefault();
      setExpandId((prevState) => ({ ...prevState, [id]: !prevState[id] }));
    },
    [expandId]
  );

  /**
   * @param {string} scenarioId - selected scenario
   * @param {boolean} checked - checkbox's value of selected scenario
   * @param {boolean} selfUpdate - a flag to prevent updating state
   */
  const _handleTestScenarioChecked = useCallback(
    async (rowKey, scenarioId, checked, selfUpdate = true) => {
      if (dbContext && dbContext.db) {
        const { testScenarioSet, testCaseSet } = dbContext;
        await testScenarioSet.update('isSelected', checked, testScenarioSet.table.id.eq(scenarioId));
        await testCaseSet.update('isSelected', checked, testCaseSet.table.testScenarioId.eq(scenarioId));
        if (selfUpdate) {
          const newRows = structuredClone(rows);
          const currentRowIndex = newRows.findIndex((row) => row.key === rowKey);
          if (currentRowIndex > -1) {
            const currentRow = newRows[currentRowIndex];
            const tsRow = currentRow.testScenarios.find((testScenario) => testScenario.id === scenarioId);
            if (tsRow) {
              tsRow.isSelected = checked;
              tsRow.testCases.forEach((testCaseRow) => {
                const _testCaseRow = testCaseRow;
                _testCaseRow.isSelected = checked;
              });
              currentRow.isSelected = currentRow.testScenarios.every(
                (testScenario) =>
                  testScenario.isSelected || testScenario.testCases.every((testCase) => testCase.isSelected)
              );
              onRowsChange(currentRowIndex, currentRow);
            }
          }
        }
      }
    },
    [rows]
  );

  /**
   * @param {string} scenarioId - selected scenario
   * @param {string} caseId - selected test case
   * @param {boolean} checked - checkbox's value of selected test case
   */
  const _handleTestCaseChecked = useCallback(
    async (rowKey, scenarioId, caseId, checked) => {
      if (dbContext && dbContext.db) {
        const { testScenarioSet, testCaseSet } = dbContext;
        const filter = lf.op.and(testCaseSet.table.testScenarioId.eq(scenarioId), testCaseSet.table.id.eq(caseId));
        await testCaseSet.update('isSelected', checked, filter);
        const testCases = await testCaseSet.get(testCaseSet.table.testScenarioId.eq(scenarioId));
        if (testCases.length > 0) {
          const isCheckedAll = testCases.every((testCase) => testCase.isSelected);
          await testScenarioSet.update('isSelected', isCheckedAll, testScenarioSet.table.id.eq(scenarioId));
        }
        const newRows = structuredClone(rows);
        const currentRowIndex = newRows.findIndex((row) => row.key === rowKey);
        if (currentRowIndex > -1) {
          const currentRow = newRows[currentRowIndex];
          const tsRow = currentRow.testScenarios.find((testScenario) => testScenario.id === scenarioId);
          if (tsRow) {
            const tcRow = tsRow.testCases.find((testCase) => testCase.id === caseId);
            if (tcRow) {
              tcRow.isSelected = checked;
            }
            tsRow.isSelected = tsRow.testCases.every((testCase) => testCase.isSelected);
          }
          currentRow.isSelected = currentRow.testScenarios.every((testScenario) => testScenario.isSelected);
          onRowsChange(currentRowIndex, currentRow);
        }
      }
    },
    [rows]
  );

  /**
   * @param {string} scenarioId - selected test scenario
   * @param {string} key - property in test scenario (isBaseScenario, isValid)
   * @param {boolean} checked - checkbox's value of isBaseScenario, isValid
   */
  const _handleCheckboxChange = useCallback(
    async (rowKey, scenarioId, key, checked) => {
      if (dbContext && dbContext.db) {
        // update to indexedDb
        const { testScenarioSet } = dbContext;
        testScenarioSet.update(key, checked, testScenarioSet.table.id.eq(scenarioId));
        // update to state
        const newRows = structuredClone(rows);
        const currentRowIndex = newRows.findIndex((row) => row.key === rowKey);
        if (currentRowIndex > -1) {
          const currentRow = newRows[currentRowIndex];
          const tsRow = currentRow.testScenarios.find((testScenario) => testScenario.id === scenarioId);
          if (tsRow) {
            tsRow[key] = checked;
          }
          onRowsChange(currentRowIndex, currentRow);
        }
      }
    },
    [rows]
  );

  /**
   * @param {string} groupKey - row key is selected effect node
   * @param {boolean} checked - checkbox's value of selected effect node
   */
  const _handleCheckedByGroup = useCallback(
    (rowKey, checked) => {
      const newRows = structuredClone(rows);
      const currentRowIndex = newRows.findIndex((row) => row.key === rowKey);
      if (currentRowIndex > -1) {
        const currentRow = newRows[currentRowIndex];
        currentRow.isSelected = checked;
        currentRow.testScenarios.forEach((testScenario) => {
          _handleTestScenarioChecked(rowKey, testScenario.id, checked, false);
          const _testScenario = testScenario;
          _testScenario.isSelected = checked;
          _testScenario.testCases.forEach((testCase) => {
            const _testCase = testCase;
            _testCase.isSelected = checked;
            return _testCase;
          });
          return _testScenario;
        });
        onRowsChange(currentRowIndex, currentRow);
      }
    },
    [rows]
  );

  if (rows.length > 0) {
    return (
      <tbody>
        {rows.map((row, rowIndex) => (
          <Fragment key={rowIndex}>
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
                      <Checkbox
                        checked={row?.isSelected ?? false}
                        onChange={(e) => _handleCheckedByGroup(row?.key ?? '', e.target.checked)}
                        labelRenderer={
                          <span className="font-weight-500" style={{ lineHeight: '21px' }}>
                            {row?.key}: {row?.definition}
                          </span>
                        }
                      />
                    </ul>
                    <ul>
                      {expandId[row?.key] &&
                        row.testScenarios.map((testScenario) => (
                          <li
                            key={`${row.key}-${testScenario.id}`}
                            className={testScenario.isViolated ? 'ommit-row' : ''}
                          >
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
                              <Checkbox
                                checked={testScenario.isSelected ?? false}
                                onChange={(e) =>
                                  _handleTestScenarioChecked(row?.key, testScenario.id, e.target.checked)
                                }
                                labelRenderer={
                                  <span className="font-weight-500" style={{ lineHeight: '21px' }}>
                                    {testScenario.Name}
                                  </span>
                                }
                              />
                            </ul>
                            <ul>
                              {expandId[testScenario.id] &&
                                testScenario.testCases.map((testCase, testCaseIndex) => (
                                  <Fragment key={`${testCaseIndex}test-case-tree`}>
                                    {testCaseIndex === testScenario.testCases.length - 1 &&
                                    testScenario.page < testScenario.totalPage - 1 ? (
                                      <li>
                                        <Button
                                          color="link"
                                          size="sm"
                                          style={{ fontSize: 13, margin: 0, padding: 0 }}
                                          onClick={() => onLoadMore(row?.key, testScenario.id)}
                                        >
                                          <i className="bi bi-plus-square-dotted" />
                                          <span style={{ marginLeft: 8 }}>Load more</span>
                                        </Button>
                                      </li>
                                    ) : (
                                      <li>
                                        <Checkbox
                                          checked={testCase.isSelected ?? false}
                                          onChange={(e) =>
                                            _handleTestCaseChecked(
                                              row?.key,
                                              testScenario.id,
                                              testCase.id,
                                              e.target.checked
                                            )
                                          }
                                          labelRenderer={testCase.Name}
                                        />
                                      </li>
                                    )}
                                    {/* {testCaseIndex === testScenario.testCases.length - 1 &&
                                      testScenario.page < testScenario.totalPage - 1 && (
                                        <li>
                                          <Button
                                            color="link"
                                            size="sm"
                                            style={{ fontSize: 13, margin: 0, padding: 0 }}
                                            onClick={() => onLoadMore(row?.key, testScenario.id)}
                                          >
                                            <i className="bi bi-plus-square-dotted" />
                                            <span style={{ marginLeft: 8 }}>Load more</span>
                                          </Button>
                                        </li>
                                      )} */}
                                  </Fragment>
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
                  <div style={{ height: 18 }} />
                </td>
              ))}
            </tr>
            {row.testScenarios.map(
              (testScenario) =>
                expandId[row?.key] && (
                  <Fragment key={`test-scenario-columns-${testScenario.id}`}>
                    <tr className={testScenario.isViolated ? 'isViolated' : ''}>
                      {columns.map((column, colIndex) => (
                        <td key={`${colIndex}test-scenario-col`}>
                          {typeof testScenario[column.key] === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={testScenario[column.key]}
                              onChange={(e) =>
                                _handleCheckboxChange(row?.key, testScenario.id, column.key, e.target.checked)
                              }
                            />
                          ) : (
                            testScenario[column.key]
                          )}
                        </td>
                      ))}
                    </tr>
                    {expandId[testScenario.id] &&
                      testScenario.testCases.map((testCase, tcIndex) => (
                        <tr
                          key={`${tcIndex}test-case-row`}
                          style={
                            tcIndex === testScenario.testCases.length - 1 &&
                            testScenario.page < testScenario.totalPage - 1
                              ? { height: 20 }
                              : {}
                          }
                        >
                          {tcIndex === testScenario.testCases.length - 1 &&
                          testScenario.page < testScenario.totalPage - 1 ? (
                            <td colSpan={columns.length} style={{ height: 32 }} />
                          ) : (
                            columns.map((column, colIndex) => (
                              <td key={`${colIndex}test-case-col`} style={{ padding: '3px 8px' }}>
                                {testCase[column.key]}
                              </td>
                            ))
                          )}
                        </tr>
                      ))}
                  </Fragment>
                )
            )}
          </Fragment>
        ))}
      </tbody>
    );
  }
  return null;
}

TableRow.propTypes = {
  rows: PropTypes.oneOfType([PropTypes.array]).isRequired,
  columns: PropTypes.oneOfType([PropTypes.array]).isRequired,
  onLoadMore: PropTypes.func.isRequired,
  onRowsChange: PropTypes.func.isRequired,
  isFilter: PropTypes.string.isRequired,
};

export default TableRow;
