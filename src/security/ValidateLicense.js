import Loading from 'features/shared/components/Loading';
import React, { Component } from 'react';
import { Button, Card, CardText, CardTitle, Container } from 'reactstrap';
import RestService from '../features/shared/services/restService';
import GlobalContext from './GlobalContext';

class ValidateLicense extends Component {
  constructor(props) {
    super(props);

    this.state = { validating: true, isValid: false, licenseKey: '', submitting: false };
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
          console.log('validate error', error);
          alert('There is an error on license validation! Please contact administrator.');
        });
    }
  }

  _submit() {
    this.setState({ submitting: true });

    const { authenticated, getToken } = this.context;

    const { licenseKey } = this.state;

    if (authenticated && licenseKey.length > 0) {
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
          console.log('validate error', error);
          alert('There is an error on license validation! Please contact administrator.');
        })
        .finally(() => this.setState({ submitting: false }));
    }
  }

  render() {
    const { validating, isValid, licenseKey, submitting } = this.state;
    const { children } = this.props;

    const canSubmit = licenseKey.trim().length !== 0 && !submitting;

    if (validating === false && isValid === true) {
      return { ...children };
    }

    if (validating === false && isValid === false) {
      return (
        <Container fluid className="p-0" style={{ maxWidth: '500px', width: '100%', margin: '48px auto' }}>
          <Card body className="mx-2 py-4">
            <CardTitle tag="h5" className="mb-2">
              Enter your licensee key
            </CardTitle>
            <CardText>
              <input
                type="text"
                className="form-control small"
                placeholder="License key"
                onChange={(e) => this.setState({ licenseKey: e.target.value })}
              />
            </CardText>
            <Button
              onClick={() => this._submit()}
              color="primary"
              className="mt-3 d-flex justify-content-center align-items-center"
              disabled={!canSubmit}
            >
              {submitting && <span className="status-icon spinner-border" />}
              <span className="ml-1">Submit</span>
            </Button>
          </Card>
        </Container>
      );
    }

    return <Loading />;
  }
}

ValidateLicense.contextType = GlobalContext;

export default ValidateLicense;
