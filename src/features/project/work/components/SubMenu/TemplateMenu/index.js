import { allPropertiesInJSON, allTagsInXML, readFileContent } from 'features/project/work/biz/Template';
import { TEMPLATE_SHORTCUT, TEMPLATE_SHORTCUT_CODE } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import React, { Component, createRef } from 'react';
import { Router, withRouter } from 'react-router';
import BaseSubMenu from '../BaseSubMenu';
import TemplateExplorer from './components/TemplateExplorer';
import TemplateLoading from './components/TemplateLoading';
import TemplateSaving from './components/TemplateSaving';

class TemplateMenu extends Component {
  constructor(props) {
    super(props);
    this.fileInputRef = createRef(null);
  }

  componentDidMount() {
    eventBus.subscribe(this, domainEvents.TEMPLATE_MENU_DOMAINEVENT, (event) => {
      this._handleEvent(event.message);
    });
    this.checkQuery();
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
  }

  _handleEvent = (message) => {
    switch (message.code) {
      case TEMPLATE_SHORTCUT_CODE.SAVE_TEMPLATE:
        this._saveTemplate();
        break;
      case TEMPLATE_SHORTCUT_CODE.LOAD_TEMPLATE:
        this._loadTemplate();
        break;
      case TEMPLATE_SHORTCUT_CODE.EXPLORER:
        this._explorer();
        break;
      case TEMPLATE_SHORTCUT_CODE.IMPORT_META:
        this._importMeta();
        break;
      default:
    }
  };

  _saveTemplate = () => {
    const { history, match } = this.props;
    const modaProps = {
      title: Language.get('savetemplate'),
      content: (
        <Router history={history}>
          <TemplateSaving projectId={match.params.projectId} workId={match.params.workId} />
        </Router>
      ),
      actions: null,
    };
    window.modal(modaProps);
  };

  _loadTemplate = () => {
    const { history, match } = this.props;
    const modaProps = {
      title: Language.get('loadtemplate'),
      content: (
        <Router history={history}>
          <TemplateLoading projectId={match.params.projectId} workId={match.params.workId} />
        </Router>
      ),
      actions: null,
    };
    window.modal(modaProps);
  };

  _explorer = () => {
    const { history, match } = this.props;
    const modaProps = {
      title: Language.get('explorer'),
      content: (
        <Router history={history}>
          <TemplateExplorer projectId={match.params.projectId} workId={match.params.workId} />
        </Router>
      ),
      actions: null,
    };
    window.modal(modaProps);
  };

  _importMeta = () => {
    if (this.fileInputRef) {
      this.fileInputRef.current.click();
    }
  };

  checkQuery = () => {
    const { location } = this.props;
    const queryParams = new URLSearchParams(location.search);

    if (queryParams.has('load-template')) {
      this._loadTemplate();
    }
  };

  raiseEvent = (data) => {
    eventBus.publish(domainEvents.TEMPLATE_MENU_DOMAINEVENT, { data });
  };

  hanldeChangeFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileName = file.name;
      const ex = fileName.split('.').pop();
      if (ex.toLowerCase() === 'json') {
        readFileContent(file, (content) => {
          const data = allPropertiesInJSON(content);
          this.raiseEvent(data);
        });
      } else if (ex.toLowerCase() === 'xml') {
        readFileContent(file, (content) => {
          const data = allTagsInXML(content);
          this.raiseEvent(data);
        });
      }
    }
  };

  render() {
    return (
      <>
        <BaseSubMenu
          shortcuts={TEMPLATE_SHORTCUT}
          domainEvent={domainEvents.TEMPLATE_MENU_DOMAINEVENT}
          className="mh-100"
        />
        <input type="file" onChange={this.hanldeChangeFile} ref={this.fileInputRef} accept=".json,.xml" hidden />
      </>
    );
  }
}

export default withRouter(TemplateMenu);
