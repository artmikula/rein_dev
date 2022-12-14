/* eslint-disable max-lines */
import ProjectLayout from 'features/project/components/ProjectLayout';
import { defaultTestCoverageData, setWork, setDbContext, setGenerating } from 'features/project/work/slices/workSlice';
import { ModalForm } from 'features/shared/components';
import alert from 'features/shared/components/Alert';
import {
  CLASSIFY,
  DEFAULT_LAYOUTS,
  DEFAULT_LAYOUTS_SINGLE,
  GENERATE_STATUS,
  STRING,
  VIEW_MODE,
  WORK_FORM_NAME,
} from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import DbContext from 'features/shared/storage-services/dbContext/DbContext';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import LocalStorage from 'features/shared/lib/localStorage';
import { cloneDeep, debounce } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button, UncontrolledTooltip } from 'reactstrap';
import CreateForm from './components';
import AlertGenerateReport from './components/AlertGenerateReport';
import GridPanels from './components/GridPanels';
import MenuContainer from './components/Menu/MenuContainer';
import workService from './services/workService';
import WorkSyncData from './WorkSyncData';

class Workspace extends Component {
  _raiseEventLoadMeta = debounce(() => {
    const meta = localStorage.getItem('meta-data');

    if (meta) {
      localStorage.removeItem('meta-data');
      eventBus.publish(domainEvents.REIN_MENU_DOMAINEVENT, {
        action: domainEvents.ACTION.INSERTCAUSES,
        value: meta.split(','),
      });
    }
  }, 300);

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

  componentDidUpdate() {
    const { loadedWork } = this.props;
    if (loadedWork) {
      this._raiseEventLoadMeta();
    }
  }

  componentWillUnmount() {
    const { dbContext, setDbContext } = this.props;
    dbContext.close();
    setDbContext(null);
    this.unlisten();
  }

  _orderCauseEffect = (causeEffects) => {
    let causes = causeEffects.filter((x) => x.type === CLASSIFY.CAUSE);
    causes = causes.sort((a, b) => {
      const aIndex = parseInt(a.node.replace(CLASSIFY.CAUSE_PREFIX, ''), 10);
      const bIndex = parseInt(b.node.replace(CLASSIFY.CAUSE_PREFIX, ''), 10);
      console.log(aIndex, bIndex);
      return aIndex - bIndex;
    });

    causes.forEach((x, i) => {
      const _x = x;
      _x.orderIndex = i + 1;
    });

    let effects = causeEffects.filter((x) => x.type === CLASSIFY.EFFECT);
    effects = effects.sort((a, b) => {
      const aIndex = parseInt(a.node.replace(CLASSIFY.EFFECT_PREFIX, ''), 10);
      const bIndex = parseInt(b.node.replace(CLASSIFY.EFFECT_PREFIX, ''), 10);
      return aIndex - bIndex;
    });

    effects.forEach((x, i) => {
      const _x = x;
      _x.orderIndex = i + 1;
    });

    return [...causes, ...effects];
  };

  _getWorkData = (data) => {
    const { testBasis, causeEffects, graphNodes, graphLinks, constraints, testCoverage, testDatas, name } = data;

    let _causeEffects = causeEffects ?? [];
    if (_causeEffects.some((x) => !x.orderIndex)) {
      _causeEffects = this._orderCauseEffect(_causeEffects);
    }

    const _data = {
      testBasis: testBasis ?? {
        content: null,
      },
      causeEffects: _causeEffects,
      graph: {
        graphNodes: graphNodes ?? [],
        graphLinks: graphLinks ?? [],
        constraints: constraints ?? [],
      },
      testCoverage: testCoverage ?? cloneDeep(defaultTestCoverageData),
      testDatas: testDatas ?? [],
      name,
    };

    return _data;
  };

  _getWorkById = async (projectId, workId) => {
    const { setWork, history, setDbContext } = this.props;
    const result = await workService.getAsync(projectId, workId);
    let workData = {};

    if (result.error) {
      let { message } = result.error;

      if (result.error.code === 403) {
        message = 'You are not granted to access this project.';
      }

      alert(message, {
        error: true,
        onClose: () => {
          history.push('/projects');
        },
      });
    } else {
      const dbName = `${result.data.name}-${workId}`;
      const context = new DbContext();
      await context.init(dbName);
      setDbContext(context);
      workData = this._getWorkData(result.data);
    }

    workData.loaded = true;

    await setWork(workData);
  };

