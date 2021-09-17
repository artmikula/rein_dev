import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { setWork } from 'features/project/work/slices/workSlice';
import { Button, UncontrolledTooltip } from 'reactstrap';
import alert from 'features/shared/components/Alert';
import { ModalForm } from 'features/shared/components';
import { DEFAULT_LAYOUTS, DEFAULT_LAYOUTS_SINGLE, STRING, VIEW_MODE, WORK_FORM_NAME } from 'features/shared/constants';
import LocalStorage from 'features/shared/lib/localStorage';
import ProjectLayout from 'features/project/components/ProjectLayout';
import Language from 'features/shared/languages/Language';
import GlobalContext from 'security/GlobalContext';
import CreateForm from './components';
import GridPanels from './components/GridPanels';
import MenuContainer from './components/Menu/MenuContainer';
import workService from './services/workService';
import AlertGenerateReport from './components/AlertGenerateReport';

class Workspace extends Component {
  constructor(props) {
    super(props);
    const initialViewMode = LocalStorage.get(STRING.GRID_PANEL_VIEW_MODE);
    const initialIsLock = JSON.parse(LocalStorage.get(STRING.GRID_PANEL_IS_LOCK));
    const intialLayouts = JSON.parse(LocalStorage.get(STRING.GRID_PANEL_LAYOUT + initialViewMode));

    this.state = {
      viewMode: initialViewMode || VIEW_MODE.SPLIT,
      isLockedPanel: !!initialIsLock,
      gridPanelLayout: intialLayouts || DEFAULT_LAYOUTS,
      formName: '',
      workData: {},
      openRenameWorkModal: false,
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const { projectId, workId } = match.params;

    await this._getWorkById(projectId, workId);

    const { history } = this.props;
    this.unlisten = history.listen((location) => {
      const routes = location.pathname.split('/');

      const newWorkid = routes.pop();

      const newProjectId = routes.pop();

      if (projectId !== newProjectId || workId !== newWorkid) {
        window.location.reload();
      }
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  _getWorkById = async (projectId, workId) => {
    const { setWork } = this.props;
    const { getToken } = this.context;
    const result = await workService.getAsync(getToken(), projectId, workId);
    if (result.data) {
      this.setState({ workData: result.data });
      setWork(result.data);
    } else {
      this._showErrorMessage(result.error);
    }
  };

  _showErrorMessage = (error) => {
    alert(error.detail, { title: error.title, error: true });
  };

  _handleChangePanelLayout = (layouts, mode) => {
    const { viewMode } = this.state;
    const currentMode = mode || viewMode;
    this.setState({ gridPanelLayout: layouts, viewMode: currentMode });
    LocalStorage.set(STRING.GRID_PANEL_LAYOUT + currentMode, JSON.stringify(layouts));
    LocalStorage.set(STRING.GRID_PANEL_VIEW_MODE, currentMode);
  };

  _handleChangeViewMode = (mode) => {
    const oldLayouts = JSON.parse(LocalStorage.get(STRING.GRID_PANEL_LAYOUT + mode));
    let layouts;
    if (mode === VIEW_MODE.SPLIT) {
      layouts = oldLayouts || DEFAULT_LAYOUTS;
    }
    if (mode === VIEW_MODE.SINGLE) {
      layouts = oldLayouts || DEFAULT_LAYOUTS_SINGLE;
    }
    this._handleChangePanelLayout(layouts, mode);
  };

  _toggleLockPanel = () => {
    const { isLockedPanel } = this.state;
    LocalStorage.set(STRING.GRID_PANEL_IS_LOCK, JSON.stringify(!isLockedPanel));
    this.setState((state) => ({ isLockedPanel: !state.isLockedPanel }));
  };

  _handleResetLayout = () => {
    const { viewMode } = this.state;
    let layouts = DEFAULT_LAYOUTS;
    if (viewMode === VIEW_MODE.SINGLE) {
      layouts = DEFAULT_LAYOUTS_SINGLE;
    }
    this._handleChangePanelLayout(layouts);
  };

  _handleToggleModalForm = (projectId, workId) => {
    this.setState({ formName: '' });

    if (projectId && workId) {
      this._getWorkById(projectId, workId);
    }
  };

  _initCreateWork = () => {
    this.setState({
      formName: WORK_FORM_NAME.CREATE,
    });
  };

  _openRenameWorkModal = (e) => {
    e.preventDefault();
    this.setState({
      openRenameWorkModal: true,
    });
  };

  _getWorkSchema = (name) => {
    return {
      formTitle: 'Rename work',
      submitBtnName: 'Save',
      cancelBtnName: 'Cancel',
      formSchema: [
        {
          inputProps: {
            label: 'Name',
            id: 'name',
            name: 'name',
            placeholder: '',
            type: 'text',
            required: true,
            maxLength: 256,
          },
          initialValue: name,
          fieldError: false,
          helperText: '',
        },
      ],
    };
  };

  _closeRenameWorkModal = () => {
    this.setState({
      openRenameWorkModal: false,
    });
  };

  _handleSubmitRenameWork = async (values, { setErrors, setSubmitting }) => {
    const { workData } = this.state;
    const { match } = this.props;
    const { params } = match;
    const { projectId, workId } = params;
    const { getToken } = this.context;

    if (workData.name !== values.name) {
      const result = await workService.updateAsync(getToken(), projectId, workId, values);
      setSubmitting(false);
      if (!result.error) {
        await this._getWorkById(projectId, workId);
        this._closeRenameWorkModal();
      } else {
        const { Name } = result.error;
        const errorMessage = Name.join(' ');
        setErrors({
          _summary_: errorMessage,
        });
      }
    } else {
      this._closeRenameWorkModal();
    }
  };

  render() {
    const { viewMode, isLockedPanel, gridPanelLayout, formName, workData, openRenameWorkModal } = this.state;
    const isSplitView = viewMode === VIEW_MODE.SPLIT;
    const menus = <MenuContainer />;

    return (
      <ProjectLayout menus={menus}>
        <div className="d-flex flex-wrap align-items-center justify-content-between border-bottom bg-white px-3 small position-relative">
          <span>
            <span className="text-muted">{Language.get('project')}: </span>
            {workData.projectName}
            <i className="bi bi-chevron-right text-muted mx-1" />
            <Link to="#" onClick={this._openRenameWorkModal}>
              {workData.name}
            </Link>
            <Button
              color="link"
              size="sm"
              className="icon-btn mx-2 my-1"
              id="create-new-work"
              onClick={this._initCreateWork}
            >
              <i className="bi bi-plus" />
            </Button>
            <UncontrolledTooltip target="create-new-work">
              <small>{Language.get('createnewwork')}</small>
            </UncontrolledTooltip>
          </span>
          <AlertGenerateReport />
          <span>
            <Button
              color="link"
              size="sm"
              className="icon-btn my-1"
              id="tooltip-view-mode"
              onClick={() => this._handleChangeViewMode(isSplitView ? VIEW_MODE.SINGLE : VIEW_MODE.SPLIT)}
            >
              {isSplitView ? <i className="bi bi-square" /> : <i className="bi bi-layout-split" />}
            </Button>
            <UncontrolledTooltip target="tooltip-view-mode">
              <small>{isSplitView ? Language.get('changetosingleview') : Language.get('changetosplitview')}</small>
            </UncontrolledTooltip>
            <Button
              color="link"
              size="sm"
              className="icon-btn my-1"
              id="tooltip-lock-panel"
              onClick={this._toggleLockPanel}
            >
              {isLockedPanel ? <i className="bi bi-lock text-success" /> : <i className="bi bi-unlock text-orange" />}
            </Button>
            <UncontrolledTooltip target="tooltip-lock-panel">
              <small>{isLockedPanel ? Language.get('unlockpanel') : Language.get('lockpanel')}</small>
            </UncontrolledTooltip>
            <Button
              color="link"
              size="sm"
              className="icon-btn my-1"
              id="tooltip-reset-grid-panel-layout"
              onClick={this._handleResetLayout}
            >
              <i className="bi bi-grid-1x2" />
            </Button>
            <UncontrolledTooltip target="tooltip-reset-grid-panel-layout">
              <small>{Language.get('resettodefaultlayout')}</small>
            </UncontrolledTooltip>
          </span>
        </div>
        <GridPanels
          viewMode={viewMode}
          isLockedPanel={isLockedPanel}
          layouts={gridPanelLayout}
          onLayoutChange={this._handleChangePanelLayout}
        />
        <CreateForm isOpenModel={formName === WORK_FORM_NAME.CREATE} onToggleModal={this._handleToggleModalForm} />

        <ModalForm
          isOpen={openRenameWorkModal}
          formData={this._getWorkSchema(workData.name)}
          onToggle={() => this._closeRenameWorkModal()}
          onSubmit={this._handleSubmitRenameWork}
        />
      </ProjectLayout>
    );
  }
}

Workspace.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      workId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }).isRequired,
};

Workspace.contextType = GlobalContext;

const mapDispatchToProps = { setWork };
export default connect(null, mapDispatchToProps)(Workspace);
