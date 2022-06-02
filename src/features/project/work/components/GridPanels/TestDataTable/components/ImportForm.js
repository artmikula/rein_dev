import testDataService from 'features/project/work/services/testDataService';
import PropTypes from 'prop-types';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { ModalForm } from '../../../../../../shared/components';

const formSchema = {
  formTitle: 'Import Test Data',
  submitBtnName: 'Save',
  cancleBtnName: 'Cancel',
  formSchema: [
    {
      inputProps: {
        label: '',
        id: 'testData',
        name: 'testData',
        placeholder: '',
        type: 'file',
        required: true,
        accept: '.csv',
      },
      helperText: 'File size should be less than 2MB.',
    },
  ],
};

export default function ImportForm({ isOpenModel, onToggleModal, projectId, workId }) {
  const history = useHistory();

  const _handleSubmit = async (values, { setErrors, setSubmitting }) => {
    const form = new FormData();
    form.append('file', values?.testDataList[0]);
    const result = await testDataService.importAsync(projectId, workId, form);
    setSubmitting(false);
    if (result.error) {
      setErrors({
        _summary_: result.error.toString(),
      });
    } else {
      history.push(`/project/${projectId}/work/${workId}`);
      onToggleModal();
    }
  };

  return <ModalForm isOpen={isOpenModel} formData={formSchema} onToggle={onToggleModal} onSubmit={_handleSubmit} />;
}
ImportForm.propTypes = {
  isOpenModel: PropTypes.bool.isRequired,
  onToggleModal: PropTypes.func.isRequired,
  projectId: PropTypes.string.isRequired,
  workId: PropTypes.string.isRequired,
};
