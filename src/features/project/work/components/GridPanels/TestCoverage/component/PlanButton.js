import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

export default function PlanButton({ enable, onClick, className }) {
  const _className = clsx('overflow-hidden planning-button', className, enable && 'enable');
  return (
    <button type="button" className={_className} onClick={() => onClick(!enable)}>
      <span className={`status ${enable && 'enable'}`} />
    </button>
  );
}

PlanButton.defaultProps = {
  enable: false,
  onClick: () => {},
  className: '',
};

PlanButton.propTypes = {
  enable: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};
