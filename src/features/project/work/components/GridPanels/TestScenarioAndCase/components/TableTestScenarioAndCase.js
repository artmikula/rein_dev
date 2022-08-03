import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';

import testScenarioAnsCaseStorage from 'features/project/work/services/TestScenarioAnsCaseStorage';
import Header from './TableHeader';
import TableRow from './TableRow';

function TableTestScenarioAndCase(props) {
  const { rows, columns, setRows, isCheckAllTestScenarios, filterRows } = props;

  const [groupByEffectNodes, setGroupByEffectNodes] = useState([]);

  const _getGroupByEffectNodes = useCallback(
    (rows) => {
      const groups = [];
      rows.forEach((row) => {
        const isExists = groups.findIndex((group) => group?.key === row.results);
        if (isExists === -1) {
          groups.push({
            key: row.results,
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
    (checked) => {
      testScenarioAnsCaseStorage.checkAllTestScenarios(checked);
      const newRows = testScenarioAnsCaseStorage.checkAllTestScenarios(checked, rows);
      _getGroupByEffectNodes(filterRows ?? newRows);

      setRows(newRows);
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
        updateGroupByEffectNodes={_getGroupByEffectNodes}
        updateRows={setRows}
        groupByEffectNodes={groupByEffectNodes}
        filterRows={filterRows}
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
