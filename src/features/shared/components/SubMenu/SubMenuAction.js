import React from 'react';
import PropTypes from 'prop-types';
import { DropdownItem } from 'reactstrap';
import './style.scss';

export default function SubMenuAction({ onClick, icon, children, shortcutKeys, disabled }) {
  return (
    <DropdownItem onClick={onClick} className="dropdown-item d-flex px-3 py-2" disabled={disabled}>
      {icon}
      <span className="flex-grow-1 small">{children}</span>
      {shortcutKeys && <span className="text-secondary small font-weight-light">{shortcutKeys.join('+')}</span>}
    </DropdownItem>
  );
}

SubMenuAction.defaultProps = {
  icon: undefined,
  shortcutKeys: [],
  disabled: false,
};

SubMenuAction.propTypes = {
  icon: PropTypes.element,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  onClick: PropTypes.func.isRequired,
  shortcutKeys: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
};
