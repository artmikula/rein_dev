import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Language from 'features/shared/languages/Language';
import { Button, Input, Label } from 'reactstrap';
import { OPERATOR_TYPE, RESULT_TYPE, TEST_SCENARIO_TYPES } from 'features/shared/constants';

const defaultOptions = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' },
];

const defaultFilterOptions = {
  effectNodes: null,
  results: undefined,
  resultType: undefined,
  isBaseScenario: undefined,
  isValid: undefined,
  targetType: undefined,
};

function FilterBar(props) {
  const { onChangeFilter, effectNodes } = props;

  const [filterOptions, setFilterOptions] = React.useState(defaultFilterOptions);

  const _onResetFilter = () => {
    document.getElementById('base-checkbox').checked = false;
    document.getElementById('valid-checkbox').checked = false;
    setFilterOptions({ ...filterOptions, effectNodes: null });
    document.getElementById('result-type-selection').value = RESULT_TYPE.True;
    document.getElementById('target-type-and').checked = false;
    document.getElementById('target-type-or').checked = false;
    onChangeFilter(defaultFilterOptions, 'reset');
  };

  return (
    <div className="d-flex justify-content-between m-2">
      <div className="d-flex justify-content-around align-items-center small filter-wrapper">
        <div className="auto-complete">
          <Select
            isMulti
            value={filterOptions.effectNodes}
            onChange={(values) => setFilterOptions({ ...filterOptions, effectNodes: values })}
            options={effectNodes.length > 0 ? effectNodes : defaultOptions}
            placeholder={Language.get('select')}
          />
        </div>

        <Input
          id="result-type-selection"
          type="select"
          bsSize="sm"
          className="ml-2"
          style={{ minWidth: 66 }}
          onChange={(e) => setFilterOptions((prevState) => ({ ...prevState, resultType: e.target.value }))}
        >
          <option value={RESULT_TYPE.True}>{RESULT_TYPE.True}</option>
          <option value={RESULT_TYPE.False}>{RESULT_TYPE.False}</option>
        </Input>

        <div className="vertical-line d-flex ml-2" />
        <div className="ml-2 d-flex justify-content-center">
          <div className="form-check form-check-inline">
            <input
              id="target-type-and"
              className="form-check-input"
              onChange={(e) => setFilterOptions((prevState) => ({ ...prevState, targetType: e.target.value }))}
              type="radio"
              name="inlineRadioOptions"
              value={OPERATOR_TYPE.AND}
            />
            <Label className="form-check-label">{Language.get('and')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input
              id="target-type-or"
              className="form-check-input"
              onChange={(e) => setFilterOptions((prevState) => ({ ...prevState, targetType: e.target.value }))}
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
              id="base-checkbox"
              className="form-check-input"
              type="checkbox"
              value={TEST_SCENARIO_TYPES.BASE}
              onChange={(e) =>
                setFilterOptions((prevState) => ({
                  ...prevState,
                  isBaseScenario: e.target.checked,
                }))
              }
            />
            <Label className="form-check-label">{Language.get('base')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input
              id="valid-checkbox"
              className="form-check-input"
              onChange={(e) =>
                setFilterOptions((prevState) => ({
                  ...prevState,
                  isValid: e.target.checked,
                }))
              }
              type="checkbox"
              value={TEST_SCENARIO_TYPES.VALID}
            />
            <Label className="form-check-label">{Language.get('valid')}</Label>
          </div>
        </div>
      </div>

      <Button color="primary" size="sm" className="mr-2" onClick={() => onChangeFilter(filterOptions)}>
        {Language.get('apply')}
      </Button>
      <Button color="primary" size="sm" onClick={_onResetFilter}>
        Reset
      </Button>
    </div>
  );
}

FilterBar.propTypes = {
  onChangeFilter: PropTypes.func.isRequired,
  effectNodes: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
};

FilterBar.defaultProps = {
  effectNodes: [],
};

export default FilterBar;
