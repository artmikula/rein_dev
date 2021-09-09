import React, { Component } from 'react';
import { Route } from 'react-router';
import Auth from 'security/Auth';
import { Layout } from './features/shared/components';
import Landing from './features/project/Landing';
import ProjectList from './features/project/ProjectList';
import Workspace from './features/project/work/Workspace';
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
      <Auth>
        <Layout>
          <Route exact path="/" component={Landing} />
          <Route exact path="/projects" component={ProjectList} />
          <Route exact path="/project/:projectId/work/:workId" component={Workspace} />
        </Layout>
      </Auth>
    );
  }
}
