import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Language from 'features/shared/languages/Language';
import { Button, Input, Label } from 'reactstrap';
import { OPERATOR_TYPE, RESULT_TYPE, TEST_SCENARIO_TYPES } from 'features/shared/constants';

function FilterBar(props) {
  const { resetFilter, onChangeFilter, submitFilter, effectNodes, filterOptions } = props;

  const resultTypeFilter = useRef(null);
  const isBaseScenarioFilter = useRef(null);
  const isValidFilter = useRef(null);
  const orTypeFilter = useRef(null);
  const andTypeFilter = useRef(null);

  const _onResetFilter = () => {
    isBaseScenarioFilter.current.checked = false;
    isValidFilter.current.checked = false;
    resultTypeFilter.current.value = RESULT_TYPE.True;
    andTypeFilter.current.checked = false;
    orTypeFilter.current.checked = false;
    resetFilter();
  };

  return (
    <div className="d-flex m-2">
      <div className="d-flex justify-content-around align-items-center small filter-wrapper">
        <div className="auto-complete">
          <Select
            isMulti
            value={filterOptions.effectNodes ?? null}
            onChange={(values) => onChangeFilter({ effectNodes: values })}
            options={effectNodes.length > 0 ? effectNodes : []}
            placeholder={Language.get('select')}
          />
        </div>

        <Input
          ref={resultTypeFilter}
          type="select"
          bsSize="sm"
          className="ml-2"
          style={{ minWidth: 66 }}
          onChange={(e) => onChangeFilter({ resultType: e.target.value })}
        >
          <option value={RESULT_TYPE.True}>{RESULT_TYPE.True}</option>
          <option value={RESULT_TYPE.False}>{RESULT_TYPE.False}</option>
        </Input>

        <div className="vertical-line d-flex ml-2" />
        <div className="ml-2 d-flex justify-content-center">
          <div className="form-check form-check-inline">
            <input
              ref={andTypeFilter}
              className="form-check-input"
              onChange={(e) => onChangeFilter({ targetType: e.target.value })}
              type="radio"
              name="inlineRadioOptions"
              value={OPERATOR_TYPE.AND}
            />
            <Label className="form-check-label">{Language.get('and')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input
              ref={orTypeFilter}
              className="form-check-input"
              onChange={(e) => onChangeFilter({ targetType: e.target.value })}
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
              ref={isBaseScenarioFilter}
              className="form-check-input"
              type="checkbox"
              value={TEST_SCENARIO_TYPES.BASE}
              onChange={(e) => onChangeFilter({ isBaseScenario: e.target.checked })}
            />
            <Label className="form-check-label">{Language.get('base')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input
              ref={isValidFilter}
              className="form-check-input"
              onChange={(e) => onChangeFilter({ isValid: e.target.checked })}
              type="checkbox"
              value={TEST_SCENARIO_TYPES.VALID}
            />
            <Label className="form-check-label">{Language.get('valid')}</Label>
          </div>
        </div>
      </div>

      <Button color="primary" size="sm" className="mr-2" onClick={() => submitFilter(filterOptions)}>
        {Language.get('apply')}
      </Button>
      <Button color="primary" size="sm" onClick={_onResetFilter}>
        Reset
      </Button>
    </div>
  );
}

FilterBar.propTypes = {
  filterOptions: PropTypes.oneOfType([PropTypes.object]).isRequired,
  resetFilter: PropTypes.func.isRequired,
  onChangeFilter: PropTypes.func.isRequired,
  submitFilter: PropTypes.func.isRequired,
  effectNodes: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
};

FilterBar.defaultProps = {
  effectNodes: [],
};

export default FilterBar;
