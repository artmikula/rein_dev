import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import PropTypes from 'prop-types';

export default function CustomModal({ title, content, actions, id, icon, close }) {
  const closeBtn = (
    <button className="btn-primary close p-1" id="closeBtn" onClick={() => close()} type="button">
      <i className="bi bi-x" />
    </button>
  );
  return (
    <Modal isOpen wrapClassName={id} centered backdrop size="lg">
      <ModalHeader close={closeBtn} className="confirm-modal-header">
        {icon && (
          // eslint-disable-next-line max-len
          <span className="d-inline-flex justify-content-center align-items-center icon-container rounded-circle mr-2 my-2">
            {icon}
          </span>
        )}
        <span>{title}</span>
      </ModalHeader>
      <ModalBody className="p-0">{content}</ModalBody>
      {actions && <ModalFooter>{actions}</ModalFooter>}
    </Modal>
  );
}

CustomModal.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  actions: PropTypes.arrayOf(PropTypes.node),
  id: PropTypes.string.isRequired,
  close: PropTypes.func.isRequired,
  icon: PropTypes.node,
};

CustomModal.defaultProps = {
  actions: [],
  icon: undefined,
};
