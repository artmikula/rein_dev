import Language from 'features/shared/languages/Language';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import GlobalContext from 'security/GlobalContext';
import { ModalForm } from '../../../shared/components';
import workService from '../services/workService';

const formSchema = {
  formTitle: Language.get('importwork'),
  submitBtnName: Language.get('save'),
  cancleBtnName: Language.get('cancel'),
  formSchema: [
    {
      inputProps: {
        label: '',
        id: 'work',
        name: 'work',
        placeholder: '',
        type: 'file',
        required: true,
        accept: '.cetawrk',
      },
      helperText: Language.get('projectimportedfilesize'),
    },
  ],
};

export default function ImportForm({ isOpenModel, onToggleModal, projectId }) {
  const history = useHistory();
  const { getToken } = useContext(GlobalContext);

  const _handleSubmit = async (values, { setErrors, setSubmitting }) => {
    const form = new FormData();
    form.append('request.file', values?.workList[0]);
    const result = await workService.importAsync(getToken(), projectId, form);
    setSubmitting(false);
    if (result.data) {
      history.push(`/project/${projectId}/work/${result.data}`);
      onToggleModal();
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
  projectId: PropTypes.string.isRequired,
};
