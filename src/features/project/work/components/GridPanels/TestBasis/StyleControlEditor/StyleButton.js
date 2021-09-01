import React from 'react';
import PropTypes from 'prop-types';

export default function StyleButton(props) {
  const { onToggle, style, active, label } = props;

  const _onToggle = (e) => {
    e.preventDefault();
    onToggle(style);
  };

  let className = 'text-muted';
  if (active) {
    className = 'font-weight-bold text-primary';
  }

  return (
    <small className={`cursor-pointer btn-link px-1 ${className}`} onMouseDown={_onToggle} role="button" tabIndex={0}>
      {label}
    </small>
  );
}
StyleButton.propTypes = {
  active: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  style: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
};
