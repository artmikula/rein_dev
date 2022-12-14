import PropTypes from 'prop-types';
import React from 'react';
import { DropdownMenu, DropdownToggle, UncontrolledDropdown, UncontrolledTooltip } from 'reactstrap';
import './style.scss';

export default function MenuItem({ iconClassName, text, id, dropdown }) {
  const _id = `${id}-menu-item`;
  const hasCaret = Boolean(dropdown);

  return (
    <UncontrolledDropdown inNavbar>
      <DropdownToggle className="menu-item border-0 shadow-none align-items-center d-flex" caret={hasCaret} id={_id}>
        <i className={`${iconClassName} d-sm-none`} />
        <UncontrolledTooltip className="d-sm-none" placement="bottom" target={_id}>
          {text}
        </UncontrolledTooltip>
        <span className="menu-label d-none d-sm-inline">{text}</span>
      </DropdownToggle>
      {dropdown && <DropdownMenu className="py-0 mt-2 mb-3 position-absolute">{dropdown}</DropdownMenu>}
    </UncontrolledDropdown>
  );
}

MenuItem.defaultProps = {
  dropdown: '',
};

MenuItem.propTypes = {
  id: PropTypes.string.isRequired,
  iconClassName: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  dropdown: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};
