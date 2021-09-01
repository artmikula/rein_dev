import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { UncontrolledTooltip } from 'reactstrap';

export default function RevertButton({ enable, onClick, className }) {
  const _className = clsx('rounded-circle outlint-0 test-coverage-button', className, enable && 'enable');
  return (
    <>
      <button
        id="test-coverage-revert-btn"
        type="button"
        className={_className}
        onClick={() => enable && onClick(!enable)}
      >
        <div className="content p-1 w-100 h-100 rounded-circle d-flex align-items-center justify-content-center">
          <i className="bi bi-reply-fill d-flex justify-content-center" />
        </div>
      </button>
      <UncontrolledTooltip target="test-coverage-revert-btn" placement="right" delay={300}>
        <span className="small">Revert</span>
      </UncontrolledTooltip>
    </>
  );
}

RevertButton.defaultProps = {
  enable: false,
  onClick: () => {},
  className: '',
};

RevertButton.propTypes = {
  enable: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};
