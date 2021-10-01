import Language from 'features/shared/languages/Language';
import PropTypes from 'prop-types';
import React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { ModalForm } from '../../../shared/components';
import workService from '../services/workService';

export default function CreateForm(props) {
  const { isOpenModel, onToggleModal } = props;
  const history = useHistory();
  const { projectId } = useParams();

  const formSchema = {
    formTitle: Language.get('newwork'),
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

  const _handleSubmit = async (values, { setErrors, setSubmitting }) => {
    const result = await workService.createAsync(projectId, values);
    setSubmitting(false);
    if (result.data) {
      history.push(`/project/${projectId}/work/${result.data}`);
      onToggleModal(projectId, result.data);
    } else {
      const { Name } = result.error;
      const errorMessage = Name.join(' ');
      setErrors({
        _summary_: errorMessage,
      });
    }
  };

  return <ModalForm isOpen={isOpenModel} formData={formSchema} onToggle={onToggleModal} onSubmit={_handleSubmit} />;
}
CreateForm.propTypes = {
  isOpenModel: PropTypes.bool.isRequired,
  onToggleModal: PropTypes.func.isRequired,
};
