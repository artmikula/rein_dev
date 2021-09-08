import React, { Component } from 'react';
import Keycloak from 'keycloak-js';
import GlobalContext from 'security/GlobalContext';

class Auth extends Component {
  componentDidMount() {
    const { setAuthenticated, setAuthContext } = this.context;

    const { REACT_APP_PROFILE, NODE_ENV } = process.env;

    const keycloak = Keycloak(`/${REACT_APP_PROFILE}.json`);

    keycloak.init({ onLoad: 'login-required', checkLoginIframe: false }).then((authenticated) => {
      setAuthenticated(authenticated);
      setAuthContext(keycloak);
      if (!NODE_ENV || NODE_ENV === 'development') {
        console.log(keycloak.token);
        console.log(keycloak.subject);
      }
    });

    keycloak.onTokenExpired = () => {
      console.log('token expired', keycloak.token);
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            console.log('successfully get a new token');
          } else {
            keycloak.login();
          }
        })
        .catch((err) => {
          console.log(err);
        });
    };
  }

  render() {
    const { authContext, authenticated } = this.context;

    const { children } = this.props;
    if (authContext) {
      if (authenticated) {
        return { ...children };
      }

      return (
        <div>
          <input value="click here to login" onClick={() => authContext.login()} />
        </div>
      );
    }

    return <div> Loading.... </div>;
  }
}

Auth.contextType = GlobalContext;

export default Auth;
