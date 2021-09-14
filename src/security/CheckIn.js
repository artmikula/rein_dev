import React, { Component } from 'react';

import RestService from '../features/shared/services/restService';

import GlobalContext from './GlobalContext';

class CheckIn extends Component {
  constructor(props) {
    super(props);

    this.state = { checkedIn: false };
  }

  componentDidMount() {
    const { authenticated, getToken } = this.context;
    if (authenticated) {
      const token = getToken();

      RestService.setToken(token);

      RestService.postAsync('/check-in')
        .then(() => {
          this.setState({ checkedIn: true });
        })
        .catch((error) => {
          console.log(error);
          alert('There is an error on api connection Please contact administrator.');
        });
    }
  }

  render() {
    const { checkedIn } = this.state;
    const { children } = this.props;
    if (checkedIn) {
      return { ...children };
    }

    return (
      <div className="spinner-border text-primary" role="status">
        <span className="sr-only/" />
      </div>
    );
  }
}

CheckIn.contextType = GlobalContext;

export default CheckIn;
