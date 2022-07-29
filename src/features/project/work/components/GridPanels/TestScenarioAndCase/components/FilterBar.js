import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Language from 'features/shared/languages/Language';
import { Button, Input, Label } from 'reactstrap';

const options = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' },
];

function FilterBar(props) {
  const { selectedOption, onChange } = props;

  return (
    <div className="d-flex justify-content-between m-2">
      <div className="d-flex justify-content-around align-items-center small filter-wrapper">
        <div className="auto-complete">
          <Select
            isMulti
            value={selectedOption}
            onChange={onChange}
            options={options}
            placeholder={Language.get('select')}
          />
        </div>
        <Input type="select" bsSize="sm" className="ml-2" style={{ minWidth: 66 }}>
          <option value="true">True</option>
          <option value="false">False</option>
        </Input>
        <div className="vertical-line d-flex ml-2" />
        <div className="ml-2 d-flex justify-content-center">
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="radio" name="inlineRadioOptions" value="option1" />
            <Label className="form-check-label">{Language.get('and')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="radio" name="inlineRadioOptions" value="option2" />
            <Label className="form-check-label">{Language.get('or')}</Label>
          </div>
        </div>
        <div className="vertical-line" />
        <div className="d-flex ml-2">
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="checkbox" value="option1" />
            <Label className="form-check-label">{Language.get('base')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="checkbox" value="option2" />
            <Label className="form-check-label">{Language.get('valid')}</Label>
          </div>
        </div>
      </div>
      <Button color="primary" size="sm">
        {Language.get('apply')}
      </Button>
    </div>
  );
}

FilterBar.propTypes = {
  selectedOption: PropTypes.oneOfType([PropTypes.object]).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default FilterBar;
