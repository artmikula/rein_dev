import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import { useSelector } from 'react-redux';

import { sortByString } from 'features/shared/lib/utils';
import { FILTER_TYPE, RESULT_TYPE } from 'features/shared/constants';
import TestScenarioHelper from 'features/project/work/biz/TestScenario/TestScenarioHelper';
import Language from 'features/shared/languages/Language';
import Header from './TableHeader';
import TableRow from './TableRow';

function TableTestScenarioAndCase(props) {
  const { filterOptions } = props;

  const [groupByEffectNodes, setGroupByEffectNodes] = useState([]);
  const [filterData, setFilterData] = useState(undefined);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

  const { dbContext, generating, graph } = useSelector((state) => state.work);

  const _getData = React.useMemo(async () => {
    if (dbContext && dbContext.db) {
      const { testScenarioSet, testCaseSet } = dbContext;
      const testScenarios = await testScenarioSet.get();
      console.log('testScenarios', testScenarios);
      const testCases = await testCaseSet.get();
      console.log('testCases', testCases);
      const columns = TestScenarioHelper.convertToColumns(graph.graphNodes, Language);
      return {
        rows: TestScenarioHelper.convertToRows(testCases, testScenarios, columns, graph.graphNodes),
        columns,
      };
    }
    return {
      rows: [],
      columns: [],
    };
  }, [generating, dbContext, graph]);

  const _getGroupByEffectNodes = useCallback(
    (testScenarioAndCase) => {
      const groups = [];
      testScenarioAndCase.forEach((row) => {
        const isExists = groups.findIndex((group) => group?.key === row.results);
        if (isExists === -1) {
          groups.push({
            key: row.results,
            definition: row.effectDefinition,
            isSelected: false,
            testScenarios: [{ ...row, testCases: row.testCases.slice() }],
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
      sortByString(groups, 'key');
      // groups.sort((a, b) => {
      //   if (a.key < b.key) {
      //     return -1;
      //   }
      //   if (a.key > b.key) {
      //     return 1;
      //   }
      //   return 0;
      // });
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

  useEffect(() => {
    if (filterOptions.type === FILTER_TYPE.SUBMIT) {
      _onChangeFilterOptions();
    }
  }, [filterOptions.type]);

  useEffect(() => {
    console.log('groupByEffectNodes', groupByEffectNodes);
  }, [groupByEffectNodes]);

  useEffect(async () => {
    if (!generating) {
      const { rows, columns } = await _getData;
      setColumns(columns);
      setRows(rows);
    } else {
      setColumns([]);
      setRows([]);
    }
  }, [generating, dbContext, filterData]);

  useEffect(() => {
    _getGroupByEffectNodes(filterData ?? rows);
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

  // TODO: fix this after done
  const _isCheckedAllTestScenarios = () => {
    if (rows.length > 0) {
      const isCheckAll = rows.every((row) => row.isSelected || row.testCases.every((testCase) => testCase.isSelected));
      return isCheckAll;
    }
    return false;
  };

  return (
    <Table bordered className="scenario-case-table">
      <Header
        rows={rows}
        filterRows={filterData}
        onChangeCheckbox={(e) => _handleCheckedAll(e.target.checked)}
        columns={columns}
        checked={() => _isCheckedAllTestScenarios()}
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
