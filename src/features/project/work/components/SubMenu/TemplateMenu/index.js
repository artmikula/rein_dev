import { TEMPLATE_SHORTCUT, TEMPLATE_SHORTCUT_CODE } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import React, { Component } from 'react';
import { Router, withRouter } from 'react-router';
import BaseSubMenu from '../BaseSubMenu';
import TemplateExplorer from './components/TemplateExplorer';
import TemplateLoading from './components/TemplateLoading';
import TemplateSaving from './components/TemplateSaving';

class TemplateMenu extends Component {
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

  checkQuery = () => {
    const { location } = this.props;
    const queryParams = new URLSearchParams(location.search);

    if (queryParams.has('load-template')) {
      this._loadTemplate();
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
      </>
    );
  }
}

export default withRouter(TemplateMenu);
