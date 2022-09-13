import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import { useSelector } from 'react-redux';

import Header from './TableHeader';
import TableRow from './TableRow';

function TableTestScenarioAndCase(props) {
  const { columns, setRows, isCheckAllTestScenarios, filterRows, getData } = props;

  const [groupByEffectNodes, setGroupByEffectNodes] = useState([]);

  const { dbContext, generating } = useSelector((state) => state.work);

  let testScenarioAndCase = [];

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
        const isSelected = group.testScenarios.every((testScenario) => testScenario.isSelected);
        // eslint-disable-next-line no-param-reassign
        group.isSelected = isSelected;
      });
      groups.sort((a, b) => {
        if (a.key < b.key) {
          return -1;
        }
        if (a.key > b.key) {
          return 1;
        }
        return 0;
      });
      setGroupByEffectNodes(groups);
    },
    [testScenarioAndCase]
  );

  useEffect(async () => {
    testScenarioAndCase = await _getData;
    _getGroupByEffectNodes(filterRows ?? testScenarioAndCase);
  }, []);

  const _handleCheckedAll = useCallback(
    async (checked) => {
      if (dbContext && dbContext.db) {
        const { testScenarioSet, testCaseSet } = dbContext;
        const newRows = structuredClone(testScenarioAndCase);
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
        _getGroupByEffectNodes(filterRows ?? newRows);
        setRows(newRows);

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
    [testScenarioAndCase, filterRows]
  );

  // TODO: fix this after done
  // const _isCheckedAllTestScenarios = () => {
  //   const { rows } = this.state;
  //   const isCheckAllTestScenarios = rows.every(
  //     (row) => row.isSelected || row.testCases.every((testCase) => testCase.isSelected)
  //   );
  //   this.setState({ isCheckAllTestScenarios });
  // };

  return (
    <Table bordered className="scenario-case-table">
      <Header
        rows={testScenarioAndCase}
        filterRows={filterRows}
        onChangeCheckbox={(e) => _handleCheckedAll(e.target.checked)}
        columns={columns}
        checked={isCheckAllTestScenarios}
      />
      <TableRow
        rows={testScenarioAndCase}
        filterRows={filterRows}
        updateGroupByEffectNodes={_getGroupByEffectNodes}
        updateRows={setRows}
        groupByEffectNodes={groupByEffectNodes}
        columns={columns}
      />
    </Table>
  );
}

TableTestScenarioAndCase.propTypes = {
  getData: PropTypes.func.isRequired,
  columns: PropTypes.oneOfType([PropTypes.array]).isRequired,
  isCheckAllTestScenarios: PropTypes.bool.isRequired,
  setRows: PropTypes.func.isRequired,
  filterRows: PropTypes.oneOfType([PropTypes.array]),
};

TableTestScenarioAndCase.defaultProps = {
  filterRows: undefined,
};

export default TableTestScenarioAndCase;
