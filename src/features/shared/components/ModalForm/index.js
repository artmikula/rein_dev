import React from 'react';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import {
  Button,
  FormGroup,
  FormText,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  UncontrolledTooltip,
} from 'reactstrap';
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { MAX_PROJECT_FILE_SIZE } from '../../constants';
import Language from '../../languages/Language';
import InputComponent from './InputComponent';

export default function ModalForm(props) {
  let initialValues = {};
  let validationSchema = {};

  const { isOpen, isClickOutToggle, isCancel, formData, onToggle } = props;

  const _initFormValue = (formSchema) => {
    const _initialValues = {};
    formSchema.forEach((field) => {
      _initialValues[field.inputProps.name] = field.initialValue ?? '';
    });
    return _initialValues;
  };

  const _initValidationSchema = (formSchema) => {
    const _validationSchema = {};
    formSchema.forEach((field) => {
      const { type, name, required, maxLength } = field.inputProps;
      switch (type) {
        case 'text':
          _validationSchema[name] = maxLength ? Yup.string().max(maxLength) : Yup.string();
          break;
        case 'email':
          _validationSchema[name] = maxLength ? Yup.string().email().max(maxLength) : Yup.string().email();
          break;
        case 'file':
          _validationSchema[name] = Yup.mixed().test('fileSize', 'File size is too large', () => {
            const { files } = document.getElementById(field.inputProps.id);
            if (files) {
              if (files[0]?.size > MAX_PROJECT_FILE_SIZE) {
                return false;
              }
            }
            return true;
          });
          break;
        default:
          _validationSchema[name] = Yup.string();
          break;
      }
      if (_validationSchema[name] && required) {
        _validationSchema[name] = _validationSchema[name].required();
      }
    });
    return Yup.object().shape({ ..._validationSchema });
  };

  const _handleSubmit = (values, formProps) => {
    const { setSubmitting } = formProps;
    const { onSubmit } = props;

    setSubmitting(true);
    onSubmit(values, formProps);
  };

  const { formSchema } = formData;
  if (formSchema && formSchema.length) {
    initialValues = _initFormValue(formSchema);
    validationSchema = _initValidationSchema(formSchema);
  }
  const closeBtn = (
    <button className="btn-primary close p-1" id="closeBtn" onClick={onToggle} type="button">
      <i className="bi bi-x" />
    </button>
  );

  return (
    <Modal className="modal-dialog-centered" isOpen={isOpen} toggle={isClickOutToggle ? onToggle : undefined}>
      <ModalHeader toggle={onToggle} close={closeBtn}>
        {formData?.formTitle}
      </ModalHeader>
      <UncontrolledTooltip target="closeBtn" placement="bottom">
        <small>{Language.get('close')}</small>
      </UncontrolledTooltip>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        onSubmit={_handleSubmit}
        validationSchema={validationSchema}
      >
        {(formProps) => {
          const { errors, touched, isSubmitting } = formProps;
          const isError = (field) => touched[field] && Boolean(errors[field]);
          return (
            <Form>
              <ModalBody>
                {formData?.formSchema?.map((field, index) => {
                  const { inputProps, helperText, fieldError } = field;
                  return (
                    <FormGroup key={index}>
                      <Field component={InputComponent} {...inputProps} invalid={isError(inputProps.name)} />
                      {helperText && <FormText color="muted">{helperText}</FormText>}
                      {fieldError && <ErrorMessage className="small text-danger" name={inputProps.name} />}
                    </FormGroup>
                  );
                })}
                <p className="small text-danger">{errors?._summary_}</p>
                <div className="d-flex justify-content-end">
                  <Button type="submit" color="primary" size="sm" disabled={isSubmitting} className="px-4">
                    {isSubmitting && <Spinner style={{ fontSize: 2 }} size="sm" color="light" className="mr-2" />}
                    {formData?.submitBtnName}
                  </Button>
                  {isCancel && (
                    <Button color="secondary" size="sm" className="ml-2 px4" onClick={onToggle} outline>
                      {formData?.cancelBtnName}
                    </Button>
                  )}
                </div>
              </ModalBody>
              {formData?.footerContent && (
                <ModalFooter>
                  <small className="text-muted">{formData?.footerContent}</small>
                </ModalFooter>
              )}
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
}

ModalForm.propTypes = {
  isCancel: PropTypes.bool,
  isClickOutToggle: PropTypes.bool,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    formSchema: PropTypes.arrayOf(PropTypes.shape({})),
    formTitle: PropTypes.string,
    submitBtnName: PropTypes.string,
    cancelBtnName: PropTypes.string,
    footerContent: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
};

ModalForm.defaultProps = {
  isCancel: false,
  isClickOutToggle: false,
};
