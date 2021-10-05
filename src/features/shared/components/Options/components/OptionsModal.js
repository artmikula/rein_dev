import CustomModal from 'features/shared/components/CustomModal/CustomModal';
import { OPTION_TYPE } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import optionService from 'features/shared/services/optionService';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { Button } from 'reactstrap';
import '../style.scss';
import OptionContainer from './OptionContainer';

const ref = React.createRef(null);

const SAVE_STATE = {
  NONE: 0,
  SAVING: 1,
  SAVE_SUCCESS: 2,
  SAVE_FAIL: 3,
};

export default function OptionsModal({ id, close, optionType }) {
  const [saveState, setSaveState] = useState(SAVE_STATE.NONE);

  let timeout;

  const _handleReset = () => {
    if (ref.current) {
      ref.current.reset();
    }
  };

  const _save = async () => {
    const option = ref.current.getData();

    const result = await optionService.update({ key: option.key, value: JSON.stringify(option.value) });
    if (result.error) {
      if (result.error.detail) {
        alert(result.error.detail, { title: result.error.title, error: true });
      } else {
        alert(result.error, { title: Language.get('error'), error: true });
      }
      return false;
    }

    Object.assign(appConfig, { [option.key]: option.value });
    return true;
  };

  const _handleSave = async () => {
    if (ref.current) {
      if (timeout) {
        clearTimeout(timeout);
      }

      setSaveState(SAVE_STATE.SAVING);
      const result = await _save();
      setSaveState(result ? SAVE_STATE.SAVE_SUCCESS : SAVE_STATE.SAVE_FAIL);

      timeout = setTimeout(() => {
        setSaveState(SAVE_STATE.NONE);
      }, 1500);
    }
  };

  useEffect(() => {
    return () => timeout && clearTimeout(timeout);
  });

  const actions = [
    <Button key={1} color="secondary" className="px-4" onClick={_handleReset} outline size="sm">
      {Language.get('reset')}
    </Button>,
    <Button key={2} color="primary" className="px-4" onClick={_handleSave} size="sm">
      {saveState === SAVE_STATE.SAVING && <div className="status-icon spinner-border mr-1" />}
      {saveState === SAVE_STATE.SAVE_SUCCESS && <i className="bi bi-check-circle mr-1" />}
      {saveState === SAVE_STATE.SAVE_FAIL && <i className="bi bi-x-circle mr-1 text-danger" />}
      {Language.get('save')}
    </Button>,
  ];

  return (
    <CustomModal
      id={id}
      close={close}
      title={Language.get('option')}
      content={<OptionContainer ref={ref} type={optionType} />}
      actions={actions}
      icon={<i className="bi bi-gear-fill" />}
    />
  );
}

OptionsModal.defaultProps = {
  optionType: OPTION_TYPE.GENERAL,
};

OptionsModal.propTypes = {
  id: PropTypes.string.isRequired,
  close: PropTypes.func.isRequired,
  optionType: PropTypes.oneOf(Object.values(OPTION_TYPE)),
};
