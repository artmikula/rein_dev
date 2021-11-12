import { allPropertiesInJSON, allTagsInXML, readFileContent } from 'features/project/work/biz/Template';
import { TEMPLATE_SHORTCUT, TEMPLATE_SHORTCUT_CODE } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import React, { Component, createRef } from 'react';
import { Router, withRouter } from 'react-router';
import BaseSubMenu from '../BaseSubMenu';
import MetaImportation from './components/MetaImportation';
import TemplateExplorer from './components/TemplateExplorer';
import TemplateLoading from './components/TemplateLoading';
import TemplateSaving from './components/TemplateSaving';
import { LOAD_META_PARAM, LOAD_TEMPLATE_PARAM } from './constant';

class ReInMenu extends Component {
  constructor(props) {
    super(props);
    this.fileInputRef = createRef(null);
  }

  componentDidMount() {
    eventBus.subscribe(this, domainEvents.REIN_MENU_DOMAINEVENT, (event) => {
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
      case TEMPLATE_SHORTCUT_CODE.LIST_OF_TEMPLATE:
        this._explorer();
        break;
      case TEMPLATE_SHORTCUT_CODE.IMPORT_META:
        this._loadMeta();
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

  _loadTemplate = (isLoadMeta) => {
    const { history, match } = this.props;
    const modaProps = {
      title: Language.get('loadtemplate'),
      content: (
        <Router history={history}>
          <TemplateLoading projectId={match.params.projectId} workId={match.params.workId} isLoadMeta={isLoadMeta} />
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

  _handleLoadMeta = (file) => {
    if (this.closeLoadMetaModal) {
      this.closeLoadMetaModal();
      this.closeLoadMetaModal = null;
    }

    if (file) {
      const fileName = file.name;
      const ex = fileName.split('.').pop();
      const self = this;

      if (ex.toLowerCase() === 'json') {
        readFileContent(file, (content) => {
          const data = allPropertiesInJSON(content);
          self.raiseEvent({ action: domainEvents.ACTION.INSERTCAUSES, value: data });
        });
      } else if (ex.toLowerCase() === 'xml') {
        readFileContent(file, (content) => {
          const data = allTagsInXML(content);
          self.raiseEvent({ action: domainEvents.ACTION.INSERTCAUSES, value: data });
        });
      }
    }
  };

  _loadMeta = () => {
    const modaProps = {
      title: Language.get('loadmeta'),
      content: <MetaImportation onSubmit={this._handleLoadMeta} />,
      actions: null,
    };
    this.closeLoadMetaModal = window.modal(modaProps);
  };

  checkQuery = () => {
    const { location } = this.props;
    const queryParams = new URLSearchParams(location.search);

    if (queryParams.has(LOAD_TEMPLATE_PARAM) && queryParams.has(LOAD_META_PARAM)) {
      this._loadTemplate(true);
    } else if (queryParams.has(LOAD_TEMPLATE_PARAM)) {
      this._loadTemplate();
    } else if (queryParams.has(LOAD_META_PARAM)) {
      this._loadMeta();
    }
  };

  raiseEvent = (message) => {
    eventBus.publish(domainEvents.REIN_MENU_DOMAINEVENT, message);
  };

  render() {
    return (
      <BaseSubMenu shortcuts={TEMPLATE_SHORTCUT} domainEvent={domainEvents.REIN_MENU_DOMAINEVENT} className="mh-100" />
    );
  }
}

export default withRouter(ReInMenu);