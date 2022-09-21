/* eslint-disable max-lines */
import React, { Fragment, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import lf from 'lovefield';
import { useSelector } from 'react-redux';
import { Button } from 'reactstrap';

import appConfig from 'features/shared/lib/appConfig';
import { sortByString } from 'features/shared/lib/utils';
import Checkbox from './TableCheckbox';
import RowItem from './RowItem';

function TableRow(props) {
  const { rows, filterRows, columns, isCheckAll } = props;

  const [expandId, setExpandId] = useState({});
  const [rowSpan, setRowSpan] = useState({});
  const [testScenarioAndCase, setTestScenarioAndCase] = useState([]);

  const { dbContext } = useSelector((state) => state.work);

  const { testCasePageSize } = appConfig.testScenarioAndCase;

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
    async (rowKey, scenarioId, checked) => {
      if (dbContext && dbContext.db) {
        const { testCaseSet } = dbContext;
        // await testScenarioSet.update('isSelected', checked, testScenarioSet.table.id.eq(scenarioId));
        // await testCaseSet.update('isSelected', checked, testCaseSet.table.testScenarioId.eq(scenarioId));

        const clone = structuredClone(testScenarioAndCase);
        const newRows = clone.find((row) => row.key === rowKey);
        if (newRows) {
          const testScenarioRow = newRows.testScenarios.find((testScenario) => testScenario.id === scenarioId);
          if (testScenarioRow) {
            testScenarioRow.isSelected = checked;
            testScenarioRow.testCases.forEach((testCase) => {
              const _testCase = testCase;
              _testCase.isSelected = checked;
            });
            const promises = testScenarioRow.testCases.map(async (testCase) => {
              return testCaseSet.update(
                'isSelected',
                checked,
                lf.op.and(testCaseSet.table.testScenarioId.eq(scenarioId), testCaseSet.table.id.eq(testCase.id))
              );
            });
            await Promise.all(promises);
            isCheckAll(newRows.testScenarios);
          }
        }
        setTestScenarioAndCase(clone);
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
    async (rowKey, scenarioId, caseId, checked) => {
      if (dbContext && dbContext.db) {
        const { testCaseSet } = dbContext;

        // update state
        const clone = structuredClone(testScenarioAndCase);
        const newRows = clone.find((row) => row.key === rowKey);
        if (newRows) {
          const testScenarioRow = newRows.testScenarios.find((testScenario) => testScenario.id === scenarioId);
          if (testScenarioRow) {
            const testCaseRow = testScenarioRow.testCases.find((testCase) => testCase.id === caseId);
            console.log('testcaserow', testCaseRow);
            if (testCaseRow) {
              testCaseRow.isSelected = checked;
            }
            const allTestScenarioChecked = testScenarioRow.testCases.every((testCase) => testCase.isSelected);
            testScenarioRow.isSelected = allTestScenarioChecked;
            isCheckAll(newRows.testScenarios);

            // update to indexedDb
            const filter = lf.op.and(testCaseSet.table.testScenarioId.eq(scenarioId), testCaseSet.table.id.eq(caseId));
            await testCaseSet.update('isSelected', checked, filter);

            // TODO: move check isCheckedAllTS to sync data like worksyncdata component
            // const testCases = await testCaseSet.get();
            // if (testCases.length > 0) {
            //   const isCheckedAll = testCases.every((testCase) => testCase.isSelected);
            //   await testScenarioSet.update('isSelected', isCheckedAll, testScenarioSet.table.id.eq(scenarioId));
            // }
          }
          setTestScenarioAndCase(clone);
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
    async (rowKey, scenarioId, key, checked) => {
      if (dbContext && dbContext.db) {
        // update to indexedDb
        const { testScenarioSet } = dbContext;
        testScenarioSet.update(key, checked, testScenarioSet.table.id.eq(scenarioId));

        // update to state
        const clone = structuredClone(testScenarioAndCase);
        const newRows = clone.find((row) => row.key === rowKey);
        if (newRows) {
          const testScenarioRow = newRows.testScenarios.find((testScenario) => testScenario.id === scenarioId);
          if (testScenarioRow) {
            testScenarioRow[key] = checked;
          }
        }
        setTestScenarioAndCase(clone);
      }
    },
    [rows, filterRows]
  );

  /**
   * @param {string} groupKey - row key is selected effect node
   * @param {boolean} checked - checkbox's value of selected effect node
   */
  const _handleCheckedByGroup = useCallback(
    (rowKey, checked) => {
      const { testCaseSet } = dbContext;
      const clone = structuredClone(testScenarioAndCase);
      const newRows = clone.find((row) => row.key === rowKey);
      if (newRows) {
        newRows.isSelected = checked;
        newRows.testScenarios.forEach((testScenario) => {
          const _testScenario = testScenario;
          _testScenario.isSelected = checked;
          _testScenario.testCases.forEach((testCase) => {
            const _testCase = testCase;
            _testCase.isSelected = checked;
          });

          // _handleTestScenarioChecked(testScenario.id, checked, false);
        });
        isCheckAll(newRows.testScenarios);
        newRows.testScenarios.map((testScenario) => {
          return testScenario.testCases.map(async (testCase) => {
            const promises = testCaseSet.update(
              'isSelected',
              checked,
              lf.op.and(testCaseSet.table.testScenarioId.eq(testScenario.id), testCaseSet.table.id.eq(testCase.id))
            );
            await Promise.all(promises);
          });
        });
        setTestScenarioAndCase(clone);
      }
    },
    [testScenarioAndCase]
  );

  const _getTestCases = async (rowKey, testScenarioId) => {
    if (dbContext && dbContext.db) {
      const { testCaseSet } = dbContext;
      const testScenarioAndCaseClone = structuredClone(testScenarioAndCase);
      const index = testScenarioAndCaseClone.findIndex((row) => row.key === rowKey);
      if (index > -1) {
        const testScenarioIndex = testScenarioAndCaseClone[index].testScenarios.findIndex(
          (testScenario) => testScenario.id === testScenarioId
        );
        if (testScenarioIndex > -1) {
          const currentTestScenarioAndCase = testScenarioAndCaseClone[index].testScenarios[testScenarioIndex];
          if (currentTestScenarioAndCase.page === currentTestScenarioAndCase.totalPage - 1) {
            return;
          }
          currentTestScenarioAndCase.page += 1;
          const nextTestCases = await testCaseSet.getWithPaging(
            testCasePageSize,
            testCasePageSize * currentTestScenarioAndCase.page,
            testCaseSet.table.testScenarioId.eq(testScenarioId)
          );
          if (nextTestCases.length > 0) {
            const testCaseName = currentTestScenarioAndCase.testCases[0].Name.split('-');
            nextTestCases.forEach((testCase) => {
              const newTestCase = {
                id: testCase.id,
                Name: `${testCaseName[0]}-${currentTestScenarioAndCase.testCases.length}`,
                isSelected: Boolean(testCase.isSelected),
              };
              columns.forEach((column) => {
                if (column.key === 'results') {
                  newTestCase[column.key] = testCase[column.key].join(', ');
                } else if (column.key === 'isValid' || column.key === 'isBaseScenario') {
                  newTestCase[column.key] = '';
                } else {
                  const testData = testCase.testDatas.find((x) => x.graphNodeId === column.key);
                  newTestCase[column.key] = testData ? testData.data : '';
                }
              });
              currentTestScenarioAndCase.testCases.splice(
                currentTestScenarioAndCase.testCases.length - 1,
                0,
                newTestCase
              );
            });
            if (currentTestScenarioAndCase.page === currentTestScenarioAndCase.totalPage - 1) {
              currentTestScenarioAndCase.testCases.splice(-1, 1);
            }
            setTestScenarioAndCase(testScenarioAndCaseClone);
          }
        }
      }
    }
  };

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
                                    {testCaseIndex < testScenario.testCases.length - 1 && (
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
                                    {testCaseIndex === testScenario.testCases.length - 1 &&
                                      testScenario.page < testScenario.totalPage - 1 && (
                                        <li>
                                          <Button
                                            color="link"
                                            size="sm"
                                            style={{ fontSize: 13, margin: 0, padding: 0 }}
                                            onClick={() => _getTestCases(row?.key, testScenario.id)}
                                          >
                                            <i className="bi bi-plus-square-dotted" />
                                            <span style={{ marginLeft: 8 }}>Load more</span>
                                          </Button>
                                        </li>
                                      )}
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
                          {tcIndex < testScenario.testCases.length - 1 &&
                            columns.map(
                              (column, colIndex) =>
                                tcIndex !== testScenario.testCases.length - 1 && (
                                  <td key={`${colIndex}test-case-col`} style={{ padding: '3px 8px' }}>
                                    {testCase[column.key]}
                                  </td>
                                )
                            )}
                          {tcIndex === testScenario.testCases.length - 1 &&
                            testScenario.page < testScenario.totalPage - 1 && (
                              <td colSpan={columns.length} style={{ height: 32 }} />
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
