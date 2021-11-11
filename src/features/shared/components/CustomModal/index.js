import React from 'react';
import { render } from 'react-dom';
import CustomModal from './CustomModal';

let index = 0;

const _close = (modalId, containerId) => {
  const modalElement = document.getElementsByClassName(modalId)[0];
  if (modalElement) {
    document.body.removeChild(modalElement.parentNode);
  }

  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    document.body.removeChild(containerElement);
  }
};

export default function modal(props) {
  const modalId = `modal-item-${++index}`;
  const containerId = `modal-container-${index}`;
  // find and add container if
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.setAttribute('id', containerId);
    document.body.appendChild(container);
  }

  render(
    <CustomModal close={() => _close(modalId, containerId)} id={modalId} {...props} />,
    document.getElementById(containerId)
  );

  return () => {
    _close(modalId, containerId);
  };
}
