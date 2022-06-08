import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { LAYOUT } from 'features/shared/constants';
import NavMenu from '../../shared/components/NavMenu';

export default class ProjectLayout extends Component {
  render() {
    const { menus, children } = this.props;
    return (
      <div style={{ minWidth: LAYOUT.MIN_WIDTH }}>
        <NavMenu>{menus}</NavMenu>
        {children}
      </div>
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
