import React, { Component } from 'react';
import { Container } from 'reactstrap';

export default class Layout extends Component {
  render() {
    const { children } = this.props;

    return (
      <Container fluid className="p-0">
        {children}
      </Container>
    );
  }
}
