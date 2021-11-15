import PropTypes from 'prop-types';
import React from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

export default function ListItem({ value, label, selected, onSelect }) {
  const handleCheck = (e) => onSelect(value, e.target.checked);

  return (
    <FormGroup check>
      <Input type="checkbox" checked={selected} onChange={handleCheck} id={value} />
      <Label check htmlFor={value}>
        {label}
      </Label>
    </FormGroup>
  );
}

ListItem.defaultProps = {
  onSelect: () => {},
  selected: false,
};

ListItem.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
};
