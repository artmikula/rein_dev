import React, { Component, Fragment } from 'react';
import { DropdownItem } from 'reactstrap';
import { Link } from 'react-router-dom';
import Language from '../../languages/Language';
import { data } from 'jquery';

export class LoginMenu extends Component {
  render() {
    const { authenticated } = this.context;

    if (!authenticated) {
      const registerPath = '';
      const loginPath = '';
      return this.anonymousView(registerPath, loginPath);
    }
    const profilePath = '';
    const logoutPath = { pathname: '', state: { local: true } };
    return this.authenticatedView(profilePath, logoutPath);
  }

  authenticatedView(profilePath, logoutPath) {
    const { authContext, getUserInfo } = this.context;
    let userName = '';
    getUserInfo().then((data) => {
      userName = data.name;
    });
    return (
      <>
        {userName && <p className="h6 p-2 pl-4">{userName}</p>}
        <DropdownItem tag={Link} to={profilePath} className="small py-2">
          <i className="bi bi-person mr-2" />
          {Language.get('viewaccount')}
        </DropdownItem>
        <DropdownItem className="small py-2" onClick={() => window.option()}>
          <i className="bi bi-sliders mr-2" />
          {Language.get('options')}
        </DropdownItem>
        <div className="border-top my-1" />
        <DropdownItem onClick={() => authContext.logout()} to={logoutPath} className="small py-2">
          <i className="bi bi-box-arrow-left mr-2" />
          {Language.get('logout')}
        </DropdownItem>
      </>
    );
  }

  anonymousView(registerPath, loginPath) {
    return (
      <>
        <DropdownItem tag={Link} to={registerPath} className="small py-2">
          <i className="bi bi-person-plus mr-2" />
          {Language.get('register')}
        </DropdownItem>
        <DropdownItem tag={Link} to={loginPath} className="small py-2">
          <i className="bi bi-box-arrow-in-right mr-2" />
          {Language.get('login')}
        </DropdownItem>
      </>
    );
  }
}
