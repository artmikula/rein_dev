import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Input, Label } from 'reactstrap';

function TableCheckbox(props) {
  const { checked, onChange, labelRenderer } = props;
  return (
    <FormGroup check>
      <Label check>
        <Input type="checkbox" className="mt-1" onChange={onChange} checked={checked} />
        {labelRenderer}
      </Label>
    </FormGroup>
  );
}

TableCheckbox.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  labelRenderer: PropTypes.node,
};

TableCheckbox.defaultProps = {
  labelRenderer: null,
};

export default React.memo(TableCheckbox);
