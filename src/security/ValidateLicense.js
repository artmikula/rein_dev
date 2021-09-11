import React, { Component } from 'react';

import { Container, Card, Button, CardTitle, CardText } from 'reactstrap';
import RestService from '../features/shared/services/restService';

import GlobalContext from './GlobalContext';

class ValidateLicense extends Component {
  constructor(props) {
    super(props);

    this.state = { validating: true, isValid: false, licenseKey: '' };
  }

  componentDidMount() {
    const { authenticated, getToken } = this.context;
    if (authenticated) {
      const token = getToken();

      RestService.setToken(token);

      RestService.getAsync('/licensee')
        .then((response) => {
          this.setState({ validating: false, isValid: response.data.isValid });
        })
        .catch((error) => {
          console.log(error);
          alert('There is an error on license validation! Please contact administrator.');
        });
    }
  }

  _submit() {
    const { authenticated, getToken } = this.context;

    const { licenseKey } = this.state;

    if (authenticated && licenseKey.length > 0) {
      console.log(licenseKey);

      const token = getToken();

      RestService.setToken(token);

      RestService.putAsync('/licensee', { key: licenseKey })
        .then((response) => {
          const { isValid, message } = response.data;

          if (isValid === false && message.length > 0) {
            alert(message);
          } else {
            this.setState({ validating: false, isValid: response.data.isValid });
          }
        })
        .catch((error) => {
          console.log(error);
          alert('There is an error on license validation! Please contact administrator.');
        });
    }
  }

  render() {
    const { validating, isValid } = this.state;
    const { children } = this.props;

    if (validating === false && isValid === true) {
      return { ...children };
    }

    if (validating === false && isValid === false) {
      return (
        <Container fluid className="p-0">
          <Card body>
            <CardTitle tag="h5">Enter your licensee key</CardTitle>
            <CardText>
              {' '}
              <input type="text" onChange={(e) => this.setState({ licenseKey: e.target.value })} />
            </CardText>
            <Button onClick={() => this._submit()}>Submit</Button>
          </Card>
        </Container>
      );
    }

    return (
      <div className="spinner-border text-primary" role="status">
        <span className="sr-only/" />
      </div>
    );
  }
}

ValidateLicense.contextType = GlobalContext;

export default ValidateLicense;
