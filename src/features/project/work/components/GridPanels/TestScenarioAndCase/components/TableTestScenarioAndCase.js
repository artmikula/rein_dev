/* eslint-disable max-lines */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';

import appConfig from 'features/shared/lib/appConfig';
import { FILTER_TYPE, GENERATE_STATUS, RESULT_TYPE } from 'features/shared/constants';
import TestScenarioHelper from 'features/project/work/biz/TestScenario/TestScenarioHelper';
import { sortByString } from 'features/shared/lib/utils';
import { setGenerating } from 'features/project/work/slices/workSlice';
import Header from './TableHeader';
import TableRow from './TableRow';

function TableTestScenarioAndCase(props) {
  const { filterOptions, filterSubmitType, submitFilter } = props;

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [isCheckAll, setIsCheckAll] = useState(false);

  const { dbContext, generating, graph } = useSelector((state) => state.work);
  const dispatch = useDispatch();

  const { testCasePageSize } = appConfig.testScenarioAndCase;

  const _getDataFirstTime = async (defaultData = undefined) => {
    if (dbContext && dbContext.db) {
      try {
        const { testScenarioSet, testCaseSet } = dbContext;
        const page = 0;
        const testScenarios = defaultData ?? (await testScenarioSet.get());

        const promises = testScenarios.map(async (testScenario) => {
          const _testScenario = {};
          _testScenario.id = testScenario.id;
          _testScenario.testCases = await testCaseSet.getWithPaging(
            testCasePageSize,
            page,
            testCaseSet.table.testScenarioId.eq(testScenario.id)
          );

          _testScenario.total = await testCaseSet.totalTestCases(testScenario.id);
          _testScenario.page = page;
          return _testScenario;
        });

        const data = await Promise.all(promises);
        const columns = TestScenarioHelper.convertToColumns(graph.graphNodes);
        return {
          rows: TestScenarioHelper.convertToRows(data, testScenarios, columns, graph.graphNodes) ?? [],
          columns: columns ?? [],
        };
      } catch (error) {
        console.log('get data error', error);
      }
    }
    return {
      rows: [],
      columns: [],
    };
  };

  const _getGroupByEffectNodes = useCallback(
    (rows) => {
      const groups = [];
      if (rows.length > 0) {
        rows.forEach((row) => {
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
      return groups;
    },
    [rows]
  );

  const _onChangeFilterOptions = async () => {
    if (dbContext && dbContext.db) {
      const { causeNodes, sourceTargetType, resultType, isBaseScenario, isValid } = filterOptions;
      const { testScenarioSet } = dbContext;

      let _resultType;
      if (resultType !== RESULT_TYPE.All) {
        _resultType = resultType === RESULT_TYPE.True;
      } else {
        _resultType = undefined;
      }

      const testScenarios = await testScenarioSet.get();

      const filterRows = testScenarios.filter((row) => {
        const testAssertionFilter = row.testAssertions?.filter((testAssertion) =>
          causeNodes?.some((causeNode) => causeNode?.value === testAssertion?.graphNodeId)
        );
        const isExist = causeNodes?.every((causeNode) =>
          row.testAssertions?.some((testAssertion) => causeNode?.value === testAssertion?.graphNodeId)
        );
        const causeNodesResultType = testAssertionFilter.every((testAssertion) => testAssertion.result === _resultType);
        if (typeof isExist !== 'undefined' && !isExist) {
          return false;
        }
        if (typeof _resultType !== 'undefined' && !causeNodesResultType) {
          return false;
        }
        if (typeof sourceTargetType !== 'undefined' && isExist && sourceTargetType !== row.sourceTargetType) {
          return false;
        }
        if (
          typeof sourceTargetType !== 'undefined' &&
          typeof isExist === 'undefined' &&
          sourceTargetType !== row.sourceTargetType
        ) {
          return false;
        }
        if (typeof isBaseScenario !== 'undefined' && isBaseScenario === true && isBaseScenario !== row.isBaseScenario) {
          return false;
        }
        if (typeof isValid !== 'undefined' && isValid === true && isValid !== row.isValid) {
          return false;
        }
        return true;
      });

      const { rows } = await _getDataFirstTime(filterSubmitType === FILTER_TYPE.SUBMIT ? filterRows : undefined);
      const groupRows = _getGroupByEffectNodes(rows);
      setRows(groupRows);
    }
  };

  const _isCheckedAllTestScenarios = (newRows = undefined) => {
    const _newRows = newRows ?? rows;
    const isCheckAll = _newRows.every((row) => {
      return row.testScenarios.every(
        (testScenario) => testScenario.isSelected || testScenario.testCases.every((testCase) => testCase.isSelected)
      );
    });
    setIsCheckAll(isCheckAll);
  };

  useEffect(async () => {
    if (filterSubmitType !== FILTER_TYPE.DEFAULT) {
      await _onChangeFilterOptions();
      submitFilter(FILTER_TYPE.DEFAULT);
    }
  }, [filterSubmitType, filterOptions]);

  useEffect(async () => {
    if (generating === GENERATE_STATUS.START || generating === GENERATE_STATUS.RESET) {
      setColumns([]);
      setRows([]);
    } else if (generating === GENERATE_STATUS.INITIAL) {
      const { rows, columns } = await _getDataFirstTime();
      const groupRows = _getGroupByEffectNodes(rows);
      setColumns(columns);
      setRows(groupRows);
    } else if (generating === GENERATE_STATUS.SUCCESS) {
      setTimeout(async () => {
        const { rows, columns } = await _getDataFirstTime();
        const groupRows = _getGroupByEffectNodes(rows);
        setColumns(columns);
        setRows(groupRows);
        dispatch(setGenerating(GENERATE_STATUS.COMPLETE));
      }, 700);
    } else {
      setColumns([]);
      setRows([]);
    }
  }, [generating, graph.graphNodes, dbContext]);

  useEffect(async () => {
    if (rows.length > 0) {
      await _isCheckedAllTestScenarios();
    }
  }, [rows]);

  const _updateRows = (rowIndex, newRow) => {
    const _rows = structuredClone(rows);
    _rows[rowIndex] = newRow;
    setRows(_rows);
  };

  const _handleCheckedAll = useCallback(
    async (checked) => {
      if (dbContext && dbContext.db) {
        const { testScenarioSet, testCaseSet } = dbContext;
        const newRows = structuredClone(rows);
        newRows.forEach((row) => {
          const _row = row;
          _row.isSelected = checked;
          _row.testScenarios.forEach((testScenario) => {
            const _testScenario = testScenario;
            _testScenario.isSelected = checked;
            _testScenario.testCases.forEach((testCase) => {
              const _testCase = testCase;
              _testCase.isSelected = checked;
              return _testCase;
            });
            return _testScenario;
          });
        });
        setRows(newRows);

        await testScenarioSet.update('isSelected', checked);
        await testCaseSet.update('isSelected', checked);
      }
    },
    [rows]
  );

  const _getTestCases = async (rowKey, testScenarioId) => {
    if (dbContext && dbContext.db) {
      const { testCaseSet } = dbContext;
      const newRows = structuredClone(rows);
      const currentRow = newRows.find((row) => row.key === rowKey);
      if (currentRow) {
        const tsRow = currentRow.testScenarios.find((testScenario) => testScenario.id === testScenarioId);
        if (tsRow) {
          if (tsRow.page === tsRow.totalPage - 1) {
            return;
          }
          tsRow.page += 1;
          const nextTestCases = await testCaseSet.getWithPaging(
            testCasePageSize,
            testCasePageSize * tsRow.page,
            testCaseSet.table.testScenarioId.eq(testScenarioId)
          );
          if (nextTestCases.length > 0) {
            const testCaseName = tsRow.testCases[0].Name.split('-');
            nextTestCases.forEach((testCase) => {
              const newTestCase = {
                id: testCase.id,
                Name: `${testCaseName[0]}-${tsRow.testCases.length}`,
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
              tsRow.testCases.splice(tsRow.testCases.length - 1, 0, newTestCase);
            });
            if (tsRow.page === tsRow.totalPage - 1) {
              tsRow.testCases.splice(-1, 1);
            }
            setRows(newRows);
          }
        }
      }
    }
  };

  return (
    <Table bordered className="scenario-case-table">
      <Header
        rows={rows}
        onChangeCheckbox={(e) => _handleCheckedAll(e.target.checked)}
        columns={columns}
        isCheckAll={isCheckAll}
      />
      <TableRow
        rows={rows}
        columns={columns}
        onRowsChange={_updateRows}
        onLoadMore={_getTestCases}
        isFilter={filterSubmitType}
      />
    </Table>
  );
}

TableTestScenarioAndCase.propTypes = {
  filterOptions: PropTypes.shape({
    causeNodes: PropTypes.oneOfType([PropTypes.array]),
    sourceTargetType: PropTypes.string,
    resultType: PropTypes.string,
    isBaseScenario: PropTypes.bool,
    isValid: PropTypes.bool,
    type: PropTypes.string,
  }).isRequired,
  filterSubmitType: PropTypes.string.isRequired,
  submitFilter: PropTypes.func.isRequired,
};

export default TableTestScenarioAndCase;
