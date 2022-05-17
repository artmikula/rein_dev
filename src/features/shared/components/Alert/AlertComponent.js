import PropTypes from 'prop-types';
import React from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import Language from '../../languages/Language';
import './style.scss';

export default function Alert({ id, title, content, iconClassName, actionText, onClose, error, warning, info }) {
  let _iconClassName = iconClassName;
  if (!_iconClassName) {
    _iconClassName = 'bi bi-exclamation-octagon';
    _iconClassName = warning ? 'bi bi-exclamation-triangle' : _iconClassName;
    _iconClassName = error ? 'bi bi-exclamation-circle' : _iconClassName;
  }

  let _title = title;
  if (!_title) {
    if (error) {
      _title = Language.get('error');
    } else if (warning) {
      _title = Language.get('warning');
    } else if (info) {
      _title = Language.get('info');
    }
  }

  return (
    <Modal centered backdrop isOpen wrapClassName={id} className="alert-modal">
      <ModalHeader className="px-3 py-2">
        {_iconClassName && <i className={`${_iconClassName} mr-2`} />}
        {_title}
      </ModalHeader>
      <ModalBody>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </ModalBody>
      <ModalFooter className="border-0">
        <Button color="primary" className="px-4" onClick={onClose} outline size="sm">
          {Language.get(actionText)}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

Alert.defaultProps = {
  title: undefined,
  iconClassName: undefined,
  actionText: 'OK',
  error: false,
  warning: false,
  info: true,
};

Alert.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string,
  content: PropTypes.string.isRequired,
  iconClassName: PropTypes.string,
  actionText: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  error: PropTypes.bool,
  warning: PropTypes.bool,
  info: PropTypes.bool,
};
