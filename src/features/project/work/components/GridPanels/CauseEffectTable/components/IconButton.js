import PropTypes from 'prop-types';
import React from 'react';
import { UncontrolledTooltip } from 'reactstrap';

function IconButton({ id, tooltip, onClick, iconClassName }) {
  return (
    <>
      <button className="border-0 outline-0 float-right bg-transparent" type="button" onClick={onClick}>
        <i className={`icon-btn ${iconClassName}`} id={id} />
      </button>
      <UncontrolledTooltip placement="left" target={id}>
        <small>{tooltip}</small>
      </UncontrolledTooltip>
    </>
  );
}

IconButton.propTypes = {
  iconClassName: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  tooltip: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default IconButton;
