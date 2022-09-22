import React from 'react';
import { render } from 'react-dom';
import Alert from './AlertComponent';

let index = 0;

const _close = (alertId, containerId) => {
  const alertElement = document.getElementsByClassName(alertId)[0];
  if (alertElement) {
    document.body.removeChild(alertElement.parentNode);
  }

  const containerElement = document.getElementById(containerId);
  if (containerElement) {
    document.body.removeChild(containerElement);
  }
};

export default function alert(content, options = {}) {
  const alertId = `alert-item-${++index}`;
  const containerId = `alert-container-${index}`;
  // find and add container if
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.setAttribute('id', containerId);
    document.body.appendChild(container);
  }

  const _handleClose = (e) => {
    if (typeof options.onClose === 'function') {
      options.onClose(e);
    }
    _close(alertId, containerId);
  };

  render(
    <Alert
      {...options}
      id={alertId}
      content={content}
      onClose={_handleClose}
      onCloseDialog={() => _close(alertId, containerId)}
    />,
    document.getElementById(containerId)
  );

  return () => {
    _close(alertId, containerId);
  };
}
