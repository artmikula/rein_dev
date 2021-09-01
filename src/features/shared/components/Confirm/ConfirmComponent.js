import React from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import PropTypes from 'prop-types';
import Language from '../../languages/Language';
import './style.scss';

export default function ConfirmComponent({ id, icon, title, content, yesAction, noAction, yesText, noText }) {
  return (
    <Modal centered backdrop isOpen wrapClassName={id}>
      {title && (
        <ModalHeader className="confirm-modal-header px-3 py-2 font-weight-bold">
          {icon && (
            <span className="d-flex justify-content-center align-items-center icon-container rounded-circle mr-2">
              {icon}
            </span>
          )}
          <span>{Language.get(title)}</span>
        </ModalHeader>
      )}
      <ModalBody>{Language.get(content)}</ModalBody>
      <ModalFooter className="border-0">
        <Button color="primary " className="px-4" onClick={yesAction} size="sm">
          {Language.get(yesText)}
        </Button>
        <Button color="secondary" className="ml-2 px-4" onClick={noAction} outline size="sm">
          {Language.get(noText)}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

ConfirmComponent.propTypes = {
  title: PropTypes.string,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  yesText: PropTypes.string,
  noText: PropTypes.string,
  yesAction: PropTypes.func.isRequired,
  noAction: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  icon: PropTypes.node,
};

ConfirmComponent.defaultProps = {
  title: Language.get('warning'),
  content: Language.get('areyousureyouwanttocontinue'),
  yesText: Language.get('yes'),
  noText: Language.get('no'),
  icon: undefined,
};
