import React, { Fragment, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import testScenarioAnsCaseStorage from 'features/project/work/services/TestScenarioAnsCaseStorage';
import Checkbox from './TableCheckbox';

function TableRow(props) {
  const { groupByEffectNodes, rows, filterRows, columns, updateGroupByEffectNodes, updateRows } = props;

  const [expandId, setExpandId] = useState({});
  const [rowSpan, setRowSpan] = useState({});

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

  const _handleTestScenarioChecked = useCallback(
    (scenarioId, checked) => {
      testScenarioAnsCaseStorage.checkTestScenario(scenarioId, checked);
      const newRows = testScenarioAnsCaseStorage.checkTestScenario(scenarioId, checked, rows);
      updateGroupByEffectNodes(filterRows ?? newRows);

      updateRows(newRows);
    },
    [rows, filterRows]
  );

  const _handleTestCaseChecked = useCallback(
    (scenarioId, caseId, checked) => {
      testScenarioAnsCaseStorage.checkTestCase(scenarioId, caseId, checked);
      const newRows = testScenarioAnsCaseStorage.checkTestCase(scenarioId, caseId, checked, rows);
      updateGroupByEffectNodes(newRows);

      updateRows(newRows);
    },
    [rows, filterRows]
  );

  const _handleCheckboxChange = useCallback(
    (scenarioId, key, checked) => {
      testScenarioAnsCaseStorage.changeTestScenario(scenarioId, key, checked);
      const newRows = testScenarioAnsCaseStorage.changeTestScenario(scenarioId, key, checked, rows);
      updateGroupByEffectNodes(filterRows ?? newRows);

      updateRows(newRows);
    },
    [rows, filterRows]
  );

  const _handleCheckedByGroup = useCallback(
    (groupKey, checked) => {
      const checkedIndex = groupByEffectNodes.findIndex((groupRow) => groupRow.key === groupKey);
      if (checkedIndex > -1) {
        groupByEffectNodes[checkedIndex].testScenarios.forEach((testScenario) =>
          _handleTestScenarioChecked(testScenario.id, checked)
        );
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
                  <tr>
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
  updateRows: PropTypes.func.isRequired,
  filterRows: PropTypes.oneOfType([PropTypes.array]),
};

TableRow.defaultProps = { filterRows: undefined };

export default TableRow;
