import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Language from 'features/shared/languages/Language';
import { Button, Input, Label } from 'reactstrap';
import { OPERATOR_TYPE, RESULT_TYPE } from 'features/shared/constants';
import { sortByString } from 'features/shared/lib/utils';

function FilterBar(props) {
  const { resetFilter, setFilterOptions, submitFilter, rows, filterOptions } = props;

  const { causeNodes, resultType, sourceTargetType, isBaseScenario, isValid } = filterOptions;

  const _getCauseNodes = React.useMemo(() => {
    const _testAssertions = rows.map((row) => row.testAssertions).flat();
    const _causeNodes = sortByString(
      _testAssertions
        .filter(
          (testAssertion, index, array) =>
            array.findIndex((arr) => arr?.graphNodeId === testAssertion?.graphNodeId) === index
        )
        .map((testAssertion) => ({
          value: testAssertion?.graphNodeId ?? '',
          label: `${testAssertion.nodeId}: ${testAssertion.definition}` ?? '',
        })),
      'label'
    );
    return _causeNodes;
  }, [rows]);

  return (
    <div className="d-flex m-2">
      <div className="d-flex justify-content-around align-items-center small filter-wrapper">
        <div className="auto-complete">
          <Select
            isMulti
            value={causeNodes ?? null}
            onChange={(values) => setFilterOptions({ causeNodes: values })}
            options={_getCauseNodes?.length > 0 ? _getCauseNodes : []}
            placeholder={Language.get('select')}
          />
        </div>

        <Input
          value={resultType}
          type="select"
          bsSize="sm"
          className="ml-2"
          style={{ minWidth: 66, fontSize: 'inherit' }}
          disabled={causeNodes === null || causeNodes?.length === 0}
          onChange={(e) => setFilterOptions({ resultType: e.target.value })}
        >
          <option value={RESULT_TYPE.All}>{RESULT_TYPE.All}</option>
          <option value={RESULT_TYPE.True}>{RESULT_TYPE.True}</option>
          <option value={RESULT_TYPE.False}>{RESULT_TYPE.False}</option>
        </Input>

        <div className="vertical-line d-flex ml-2" />
        <div className="ml-2 d-flex justify-content-center">
          <div className="form-check form-check-inline">
            <input
              checked={sourceTargetType === OPERATOR_TYPE.AND}
              className="form-check-input"
              onChange={(e) => setFilterOptions({ sourceTargetType: e.target.value })}
              type="radio"
              name="inlineRadioOptions"
              value={OPERATOR_TYPE.AND}
            />
            <Label className="form-check-label">{Language.get('and')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input
              checked={sourceTargetType === OPERATOR_TYPE.OR}
              className="form-check-input"
              onChange={(e) => setFilterOptions({ sourceTargetType: e.target.value })}
              type="radio"
              name="inlineRadioOptions"
              value={OPERATOR_TYPE.OR}
            />
            <Label className="form-check-label">{Language.get('or')}</Label>
          </div>
        </div>

        <div className="vertical-line" />
        <div className="d-flex ml-2">
          <div className="form-check form-check-inline">
            <input
              type="checkbox"
              checked={isBaseScenario ?? false}
              className="form-check-input"
              onChange={(e) => setFilterOptions({ isBaseScenario: e.target.checked })}
            />
            <Label className="form-check-label">{Language.get('base')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input
              type="checkbox"
              checked={isValid ?? false}
              className="form-check-input"
              onChange={(e) => setFilterOptions({ isValid: e.target.checked })}
            />
            <Label className="form-check-label">{Language.get('valid')}</Label>
          </div>
        </div>
      </div>

      <Button color="primary" size="sm" className="filter-button" style={{ marginRight: 10 }} onClick={submitFilter}>
        {Language.get('apply')}
      </Button>
      <Button color="primary" size="sm" className="filter-button" onClick={resetFilter}>
        Reset
      </Button>
    </div>
  );
}

FilterBar.propTypes = {
  filterOptions: PropTypes.shape({
    causeNodes: PropTypes.oneOfType([PropTypes.array]),
    sourceTargetType: PropTypes.string,
    resultType: PropTypes.string,
    isBaseScenario: PropTypes.bool,
    isValid: PropTypes.bool,
  }).isRequired,
  resetFilter: PropTypes.func.isRequired,
  setFilterOptions: PropTypes.func.isRequired,
  submitFilter: PropTypes.func.isRequired,
  rows: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
};

FilterBar.defaultProps = {
  rows: [],
};

export default FilterBar;
