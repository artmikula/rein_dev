import restService from 'features/shared/services/restService';
import React, { Component } from 'react';

const GlobalContext = React.createContext();

class GlobalProvider extends Component {
  // Context state
  state = {
    authenticated: false,
    authContext: null,
  };

  // Method to update state
  setAuthenticated = (authenticated) => {
    this.setState({ authenticated });
  };

  setAuthContext = (authContext) => {
    restService.setToken(authContext.token);
    this.setState({ authContext });
  };

  getToken = () => {
    const { authContext } = this.state;

    return authContext.token;
  };

  getUserInfo = async () => {
    const { authContext } = this.state;

    if (authContext.loadUserInfo) {
      const userInfo = await authContext.loadUserInfo();

      return { name: userInfo.name, email: userInfo.email, id: userInfo.sub };
    }

    return {};
  };

  render() {
    const { children } = this.props;
    const { authContext, authenticated } = this.state;
    const { setAuthContext, setAuthenticated, getToken, getUserInfo } = this;

    return (
      <GlobalContext.Provider
        value={{
          authenticated,
          authContext,
          setAuthenticated,
          setAuthContext,
          getUserInfo,
          getToken,
        }}
      >
        {children}
      </GlobalContext.Provider>
    );
  }
}

const GlobalConsumer = GlobalContext.Consumer;

export { GlobalProvider, GlobalConsumer };

export default GlobalContext;
