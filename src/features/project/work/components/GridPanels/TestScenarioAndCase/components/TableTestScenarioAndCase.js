import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'reactstrap';
import { useSelector } from 'react-redux';

import appConfig from 'features/shared/lib/appConfig';
import { FILTER_TYPE, GENERATE_STATUS, RESULT_TYPE } from 'features/shared/constants';
import TestScenarioHelper from 'features/project/work/biz/TestScenario/TestScenarioHelper';
import Language from 'features/shared/languages/Language';
import Header from './TableHeader';
import TableRow from './TableRow';

function TableTestScenarioAndCase(props) {
  const { filterOptions } = props;

  const [filterData, setFilterData] = useState(undefined);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [isCheckAll, setIsCheckAll] = useState(false);

  const { dbContext, generating, graph } = useSelector((state) => state.work);

  const { testScenarioAndCase: config } = appConfig;

  const _getData = async () => {
    if (dbContext && dbContext.db) {
      try {
        const { testScenarioSet, testCaseSet } = dbContext;
        const testScenarios = await testScenarioSet.get();

        const promises = testScenarios.map(async (testScenario) => {
          const _testScenario = {};
          _testScenario.id = testScenario.id;
          _testScenario.testCases = await testCaseSet.db
            .select()
            .from(testCaseSet.table)
            .limit(config.testCasePageSize)
            .skip(0)
            .where(testCaseSet.table.testScenarioId.eq(testScenario.id))
            .exec();

          _testScenario.total = await testCaseSet.totalTestCases(testScenario.id);
          _testScenario.page = 0;
          return _testScenario;
        });

        const data = await Promise.all(promises);
        const columns = TestScenarioHelper.convertToColumns(graph.graphNodes, Language);
        return {
          rows: TestScenarioHelper.convertToRows(data, testScenarios, columns, graph.graphNodes),
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

  const _isCheckedAllTestScenarios = (newRows = undefined) => {
    const _newRows = newRows ?? rows;
    if (_newRows.length > 0) {
      const isCheckAll = _newRows.every(
        (row) => row.isSelected || row.testCases.every((testCase) => testCase.isSelected)
      );
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

  useEffect(async () => {
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

        await testScenarioSet.update('isSelected', checked);
        await testCaseSet.update('isSelected', checked);
      }
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
      <TableRow rows={rows} filterRows={filterData} columns={columns} isCheckAll={_isCheckedAllTestScenarios} />
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
