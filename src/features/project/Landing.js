import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';
import { PROJECT_FORM_NAME } from '../shared/constants';
import Language from '../shared/languages/Language';
import { CreateForm, ImportForm } from './components';
import ProjectLayout from './components/ProjectLayout';
import './style.scss';

export default class Landing extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formName: '',
    };
  }

  _handleToggleModalForm = () => {
    this.setState({ formName: '' });
  };

  _initCreateProject = () => {
    this.setState({
      formName: PROJECT_FORM_NAME.CREATE,
    });
  };

  _initImportProject = () => {
    this.setState({
      formName: PROJECT_FORM_NAME.IMPORT,
    });
  };

  render() {
    const { formName } = this.state;
    return (
      <ProjectLayout>
        <Container>
          <div className="project-action-wrapper flex-md-row full-vh-screen">
            <a
              href="#home"
              className="project-action-link rounded shadow-sm text-primary"
              onClick={this._initCreateProject}
            >
              <i className="bi bi-folder-plus h2" />
              <div className="h6 font-weight-normal mt-2">{Language.get('newproject')}</div>
            </a>
            <Link to="/projects" className="project-action-link mx-md-4 rounded shadow-sm text-success">
              <i className="bi bi-folder2-open h2" />
              <div className="h6 font-weight-normal mt-2">{Language.get('open')}</div>
            </Link>
            <a
              href="#home"
              className="project-action-link rounded shadow-sm text-orange"
              onClick={this._initImportProject}
            >
              <i className="bi bi-file-earmark-arrow-up h2" />
              <div className="h6 font-weight-normal mt-2">{Language.get('importproject')}</div>
            </a>
            <CreateForm
              isOpenModel={formName === PROJECT_FORM_NAME.CREATE}
              onToggleModal={this._handleToggleModalForm}
            />
            <ImportForm
              isOpenModel={formName === PROJECT_FORM_NAME.IMPORT}
              onToggleModal={this._handleToggleModalForm}
            />
          </div>
        </Container>
      </ProjectLayout>
    );
  }
}
