import React from 'react';
import { DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { LoginMenu } from '../../authorization/LoginMenu';

export default function ProfileDropdown() {
  return (
    <UncontrolledDropdown setActiveFromChild inNavbar>
      <DropdownToggle className="border-0 shadow-none" color="primary" caret>
        <i className="bi bi-person-circle h4 mb-0" />
      </DropdownToggle>
      <DropdownMenu right className="border-0 shadow">
        <LoginMenu />
      </DropdownMenu>
    </UncontrolledDropdown>
  );
}
