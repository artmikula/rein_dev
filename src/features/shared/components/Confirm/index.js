import React from 'react';
import { render } from 'react-dom';
import ConfirmComponent from './ConfirmComponent';

let index = 0;

const _close = (confirmId, containerId) => {
  const confirmElement = document.getElementsByClassName(confirmId)[0];
  if (confirmElement) {
    document.body.removeChild(confirmElement.parentNode);
  }

  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    document.body.removeChild(containerElement);
  }
};

export default function confirm(content, options = {}) {
  const confirmId = `confirm-item-${++index}`;
  const containerId = `confirm-container-${index}`;
  // find and add container if
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.setAttribute('id', containerId);
    document.body.appendChild(container);
  }

  const _handleYes = (e) => {
    if (typeof options.yesAction === 'function') {
      options.yesAction(e);
    }
    _close(confirmId, containerId);
  };

  const _handleNo = (e) => {
    if (typeof options.noAction === 'function') {
      options.noAction(e);
    }
    _close(confirmId, containerId);
  };

  render(
    <ConfirmComponent {...options} id={confirmId} content={content} yesAction={_handleYes} noAction={_handleNo} />,
    document.getElementById(containerId)
  );

  return () => {
    _close(confirmId, containerId);
  };
}
