import PropTypes from 'prop-types';
import React from 'react';
import { UncontrolledTooltip } from 'reactstrap';

function IconButton({ id, tooltip, onClick, iconClassName, disabled }) {
  return (
    <>
      <button
        className="border-0 outline-0 float-right bg-transparent"
        type="button"
        disabled={disabled}
        onClick={onClick}
      >
        <i className={`${disabled ? '' : 'icon-btn'} ${iconClassName}`} id={id} />
      </button>
      {!disabled && (
        <UncontrolledTooltip placement="left" target={id}>
          <small>{tooltip}</small>
        </UncontrolledTooltip>
      )}
    </>
  );
}

IconButton.propTypes = {
  iconClassName: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  tooltip: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default IconButton;
