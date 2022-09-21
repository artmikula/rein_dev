import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';

import Checkbox from './TableCheckbox';

function RowItem(props) {
  const {
    row,
    rowIndex,
    rowSpan,
    toggleRow,
    expandId,
    handleCheckedByGroup,
    handleTestScenarioChecked,
    handleTestCaseChecked,
    getTestCases,
    columns,
    handleCheckboxChange,
  } = props;

  return (
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
                  onClick={(e) => toggleRow(e, row?.key)}
                >
                  <i
                    className={`mr-1 cursor-pointer ${
                      expandId[row?.key] ? 'bi bi-dash-square-fill' : 'bi bi-plus-square-fill'
                    }`}
                  />
                </a>
                <Checkbox
                  checked={row?.isSelected ?? false}
                  onChange={(e) => handleCheckedByGroup(row?.key ?? '', e.target.checked)}
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
                    <li key={`${row.key}-${testScenario.id}`} className={testScenario.isViolated ? 'ommit-row' : ''}>
                      <ul className="d-inline-flex">
                        <a
                          style={{
                            paddingTop: '2px',
                            visibility: testScenario.testCases.length === 0 ? 'hidden' : 'visible',
                          }}
                          href="#collapse"
                          className="text-dark"
                          onClick={(e) => toggleRow(e, testScenario.id)}
                        >
                          <i
                            className={`mr-1 cursor-pointer ${
                              expandId[testScenario.id] ? 'bi bi-dash-square-fill' : 'bi bi-plus-square-fill'
                            }`}
                          />
                        </a>
                        <Checkbox
                          checked={testScenario.isSelected ?? false}
                          onChange={(e) => handleTestScenarioChecked(row?.key, testScenario.id, e.target.checked)}
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
                                      handleTestCaseChecked(row?.key, testScenario.id, testCase.id, e.target.checked)
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
                                      onClick={() => getTestCases(row?.key, testScenario.id)}
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
                        onChange={(e) => handleCheckboxChange(row?.key, testScenario.id, column.key, e.target.checked)}
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
                      tcIndex === testScenario.testCases.length - 1 && testScenario.page < testScenario.totalPage - 1
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
  );
}

RowItem.propTypes = {
  row: PropTypes.oneOfType([PropTypes.array]).isRequired,
  rowIndex: PropTypes.number.isRequired,
  rowSpan: PropTypes.oneOfType([PropTypes.object]).isRequired,
  toggleRow: PropTypes.func.isRequired,
  expandId: PropTypes.oneOfType([PropTypes.object]).isRequired,
  handleCheckedByGroup: PropTypes.func.isRequired,
  handleTestScenarioChecked: PropTypes.func.isRequired,
  handleTestCaseChecked: PropTypes.func.isRequired,
  getTestCases: PropTypes.func.isRequired,
  columns: PropTypes.oneOfType([PropTypes.array]).isRequired,
  handleCheckboxChange: PropTypes.func.isRequired,
};

export default RowItem;
