import { allPropertiesInJSON, allTagsInXML, readFileContent } from 'features/project/work/biz/Template';
import { setInspectionTemplates } from 'features/project/work/slices/workSlice';
import { REIN_SHORTCUT_CODE, TEMPLATE_SHORTCUT } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { Router, withRouter } from 'react-router';
import BaseSubMenu from '../BaseSubMenu';
import CreateUpdateInspectionTemplate from './components/CreateUpdateInspectionTemplate';
import InspectionTemplate from './components/InspectionTemplate';
import MetaImportation from './components/MetaImportation';
import { LOAD_META_PARAM } from './constant';

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
      case REIN_SHORTCUT_CODE.CHOOSE_TEMPLATE:
        this._chooseTemplate();
        break;
      case REIN_SHORTCUT_CODE.CREATE_UPDATE_TEMPLATE:
        this._createUpdateTemplate();
        break;
      case REIN_SHORTCUT_CODE.IMPORT_META:
        this._loadMeta();
        break;
      default:
    }
  };

  _chooseTemplate = () => {
    const { history, match, workInspectionTemplates, setInspectionTemplates } = this.props;
    let _closeModal = () => {};
    const handleClose = () => _closeModal();

    const modaProps = {
      title: Language.get('inspectiontemplates'),
      content: (
        <Router history={history}>
          <InspectionTemplate
            projectId={match.params.projectId}
            workId={match.params.workId}
            workInspectionTemplates={workInspectionTemplates}
            setInspectionTemplates={setInspectionTemplates}
            onClose={handleClose}
          />
        </Router>
      ),
      actions: null,
    };

    _closeModal = window.modal(modaProps);
  };

  _createUpdateTemplate = () => {
    const { history, match } = this.props;
    let _closeModal = () => {};
    const handleClose = () => _closeModal();

    const modaProps = {
      title: Language.get('inspectiontemplates'),
      content: (
        <Router history={history}>
          <CreateUpdateInspectionTemplate
            projectId={match.params.projectId}
            workId={match.params.workId}
            onClose={handleClose}
          />
        </Router>
      ),
      actions: null,
    };

    _closeModal = window.modal(modaProps);
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

    if (queryParams.has(LOAD_META_PARAM)) {
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
