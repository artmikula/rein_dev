import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { UncontrolledTooltip } from 'reactstrap';

export default function RefreshButton({ enable, onClick, className }) {
  const _className = clsx('rounded-circle outlint-0 test-coverage-button', className, enable && 'enable');
  return (
    <>
      <button
        id="test-coverage-refresh-btn"
        type="button"
        className={_className}
        onClick={() => enable && onClick(!enable)}
      >
        <div className="content p-1 w-100 h-100 rounded-circle d-flex align-items-center justify-content-center">
          <i className="bi bi-arrow-clockwise d-flex justify-content-center" />
        </div>
      </button>
      <UncontrolledTooltip target="test-coverage-refresh-btn" placement="right" delay={300}>
        <span className="small">Refresh</span>
      </UncontrolledTooltip>
    </>
  );
}

RefreshButton.defaultProps = {
  enable: false,
  onClick: () => {},
  className: '',
};

RefreshButton.propTypes = {
  enable: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};
