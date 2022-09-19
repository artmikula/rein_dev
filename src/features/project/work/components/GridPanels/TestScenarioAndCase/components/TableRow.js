import React, { Fragment, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import lf from 'lovefield';
import { useSelector } from 'react-redux';

import Checkbox from './TableCheckbox';

function TableRow(props) {
  const { groupByEffectNodes, rows, filterRows, columns, updateGroupByEffectNodes } = props;

  const [expandId, setExpandId] = useState({});
  const [rowSpan, setRowSpan] = useState({});

  const { dbContext } = useSelector((state) => state.work);

  console.log('groupByEffectNodes', groupByEffectNodes);

  useEffect(() => {
    // handle get row span by group
    const rowSpanByGroup = {};
    groupByEffectNodes.forEach((groupRow) => {
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
  }, [expandId, groupByEffectNodes]);

  useEffect(() => {
    setExpandId({});
  }, [filterRows]);

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
            updateGroupByEffectNodes(newRows);
          }
        }
      }

      /** TODO: remove this after finish implement indexedDb */
      // testScenarioAnsCaseStorage.checkTestScenario(scenarioId, checked);
      // const newRows = testScenarioAnsCaseStorage.checkTestScenario(scenarioId, checked, rows);
      // updateGroupByEffectNodes(filterRows ?? newRows);

      // updateRows(newRows);
      /** end */
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
          updateGroupByEffectNodes(newRows);
        }
      }

      /** TODO: remove this after finish implement indexedDb */
      // testScenarioAnsCaseStorage.checkTestCase(scenarioId, caseId, checked);
      // const newRows = testScenarioAnsCaseStorage.checkTestCase(scenarioId, caseId, checked, rows);
      // updateGroupByEffectNodes(newRows);

      // updateRows(newRows);
      /** end */
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
          updateGroupByEffectNodes(filterRows ?? newRows);
        }
      }
      /** TODO: remove this after finish implement indexedDb */
      // testScenarioAnsCaseStorage.changeTestScenario(scenarioId, key, checked);
      // const newRows = testScenarioAnsCaseStorage.changeTestScenario(scenarioId, key, checked, rows);
      // updateGroupByEffectNodes(filterRows ?? newRows);

      // updateRows(newRows);
      /** end */
    },
    [rows, filterRows]
  );

  /**
   * @param {string} groupKey - row key is selected effect node
   * @param {boolean} checked - checkbox's value of selected effect node
   */
  const _handleCheckedByGroup = useCallback(
    (groupKey, checked) => {
      const checkedIndex = groupByEffectNodes.findIndex((groupRow) => groupRow.key === groupKey);
      if (checkedIndex > -1) {
        groupByEffectNodes[checkedIndex].testScenarios.forEach((testScenario) => {
          const newRows = rows.slice();
          const tsRow = newRows.find((row) => row.id === testScenario.id);
          if (tsRow) {
            tsRow.isSelected = checked;
            tsRow.testCases.forEach((tcRow) => {
              const _tcRow = tcRow;
              _tcRow.isSelected = checked;
              return _tcRow;
            });
            updateGroupByEffectNodes(filterRows ?? newRows);
          }
          _handleTestScenarioChecked(testScenario.id, checked, false);
        });
      }
    },
    [groupByEffectNodes]
  );

  return (
    <tbody>
      {groupByEffectNodes.map((row, rowIndex) => (
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
                                  <Checkbox
                                    checked={testCase.isSelected ?? false}
                                    onChange={(e) =>
                                      _handleTestCaseChecked(testScenario.id, testCase.id, e.target.checked)
                                    }
                                    labelRenderer={testCase.Name}
                                  />
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
                            onChange={(e) => _handleCheckboxChange(testScenario.id, column.key, e.target.checked)}
                            checked={testScenario[column.key]}
                          />
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
                          <td key={`${colIndex}test-case-col`} style={{ padding: '3px 8px' }}>
                            {testCase[column.key]}
                          </td>
                        ))}
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

TableRow.propTypes = {
  groupByEffectNodes: PropTypes.oneOfType([PropTypes.array]).isRequired,
  rows: PropTypes.oneOfType([PropTypes.array]).isRequired,
  columns: PropTypes.oneOfType([PropTypes.array]).isRequired,
  updateGroupByEffectNodes: PropTypes.func.isRequired,
  filterRows: PropTypes.oneOfType([PropTypes.array]),
};

TableRow.defaultProps = { filterRows: undefined };

export default TableRow;