  _handleChangePanelLayout = (layouts, mode) => {
    const _layouts = layouts.filter((x) => x.i !== '__dropping-elem__');
    const { viewMode } = this.state;
    const currentMode = mode || viewMode;
    this.setState({ gridPanelLayout: _layouts, viewMode: currentMode });
    LocalStorage.set(STRING.GRID_PANEL_LAYOUT + currentMode, JSON.stringify(_layouts));
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

  _handleToggleModalForm = async (projectId, workId) => {
    this.setState({ formName: '' });

    if (projectId && workId) {
      await this._getWorkById(projectId, workId);
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
    const { match, workName } = this.props;
    const { params } = match;
    const { projectId, workId } = params;

    if (workName !== values.name) {
      const result = await workService.updateAsync(projectId, workId, values);
      setSubmitting(false);
      if (!result.error) {
        await this._getWorkById(projectId, workId);
        this._closeRenameWorkModal();
      } else {
        const { message } = result.error.data;
        setErrors({
          _summary_: message,
        });
      }
    } else {
      this._closeRenameWorkModal();
    }
  };

  render() {
    const { viewMode, isLockedPanel, gridPanelLayout, formName, openRenameWorkModal } = this.state;
    const { workName, projectName, generating, setGenerating } = this.props;
    const isSplitView = viewMode === VIEW_MODE.SPLIT;
    const menus = <MenuContainer />;

    return (
      <ProjectLayout menus={menus}>
        {/* eslint-disable-next-line max-len */}
        <div className="d-flex flex-wrap align-items-center justify-content-between border-bottom bg-white px-3 small position-relative py-1">
          <span>
            <span className="text-muted">{Language.get('project')}: </span>
            {projectName}
            <i className="bi bi-chevron-right text-muted mx-1" />
            <Link to="#" onClick={this._openRenameWorkModal}>
              {workName}
            </Link>
            <Button
              color="link"
              size="sm"
              className="icon-btn sm mx-2"
              id="create-new-work"
              onClick={this._initCreateWork}
            >
              <i className="bi bi-plus central" />
            </Button>
            <UncontrolledTooltip target="create-new-work">
              <small>{Language.get('createnewwork')}</small>
            </UncontrolledTooltip>
          </span>
          <AlertGenerateReport />
          <span>
            {(generating === GENERATE_STATUS.START || generating === GENERATE_STATUS.SUCCESS) && (
              <>
                <Button
                  color="link"
                  size="sm"
                  className="icon-btn sm clear-text-decor"
                  id="tooltip-cancel-generating"
                  onClick={() => setGenerating(GENERATE_STATUS.REQUEST_CANCEL)}
                >
                  <i className="bi central bi-x-circle" />
                </Button>
                <UncontrolledTooltip target="tooltip-cancel-generating">
                  <small>{Language.get('cancelgenerating')}</small>
                </UncontrolledTooltip>
              </>
            )}
            <WorkSyncData />
            <Button
              color="link"
              size="sm"
              className="icon-btn sm clear-text-decor"
              id="tooltip-view-mode"
              onClick={() => this._handleChangeViewMode(isSplitView ? VIEW_MODE.SINGLE : VIEW_MODE.SPLIT)}
            >
              {isSplitView ? <i className="bi bi-square central" /> : <i className="bi bi-layout-split central" />}
            </Button>
            <UncontrolledTooltip target="tooltip-view-mode">
              <small>{isSplitView ? Language.get('changetosingleview') : Language.get('changetosplitview')}</small>
            </UncontrolledTooltip>
            <Button
              color="link"
              size="sm"
              className="icon-btn sm clear-text-decor"
              id="tooltip-lock-panel"
              onClick={this._toggleLockPanel}
            >
              {isLockedPanel ? (
                <i className="bi bi-lock text-success central" />
              ) : (
                <i className="bi bi-unlock text-orange central" />
              )}
            </Button>
            <UncontrolledTooltip target="tooltip-lock-panel">
              <small>{isLockedPanel ? Language.get('unlockpanel') : Language.get('lockpanel')}</small>
            </UncontrolledTooltip>
            <Button
              color="link"
              size="sm"
              className="icon-btn sm"
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
          formData={this._getWorkSchema(workName)}
          onToggle={() => this._closeRenameWorkModal()}
          onSubmit={this._handleSubmitRenameWork}
        />
      </ProjectLayout>
    );
  }
}

Workspace.propTypes = {
  setWork: PropTypes.func.isRequired,
  workName: PropTypes.string.isRequired,
  projectName: PropTypes.string.isRequired,
  loadedWork: PropTypes.bool.isRequired,
  setDbContext: PropTypes.func.isRequired,
  setGenerating: PropTypes.func.isRequired,
  dbContext: PropTypes.oneOfType([PropTypes.object]),
  generating: PropTypes.string.isRequired,
};

Workspace.defaultProps = {
  dbContext: null,
};

const mapDispatchToProps = { setWork, setDbContext, setGenerating };

const mapStateToProps = (state) => ({
  loadedWork: state.work.loaded,
  workName: state.work.name,
  projectName: state.work.projectName,
  dbContext: state.work.dbContext,
  generating: state.work.generating,
});

export default connect(mapStateToProps, mapDispatchToProps)(Workspace);
