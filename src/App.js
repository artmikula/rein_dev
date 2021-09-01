import React, { Component } from 'react';
import { Route } from 'react-router';
import { Layout } from './features/shared/components';
import SilentRenew from './features/shared/authorization/SilentRenew';
import Landing from './features/project/Landing';
import ProjectList from './features/project/ProjectList';
import Workspace from './features/project/work/Workspace';

import AuthorizeRoute from './features/shared/authorization/AuthorizeRoute';
import ApiAuthorizationRoutes from './features/shared/authorization/ApiAuthorizationRoutes';
import { ApplicationPaths } from './features/shared/authorization/ApiAuthorizationConstants';

import './styles/custom.scss';
import alert from './features/shared/components/Alert';
import confirm from './features/shared/components/Confirm';
import modal from './features/shared/components/CustomModal';
import option from './features/shared/components/Options';

export default class App extends Component {
  constructor(props) {
    super(props);
    window.alert = alert;
    window.confirm = confirm;
    window.modal = modal;
    window.option = option;
  }

  render() {
    return (
      <Layout>
        <Route exact path="/authentication/SilentRenew" component={SilentRenew} />
        <AuthorizeRoute exact path="/" component={Landing} />
        <AuthorizeRoute exact path="/projects" component={ProjectList} />
        <AuthorizeRoute exact path="/project/:projectId/work/:workId" component={Workspace} />
        <Route path={ApplicationPaths.ApiAuthorizationPrefix} component={ApiAuthorizationRoutes} />
      </Layout>
    );
  }
}
