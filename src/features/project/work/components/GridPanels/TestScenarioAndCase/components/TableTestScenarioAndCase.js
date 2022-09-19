import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import { useSelector } from 'react-redux';

import { sortByString } from 'features/shared/lib/utils';
import { FILTER_TYPE, RESULT_TYPE } from 'features/shared/constants';
import Header from './TableHeader';
import TableRow from './TableRow';

function TableTestScenarioAndCase(props) {
  const { filterOptions, getData } = props;

  const [groupByEffectNodes, setGroupByEffectNodes] = useState([]);
  const [filterData, setFilterData] = useState(undefined);

  const { dbContext, generating } = useSelector((state) => state.work);

  let testScenarioAndCaseRows = [];
  let testScenarioAndCaseColumns = [];

  const _getData = React.useMemo(() => {
    return getData();
  }, [generating]);

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
    [testScenarioAndCaseRows]
  );
  const _onChangeFilterOptions = () => {
    const { causeNodes, sourceTargetType, resultType, isBaseScenario, isValid, type } = filterOptions;
    let _resultType;
    if (resultType !== RESULT_TYPE.All) {
      _resultType = resultType === RESULT_TYPE.True;
    } else {
      _resultType = undefined;
    }
    const filterRows = testScenarioAndCaseRows.filter((row) => {
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

  useEffect(async () => {
    if (!generating) {
      const { rows, columns } = await _getData;
      console.log('columns', columns);
      testScenarioAndCaseRows = rows;
      testScenarioAndCaseColumns = columns;
      console.log('testScenarioAndCaseColumns', testScenarioAndCaseColumns);
    }
    _getGroupByEffectNodes(filterData ?? testScenarioAndCaseRows);
  }, [generating, filterData]);

  const _handleCheckedAll = useCallback(
    async (checked) => {
      if (dbContext && dbContext.db) {
        const { testScenarioSet, testCaseSet } = dbContext;
        const newRows = structuredClone(testScenarioAndCaseRows);
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
    [testScenarioAndCaseRows, filterData]
  );

  // TODO: fix this after done
  const _isCheckedAllTestScenarios = () => {
    if (testScenarioAndCaseRows.length > 0) {
      const isCheckAll = testScenarioAndCaseRows.every(
        (row) => row.isSelected || row.testCases.every((testCase) => testCase.isSelected)
      );
      return isCheckAll;
    }
    return false;
  };

  return (
    <Table bordered className="scenario-case-table">
      <Header
        rows={testScenarioAndCaseRows}
        filterRows={filterData}
        onChangeCheckbox={(e) => _handleCheckedAll(e.target.checked)}
        columns={testScenarioAndCaseColumns}
        checked={() => _isCheckedAllTestScenarios()}
      />
      <TableRow
        rows={testScenarioAndCaseRows}
        filterRows={filterData}
        updateGroupByEffectNodes={_getGroupByEffectNodes}
        groupByEffectNodes={groupByEffectNodes}
        columns={testScenarioAndCaseColumns}
      />
    </Table>
  );
}

TableTestScenarioAndCase.propTypes = {
  getData: PropTypes.func.isRequired,
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
