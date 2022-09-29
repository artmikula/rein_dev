import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

export default function PlanButton({ enable, onClick, className, isGenerated }) {
  const _className = clsx(
    'overflow-hidden planning-button',
    className,
    enable && !isGenerated && 'enable',
    isGenerated && 'disabled'
  );
  return (
    <button type="button" className={_className} disabled={isGenerated} onClick={() => onClick(!enable)}>
      <span className={`status ${enable && 'enable'}`} />
    </button>
  );
}

PlanButton.defaultProps = {
  enable: false,
  onClick: () => {},
  className: '',
  isGenerated: false,
};

PlanButton.propTypes = {
  enable: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  isGenerated: PropTypes.bool,
};
