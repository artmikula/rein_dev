import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { DropdownItem } from 'reactstrap';
import GlobalContext from 'security/GlobalContext';
import Language from '../../languages/Language';

class LoginMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
    };
  }

  componentDidMount() {
    this._getUserInfo();
  }

  _getUserInfo = async () => {
    const { getUserInfo } = this.context;
    const data = await getUserInfo();

    this.setState({ user: data });
  };

  authenticatedView(logoutPath) {
    const { authContext } = this.context;
    const { user } = this.state;

    return (
      <>
        {user.name && <p className="h6 p-2 pl-4 mb-0">{user.name}</p>}
        {/* <DropdownItem tag={Link} to={profilePath} className="small py-2">
          <i className="bi bi-person mr-2" />
          {Language.get('viewaccount')}
        </DropdownItem> */}
        <DropdownItem className="small py-2" onClick={window.option}>
          <i className="bi bi-sliders mr-2" />
          {Language.get('options')}
        </DropdownItem>
        <div className="border-top my-1" />
        <DropdownItem onClick={authContext.logout} to={logoutPath} className="small py-2">
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

  render() {
    const { authenticated } = this.context;

    if (!authenticated) {
      const registerPath = '';
      const loginPath = '';
      return this.anonymousView(registerPath, loginPath);
    }

    const logoutPath = { pathname: '', state: { local: true } };

    return this.authenticatedView(logoutPath);
  }
}

LoginMenu.contextType = GlobalContext;

export default LoginMenu;
