import React, { Component } from 'react';
import PropTypes from 'prop-types';
import NavMenu from '../../shared/components/NavMenu';

export default class ProjectLayout extends Component {
  render() {
    const { menus, children } = this.props;
    return (
      <>
        <NavMenu>{menus}</NavMenu>
        {children}
      </>
    );
  }
}

ProjectLayout.defaultProps = {
  menus: '',
  children: '',
};

ProjectLayout.propTypes = {
  menus: PropTypes.node,
  children: PropTypes.node,
};
