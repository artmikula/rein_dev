import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Collapse, Navbar, NavbarBrand, NavbarToggler } from 'reactstrap';
import { MultiLanguageDropdown, ProfileDropdown, ReInLinkButton } from './index';
import './NavMenu.css';

export default class NavMenu extends Component {
  constructor(props) {
    super(props);

    this.toggleNavbar = this.toggleNavbar.bind(this);
    this.state = {
      collapsed: true,
    };
  }

  toggleNavbar() {
    const { collapsed } = this.state;
    this.setState({
      collapsed: !collapsed,
    });
  }

  render() {
    const { collapsed } = this.state;
    const { children } = this.props;
    return (
      <header>
        <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom py-0 px-3 bg-primary small">
          <NavbarBrand tag={Link} to="/">
            <picture>
              <source media="(max-width:576px)" srcSet="/img/thinkforbl_80x20.png" width="80" height="20" />
              <source media="(max-width:768px)" srcSet="/img/thinkforbl_114x28.png" width="114" height="28" />
              <img src="/img/thinkforbl_123x30.png" alt="logo" width="123" height="30" />
            </picture>
          </NavbarBrand>
          <div className="navbar-nav flex-grow-1 justify-content-center ">{children}</div>
          <NavbarToggler onClick={this.toggleNavbar} className="text-white">
            <i className="bi bi-list" />
          </NavbarToggler>
          <Collapse
            className="d-sm-inline-flex flex-sm-row align-items-center justify-content-between flex-grow-0"
            isOpen={!collapsed}
            navbar
          >
            <ul className="d-flex justify-content-end m-0 pl-4">
              <ReInLinkButton />
              <MultiLanguageDropdown />
              <ProfileDropdown />
            </ul>
          </Collapse>
        </Navbar>
      </header>
    );
  }
}
