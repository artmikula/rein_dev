import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import { useSelector } from 'react-redux';

import { sortByString } from 'features/shared/lib/utils';
import { FILTER_TYPE, GENERATE_STATUS, RESULT_TYPE } from 'features/shared/constants';
import TestScenarioHelper from 'features/project/work/biz/TestScenario/TestScenarioHelper';
import Language from 'features/shared/languages/Language';
import Header from './TableHeader';
import TableRow from './TableRow';

const PAGE_SIZE = 100;

function TableTestScenarioAndCase(props) {
  const { filterOptions } = props;

  const [groupByEffectNodes, setGroupByEffectNodes] = useState([]);
  const [filterData, setFilterData] = useState(undefined);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [isCheckAll, setIsCheckAll] = useState(false);

  const { dbContext, generating, graph } = useSelector((state) => state.work);

  const _getData = async () => {
    if (dbContext && dbContext.db) {
      try {
        const { testScenarioSet, testCaseSet } = dbContext;
        const testScenarios = await testScenarioSet.get();
        const promises = testScenarios.map(async (testScenario) => {
          const _testScenario = testScenario;
          _testScenario.testCases = await testCaseSet.db
            .select()
            .from(testCaseSet.table)
            .limit(PAGE_SIZE)
            .where(testCaseSet.table.testScenarioId.eq(testScenario.id))
            .exec();

          return _testScenario.testCases;
        });

        const testCases = await Promise.all(promises);
        const columns = TestScenarioHelper.convertToColumns(graph.graphNodes, Language);
        return {
          rows: TestScenarioHelper.convertToRows(testCases.flat(), testScenarios, columns, graph.graphNodes),
          columns,
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
      setGroupByEffectNodes(groups);
    },
    [rows]
  );

  const _onChangeFilterOptions = () => {
    const { causeNodes, sourceTargetType, resultType, isBaseScenario, isValid, type } = filterOptions;
    let _resultType;
    if (resultType !== RESULT_TYPE.All) {
      _resultType = resultType === RESULT_TYPE.True;
    } else {
      _resultType = undefined;
    }
    const filterRows = rows.filter((row) => {
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
    if (type === FILTER_TYPE.RESET) {
      setFilterData(undefined);
    }
    if (type === FILTER_TYPE.SUBMIT) {
      setFilterData(filterRows);
    }
  };

  // TODO: fix this after done
  const _isCheckedAllTestScenarios = () => {
    if (rows.length > 0) {
      const isCheckAll = rows.every((row) => row.isSelected || row.testCases.every((testCase) => testCase.isSelected));
      setIsCheckAll(isCheckAll);
    }
  };

  useEffect(() => {
    if (filterOptions.type === FILTER_TYPE.SUBMIT) {
      _onChangeFilterOptions();
    }
  }, [filterOptions.type]);

  useEffect(async () => {
    if (generating === GENERATE_STATUS.INITIAL || generating === GENERATE_STATUS.COMPLETE) {
      const { rows, columns } = await _getData();
      setColumns(columns);
      setRows(rows);
    } else {
      setColumns([]);
      setRows([]);
    }
  }, [generating, graph.graphNodes, dbContext]);

  // useEffect(() => {
  //   console.log('rows', rows);
  // }, [rows]);

  useEffect(() => {
    if (groupByEffectNodes.length > 0) {
      _isCheckedAllTestScenarios();
    }
  }, [groupByEffectNodes]);

  useEffect(async () => {
    await _getGroupByEffectNodes(filterData ?? rows);
    await _isCheckedAllTestScenarios();
  }, [rows, filterData]);

  const _handleCheckedAll = useCallback(
    async (checked) => {
      if (dbContext && dbContext.db) {
        const { testScenarioSet, testCaseSet } = dbContext;
        const newRows = structuredClone(rows);
        newRows.forEach((row) => {
          const _row = row;
          _row.isSelected = checked;
          _row.testCases.forEach((tcRow) => {
            const _tcRow = tcRow;
            _tcRow.isSelected = checked;
            return _tcRow;
          });
          return _row;
        });
        setRows(newRows);
        _getGroupByEffectNodes(filterData ?? newRows);

        await testScenarioSet.update('isSelected', checked);
        await testCaseSet.update('isSelected', checked);
      }

      /** TODO: remove this after finish implement indexedDb */
      // testScenarioAnsCaseStorage.checkAllTestScenarios(checked);
      // const newRows = testScenarioAnsCaseStorage.checkAllTestScenarios(checked, rows);
      // _getGroupByEffectNodes(filterRows ?? newRows);

      // setRows(newRows);
      /** end */
    },
    [rows, filterData]
  );

  return (
    <Table bordered className="scenario-case-table">
      <Header
        rows={rows}
        filterRows={filterData}
        onChangeCheckbox={(e) => _handleCheckedAll(e.target.checked)}
        columns={columns}
        isCheckAll={isCheckAll}
      />
      <TableRow
        rows={rows}
        filterRows={filterData}
        updateGroupByEffectNodes={_getGroupByEffectNodes}
        groupByEffectNodes={groupByEffectNodes}
        columns={columns}
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
};

export default TableTestScenarioAndCase;
