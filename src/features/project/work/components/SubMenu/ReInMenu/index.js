import { allPropertiesInJSON, allTagsInXML, readFileContent } from 'features/project/work/biz/Template';
import { setInspectionTemplates } from 'features/project/work/slices/workSlice';
import { TEMPLATE_SHORTCUT, TEMPLATE_SHORTCUT_CODE } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { Router, withRouter } from 'react-router';
import BaseSubMenu from '../BaseSubMenu';
import InspectionTemplate from './components/InspectionTemplate';
import MetaImportation from './components/MetaImportation';
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
    const { history, match, workInspectionTemplates, setInspectionTemplates } = this.props;
    const modalProps = { onClose: null };
    const modaProps = {
      title: Language.get('inspectiontemplates'),
      content: (
        <Router history={history}>
          <InspectionTemplate
            projectId={match.params.projectId}
            workId={match.params.workId}
            workInspectionTemplates={workInspectionTemplates}
            setInspectionTemplates={setInspectionTemplates}
            modalProps={modalProps}
          />
        </Router>
      ),
      actions: null,
    };
    modalProps.onClose = window.modal(modaProps);
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

const mapStateToProps = (state) => ({ workInspectionTemplates: state.work.inspectionTemplates });
const mapDispatchToProps = { setInspectionTemplates };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(ReInMenu));
