import Language from 'features/shared/languages/Language';
import PropTypes from 'prop-types';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { ModalForm } from '../../shared/components';
import projectService from '../services/projectService';

export default function ImportForm(props) {
  const { isOpenModel, onToggleModal } = props;
  const history = useHistory();

  const formSchema = {
    formTitle: Language.get('importproject'),
    submitBtnName: Language.get('save'),
    cancleBtnName: Language.get('cancel'),
    formSchema: [
      {
        inputProps: {
          label: '',
          id: 'project',
          name: 'project',
          placeholder: Language.get('choosefile'),
          type: 'file',
          required: true,
          accept: '.cetaprj',
        },
        helperText: Language.get('projectimportedfilesize'),
      },
    ],
  };

  const _handleSubmit = async (values, { setErrors, setSubmitting }) => {
    const form = new FormData();
    form.append('request.file', values?.projectList[0]);
    const result = await projectService.importAsync(form);
    setSubmitting(false);
    if (result.data) {
      history.push(`/projects`);
    } else {
      setErrors({
        _summary_: result.error.toString(),
      });
    }
  };

  return <ModalForm isOpen={isOpenModel} formData={formSchema} onToggle={onToggleModal} onSubmit={_handleSubmit} />;
}
ImportForm.propTypes = {
  isOpenModel: PropTypes.bool.isRequired,
  onToggleModal: PropTypes.func.isRequired,
};
