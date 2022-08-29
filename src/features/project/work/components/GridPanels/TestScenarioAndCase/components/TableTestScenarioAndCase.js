import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import { useSelector } from 'react-redux';

import Header from './TableHeader';
import TableRow from './TableRow';

function TableTestScenarioAndCase(props) {
  const { rows, columns, setRows, isCheckAllTestScenarios, filterRows } = props;

  const [groupByEffectNodes, setGroupByEffectNodes] = useState([]);

  const { dbContext } = useSelector((state) => state.work);

  const _getGroupByEffectNodes = useCallback(
    (rows) => {
      const groups = [];
      rows.forEach((row) => {
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
    [rows]
  );

  useEffect(() => {
    _getGroupByEffectNodes(filterRows ?? rows);
  }, [rows, filterRows]);

  const _handleCheckedAll = useCallback(
    async (checked) => {
      if (dbContext && dbContext.db) {
        const { testScenarioSet, testCaseSet } = dbContext;
        const newRows = rows.slice();
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
    [rows, filterRows]
  );

  return (
    <Table bordered className="scenario-case-table">
      <Header
        rows={rows}
        filterRows={filterRows}
        onChangeCheckbox={(e) => _handleCheckedAll(e.target.checked)}
        columns={columns}
        checked={isCheckAllTestScenarios}
      />
      <TableRow
        rows={rows}
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
  rows: PropTypes.oneOfType([PropTypes.array]).isRequired,
  columns: PropTypes.oneOfType([PropTypes.array]).isRequired,
  isCheckAllTestScenarios: PropTypes.bool.isRequired,
  setRows: PropTypes.func.isRequired,
  filterRows: PropTypes.oneOfType([PropTypes.array]),
};

TableTestScenarioAndCase.defaultProps = {
  filterRows: undefined,
};

export default TableTestScenarioAndCase;
