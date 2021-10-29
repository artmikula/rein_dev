import { TEMPLATE_SHORTCUT, TEMPLATE_SHORTCUT_CODE } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import React, { Component } from 'react';
import BaseSubMenu from '../BaseSubMenu';
import TemplateList from './components/TemplateList';
import TemplateSaving from './components/TemplateSaving';

export default class TemplateMenu extends Component {
  componentDidMount() {
    eventBus.subscribe(this, domainEvents.TEMPLATE_MENU_DOMAINEVENT, (event) => {
      this._handleEvent(event.message);
    });
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
    const modaProps = {
      title: Language.get('savetemplate'),
      content: <TemplateSaving />,
      actions: null,
    };
    window.modal(modaProps);
  };

  _loadTemplate = () => {
    const modaProps = {
      title: Language.get('loadtemplate'),
      content: <TemplateList />,
      actions: null,
    };
    window.modal(modaProps);
  };

  _explorer = () => {
    const modaProps = {
      title: Language.get('explorer'),
      content: <TemplateList />,
      actions: null,
    };
    window.modal(modaProps);
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
