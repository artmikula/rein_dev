import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Language from 'features/shared/languages/Language';
import { Button, Input, Label } from 'reactstrap';
import { OPERATOR_TYPE, RESULT_TYPE } from 'features/shared/constants';

function FilterBar(props) {
  const { resetFilter, setFilterOptions, submitFilter, effectNodes } = props;

  const [filter, setFilter] = React.useState({
    effectNodes: undefined,
    resultType: RESULT_TYPE.True,
    targetType: undefined,
    isBaseScenario: undefined,
    isValid: undefined,
  });

  const _onResetFilter = useCallback(() => {
    setFilter({
      effectNodes: undefined,
      resultType: RESULT_TYPE.True,
      targetType: undefined,
      isBaseScenario: undefined,
      isValid: undefined,
    });
    resetFilter(filter);
  }, [filter]);

  const _onChangeFilter = useCallback(
    (values) => {
      setFilterOptions(values);
      setFilter((prevState) => ({ ...prevState, ...values }));
    },
    [filter]
  );

  return (
    <div className="d-flex m-2">
      <div className="d-flex justify-content-around align-items-center small filter-wrapper">
        <div className="auto-complete">
          <Select
            isMulti
            value={filter.effectNodes ?? null}
            onChange={(values) => _onChangeFilter({ effectNodes: values })}
            options={effectNodes.length > 0 ? effectNodes : []}
            placeholder={Language.get('select')}
          />
        </div>

        <Input
          value={filter.resultType}
          type="select"
          bsSize="sm"
          className="ml-2"
          style={{ minWidth: 66 }}
          onChange={(e) => _onChangeFilter({ resultType: e.target.value })}
        >
          <option value={RESULT_TYPE.True}>{RESULT_TYPE.True}</option>
          <option value={RESULT_TYPE.False}>{RESULT_TYPE.False}</option>
        </Input>

        <div className="vertical-line d-flex ml-2" />
        <div className="ml-2 d-flex justify-content-center">
          <div className="form-check form-check-inline">
            <input
              checked={filter.targetType === OPERATOR_TYPE.AND}
              className="form-check-input"
              onChange={(e) => _onChangeFilter({ targetType: e.target.value })}
              type="radio"
              name="inlineRadioOptions"
              value={OPERATOR_TYPE.AND}
            />
            <Label className="form-check-label">{Language.get('and')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input
              checked={filter.targetType === OPERATOR_TYPE.OR}
              className="form-check-input"
              onChange={(e) => _onChangeFilter({ targetType: e.target.value })}
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
              checked={filter.isBaseScenario ?? false}
              className="form-check-input"
              onChange={(e) => _onChangeFilter({ isBaseScenario: e.target.checked })}
            />
            <Label className="form-check-label">{Language.get('base')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input
              type="checkbox"
              checked={filter.isValid ?? false}
              className="form-check-input"
              onChange={(e) => _onChangeFilter({ isValid: e.target.checked })}
            />
            <Label className="form-check-label">{Language.get('valid')}</Label>
          </div>
        </div>
      </div>

      <Button color="primary" size="sm" className="mr-2" onClick={() => submitFilter(filter)}>
        {Language.get('apply')}
      </Button>
      <Button color="primary" size="sm" onClick={_onResetFilter}>
        Reset
      </Button>
    </div>
  );
}

FilterBar.propTypes = {
  resetFilter: PropTypes.func.isRequired,
  setFilterOptions: PropTypes.func.isRequired,
  submitFilter: PropTypes.func.isRequired,
  effectNodes: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
};

FilterBar.defaultProps = {
  effectNodes: [],
};

export default FilterBar;
