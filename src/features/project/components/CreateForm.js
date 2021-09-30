import Language from 'features/shared/languages/Language';
import PropTypes from 'prop-types';
import { React } from 'react';
import { useHistory } from 'react-router-dom';
import { ModalForm } from '../../shared/components';
import projectService from '../services/projectService';

export default function CreateForm({ isOpenModel, onToggleModal, onSuccess }) {
  const formSchema = {
    formTitle: Language.get('newproject'),
    submitBtnName: Language.get('save'),
    cancleBtnName: Language.get('cancel'),
    formSchema: [
      {
        inputProps: {
          label: Language.get('name'),
          id: 'name',
          name: 'name',
          placeholder: '',
          type: 'text',
          required: true,
          maxLength: 256,
        },
        fieldError: false,
        helperText: '',
      },
      {
        inputProps: {
          label: Language.get('description'),
          id: 'description',
          name: 'description',
          placeholder: '',
          type: 'textarea',
          rows: '3',
          required: true,
        },
      },
      {
        inputProps: {
          label: Language.get('version'),
          id: 'version',
          name: 'version',
          placeholder: '',
          type: 'text',
          required: true,
        },
      },
    ],
  };

  const history = useHistory();

  const _handleSubmit = async (values, { setErrors, setSubmitting }) => {
    const result = await projectService.createAsync(values);
    setSubmitting(false);
    if (result.data) {
      onSuccess(result.data);
      history.push(`/project/${result.data.projectId}/work/${result.data.workId}`);
    } else {
      const { message } = result.error.response.data;
      setErrors({
        _summary_: message,
      });
    }
  };

  return <ModalForm isOpen={isOpenModel} formData={formSchema} onToggle={onToggleModal} onSubmit={_handleSubmit} />;
}

CreateForm.defaultProps = {
  onSuccess: () => {},
};

CreateForm.propTypes = {
  isOpenModel: PropTypes.bool.isRequired,
  onToggleModal: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
