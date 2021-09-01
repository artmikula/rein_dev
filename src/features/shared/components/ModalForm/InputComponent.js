import React from 'react';
import PropTypes from 'prop-types';
import { Label, Input, CustomInput } from 'reactstrap';
import Language from 'features/shared/languages/Language';
import { STRING } from '../../constants';

export default function InputComponent({ field, form: { setFieldValue }, ...props }) {
  const { name } = field;
  const { type, label, invalid } = props;
  switch (type) {
    case 'checkbox':
    case 'radio':
    case 'switch':
      return <CustomInput {...field} {...props} />;
    case 'file':
      return (
        <CustomInput
          {...field}
          {...props}
          className={invalid ? 'is-invalid' : ''}
          onChange={(event) => {
            const { value, files } = event.currentTarget;
            setFieldValue(name, value);
            setFieldValue(name + STRING.FILE_NAME_LIST, files);
          }}
        />
      );
    default:
      return (
        <>
          <Label>{Language.get(label)}</Label>
          <Input {...field} {...props} />
        </>
      );
  }
}

InputComponent.defaultProps = {
  invalid: false,
};

InputComponent.propTypes = {
  field: PropTypes.shape({ name: PropTypes.string.isRequired }).isRequired,
  form: PropTypes.shape({ setFieldValue: PropTypes.func.isRequired }).isRequired,
  invalid: PropTypes.bool,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
};
