import React, { Component, Fragment } from 'react';
import { DropdownItem } from 'reactstrap';
import { Link } from 'react-router-dom';
import authService from './AuthorizeService';
import { ApplicationPaths } from './ApiAuthorizationConstants';
import Language from '../languages/Language';

export class LoginMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: false,
      userName: null,
    };
  }

  async componentDidMount() {
    this._subscription = authService.subscribe(() => this.populateState());
    this.populateState();
    await authService.startSilentRenew();
  }

  componentWillUnmount() {
    authService.unsubscribe(this._subscription);
  }

  async populateState() {
    const [isAuthenticated, user] = await Promise.all([authService.isAuthenticated(), authService.getUser()]);
    this.setState({
      isAuthenticated,
      userName: user && user.name,
    });
  }

  render() {
    const { isAuthenticated, userName } = this.state;
    if (!isAuthenticated) {
      const registerPath = `${ApplicationPaths.Register}`;
      const loginPath = `${ApplicationPaths.Login}`;
      return this.anonymousView(registerPath, loginPath);
    } else {
      const profilePath = `${ApplicationPaths.Profile}`;
      const logoutPath = { pathname: `${ApplicationPaths.LogOut}`, state: { local: true } };
      return this.authenticatedView(userName, profilePath, logoutPath);
    }
  }

  authenticatedView(userName, profilePath, logoutPath) {
    return (
      <Fragment>
        {userName && <p className="h6 p-2 pl-4">{userName}</p>}
        <DropdownItem tag={Link} to={profilePath} className="small py-2">
          <i className="bi bi-person mr-2"></i>
          {Language.get('viewaccount')}
        </DropdownItem>
        <DropdownItem className="small py-2" onClick={() => window.option()}>
          <i className="bi bi-sliders mr-2"></i>
          {Language.get('options')}
        </DropdownItem>
        <div className="border-top my-1"></div>
        <DropdownItem tag={Link} to={logoutPath} className="small py-2">
          <i className="bi bi-box-arrow-left mr-2"></i>
          {Language.get('logout')}
        </DropdownItem>
      </Fragment>
    );
  }

  anonymousView(registerPath, loginPath) {
    return (
      <Fragment>
        <DropdownItem tag={Link} to={registerPath} className="small py-2">
          <i className="bi bi-person-plus mr-2"></i>
          {Language.get('register')}
        </DropdownItem>
        <DropdownItem tag={Link} to={loginPath} className="small py-2">
          <i className="bi bi-box-arrow-in-right mr-2"></i>
          {Language.get('login')}
        </DropdownItem>
      </Fragment>
    );
  }
}
