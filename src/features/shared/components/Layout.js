import React, { Component } from 'react';
import { Container } from 'reactstrap';
import appConfig from '../lib/appConfig';
import optionService from '../services/optionService';

export default class Layout extends Component {
  constructor(props) {
    super(props);
    this.state = { loadedOption: false };
  }

  componentDidMount() {
    this._getOption();
  }

  _getOption = async () => {
    const result = await optionService.get();
    if (result.data) {
      const keys = Object.keys(result.data);
      keys.forEach((key) => {
        if (key === 'testData') {
          const curTestDataConfigKeys = Object.keys(appConfig.testData);
          const savedConfig = JSON.parse(result.data[key]);
          curTestDataConfigKeys.forEach((testDataKey) => {
            if (savedConfig[key]) {
              Object.assign(appConfig.testData, { [testDataKey]: savedConfig[key] });
            }
          });
        } else {
          Object.assign(appConfig, { [key]: JSON.parse(result.data[key]) });
        }
      });
    }

    this.setState({ loadedOption: true });
  };

  render() {
    const { children } = this.props;
    const { loadedOption } = this.state;

    return (
      <Container fluid className="p-0">
        {loadedOption && children}
      </Container>
    );
  }
}
