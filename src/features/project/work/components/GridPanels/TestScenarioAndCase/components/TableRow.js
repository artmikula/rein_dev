/* eslint-disable max-lines */
import React, { Fragment, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import lf from 'lovefield';
import { useSelector } from 'react-redux';
import { Button } from 'reactstrap';

import { sortByString } from 'features/shared/lib/utils';
import Checkbox from './TableCheckbox';

function TableRow(props) {
  const { rows, filterRows, columns, isCheckAll } = props;

  const [expandId, setExpandId] = useState({});
  const [rowSpan, setRowSpan] = useState({});
  const [testScenarioAndCase, setTestScenarioAndCase] = useState([]);

  const { dbContext } = useSelector((state) => state.work);

  const _getGroupByEffectNodes = useCallback(
    (testScenarioAndCase) => {
      const groups = [];
      if (testScenarioAndCase.length > 0) {
        testScenarioAndCase.forEach((row) => {
          const isExists = groups.findIndex((group) => group?.key === row.results);
          if (isExists === -1) {
            groups.push({
              key: row.results,
              definition: row.effectDefinition,
              isSelected: false,
              testScenarios: [{ ...row, testCases: structuredClone(row.testCases) }],
            });
          } else {
            groups[isExists].testScenarios?.push({ ...row, testCases: row.testCases.slice() });
          }
          return groups;
        });
        groups.forEach((group) => {
          const _group = group;
          const isSelected = _group.testScenarios.every((testScenario) => testScenario.isSelected);
          _group.isSelected = isSelected;
        });
      }
      sortByString(groups, 'key');
      setTestScenarioAndCase(groups);
    },
    [rows, filterRows]
  );

  useEffect(() => {
    console.log('testScenarioAndCase', testScenarioAndCase);
  }, [testScenarioAndCase]);

  useEffect(() => {
    // handle get row span by group
    const rowSpanByGroup = {};
    testScenarioAndCase.forEach((groupRow) => {
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
  }, [expandId, testScenarioAndCase]);

  useEffect(() => {
    setExpandId({});
  }, [filterRows]);

  useEffect(() => {
    if (typeof filterRows !== 'undefined' && filterRows.length > 0) {
      _getGroupByEffectNodes(filterRows);
    } else {
      _getGroupByEffectNodes(rows);
    }
  }, [rows, filterRows]);

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
    async (scenarioId, checked, selfUpdate = true) => {
      if (dbContext && dbContext.db) {
        const { testScenarioSet, testCaseSet } = dbContext;
        await testScenarioSet.update('isSelected', checked, testScenarioSet.table.id.eq(scenarioId));
        await testCaseSet.update('isSelected', checked, testCaseSet.table.testScenarioId.eq(scenarioId));
        if (selfUpdate) {
          const newRows = rows.slice();
          const tsRow = newRows.find((row) => row.id === scenarioId);
          if (tsRow) {
            tsRow.isSelected = checked;
            tsRow.testCases.forEach((testCaseRow) => {
              const _testCaseRow = testCaseRow;
              _testCaseRow.isSelected = checked;
              return _testCaseRow;
            });
            _getGroupByEffectNodes(newRows);
            isCheckAll(newRows);
          }
        }
      }
    },
    [rows, filterRows]
  );

  /**
   * @param {string} scenarioId - selected scenario
   * @param {string} caseId - selected test case
   * @param {boolean} checked - checkbox's value of selected test case
   */
  const _handleTestCaseChecked = useCallback(
    async (scenarioId, caseId, checked) => {
      if (dbContext && dbContext.db) {
        const { testScenarioSet, testCaseSet } = dbContext;
        const filter = lf.op.and(testCaseSet.table.testScenarioId.eq(scenarioId), testCaseSet.table.id.eq(caseId));
        await testCaseSet.update('isSelected', checked, filter);
        const testCases = await testCaseSet.get(testCaseSet.table.testScenarioId.eq(scenarioId));
        if (testCases.length > 0) {
          const isCheckedAll = testCases.every((testCase) => testCase.isSelected);
          await testScenarioSet.update('isSelected', isCheckedAll, testScenarioSet.table.id.eq(scenarioId));
        }
        const testScenarios = await testScenarioSet.get(testScenarioSet.table.id.eq(scenarioId));
        const newRows = rows.slice();
        const tsRow = newRows.find((row) => row.id === scenarioId);
        if (tsRow) {
          tsRow.isSelected = testScenarios[0].isSelected;
          const tcRow = tsRow?.testCases.find((testCaseRow) => testCaseRow.id === caseId);
          tcRow.isSelected = checked;
          _getGroupByEffectNodes(newRows);
          isCheckAll(newRows);
        }
      }
    },
    [rows, filterRows]
  );

  /**
   * @param {string} scenarioId - selected test scenario
   * @param {string} key - property in test scenario (isBaseScenario, isValid)
   * @param {boolean} checked - checkbox's value of isBaseScenario, isValid
   */
  const _handleCheckboxChange = useCallback(
    async (scenarioId, key, checked) => {
      if (dbContext && dbContext.db) {
        const { testScenarioSet } = dbContext;
        testScenarioSet.update(key, checked, testScenarioSet.table.id.eq(scenarioId));
        const newRows = rows.slice();
        const tsRow = newRows.find((row) => row.id === scenarioId);
        if (tsRow) {
          tsRow[key] = checked;
          _getGroupByEffectNodes(filterRows ?? newRows);
        }
      }
    },
    [rows, filterRows]
  );

  /**
   * @param {string} groupKey - row key is selected effect node
   * @param {boolean} checked - checkbox's value of selected effect node
   */
  const _handleCheckedByGroup = useCallback(
    (groupKey, checked) => {
      const checkedIndex = testScenarioAndCase.findIndex((groupRow) => groupRow.key === groupKey);
      if (checkedIndex > -1) {
        testScenarioAndCase[checkedIndex].testScenarios.forEach((testScenario) => {
          const newRows = rows.slice();
          const tsRow = newRows.find((row) => row.id === testScenario.id);
          if (tsRow) {
            tsRow.isSelected = checked;
            tsRow.testCases.forEach((tcRow) => {
              const _tcRow = tcRow;
              _tcRow.isSelected = checked;
              return _tcRow;
            });
            _getGroupByEffectNodes(filterRows ?? newRows);
            isCheckAll(filterRows ?? newRows);
          }
          _handleTestScenarioChecked(testScenario.id, checked, false);
        });
      }
    },
    [testScenarioAndCase]
  );

  if (testScenarioAndCase.length > 0) {
    return (
      <tbody>
        {testScenarioAndCase.map((row, rowIndex) => (
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
                                onChange={(e) => _handleTestScenarioChecked(testScenario.id, e.target.checked)}
                                labelRenderer={
                                  <span className="font-weight-500" style={{ lineHeight: '21px' }}>
                                    {testScenario.Name}
                                  </span>
                                }
                              />
                            </ul>
                            <ul>
                              {expandId[testScenario.id] &&
                                testScenario.testCases.map((testCase, testIndex) => (
                                  <li key={`${testIndex}test-case-tree`}>
                                    {testIndex < testScenario.testCases.length - 1 ? (
                                      <Checkbox
                                        checked={testCase.isSelected ?? false}
                                        onChange={(e) =>
                                          _handleTestCaseChecked(testScenario.id, testCase.id, e.target.checked)
                                        }
                                        labelRenderer={testCase.Name}
                                      />
                                    ) : (
                                      <div style={{ height: 20 }} />
                                    )}
                                    {/* <Checkbox
                                      checked={testCase.isSelected ?? false}
                                      onChange={(e) =>
                                        _handleTestCaseChecked(testScenario.id, testCase.id, e.target.checked)
                                      }
                                      labelRenderer={testCase.Name}
                                    /> */}
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
                              onChange={(e) => _handleCheckboxChange(testScenario.id, column.key, e.target.checked)}
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
                          style={tcIndex === testScenario.testCases - 1 ? { height: 30 } : {}}
                        >
                          {columns.map((column, colIndex) => (
                            <td key={`${colIndex}test-case-col`} style={{ padding: '3px 8px' }}>
                              {testCase[column.key]}
                            </td>
                          ))}
                          {tcIndex === testScenario.testCases - 1 && (
                            <td>
                              <Button size="sm" style={{ width: '300px', height: '50px' }}>
                                Load more
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    {/* {expandId[testScenario.id] && testScenario.page < testScenario.totalPage && (
                      // <tr>
                      <Button size="sm" style={{ width: '300px' }}>
                        Load more
                      </Button>
                      // </tr>
                    )} */}
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
  filterRows: PropTypes.oneOfType([PropTypes.array]),
  isCheckAll: PropTypes.func.isRequired,
};

TableRow.defaultProps = { filterRows: undefined };

export default TableRow;
