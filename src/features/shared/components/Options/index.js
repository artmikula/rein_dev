import React from 'react';
import { render } from 'react-dom';
import OptionModal from './components/OptionsModal';

let index = 0;

const _close = (modalId, containerId) => {
  const alertElement = document.getElementsByClassName(modalId)[0].parentNode;
  document.body.removeChild(alertElement);
  const containerElement = document.getElementById(containerId);
  document.body.removeChild(containerElement);
};

export default function modal(props) {
  const modalId = `option-item-${++index}`;
  const containerId = `option-container-${index}`;
  // find and add container if
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.setAttribute('id', containerId);
    document.body.appendChild(container);
  }

  render(
    <OptionModal close={() => _close(modalId, containerId)} id={modalId} {...props} />,
    document.getElementById(containerId)
  );

  return () => {
    _close(modalId, containerId);
  };
}
