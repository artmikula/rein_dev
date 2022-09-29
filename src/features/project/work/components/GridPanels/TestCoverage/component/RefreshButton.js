import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { UncontrolledTooltip } from 'reactstrap';

export default function RefreshButton({ enable, onClick, className, isGenerated }) {
  const _className = clsx(
    'rounded-circle outlint-0 test-coverage-button',
    className,
    enable && !isGenerated && 'enable',
    isGenerated && 'disabled'
  );
  return (
    <>
      <button
        id="test-coverage-refresh-btn"
        type="button"
        disabled={isGenerated}
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
  isGenerated: false,
};

RefreshButton.propTypes = {
  enable: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  isGenerated: PropTypes.bool,
};
