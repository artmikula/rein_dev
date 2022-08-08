/* eslint-disable max-lines */
import ProjectLayout from 'features/project/components/ProjectLayout';
import { defaultTestCoverageData, setWork } from 'features/project/work/slices/workSlice';
import { ModalForm } from 'features/shared/components';
import alert from 'features/shared/components/Alert';
import {
  CLASSIFY,
  DEFAULT_LAYOUTS,
  DEFAULT_LAYOUTS_SINGLE,
  STRING,
  VIEW_MODE,
  WORK_FORM_NAME,
} from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
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
import testScenarioAnsCaseStorage from './services/TestScenarioAnsCaseStorage';
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
    this.unlisten();
  }

  _convertTestScenarios = (testScenarios = [], graphNodes = []) =>
    testScenarios.map((testScenario) => {
      const { expectedResults } = testScenario;
      const sourceTargetType = graphNodes.find((graphNode) => graphNode.nodeId === expectedResults)?.targetType;
      return {
        ...testScenario,
        sourceTargetType,
        testCases: testScenario.testCases.map((testCase) => ({
          ...testCase,
          testDatas: JSON.parse(testCase.testDatas),
          results: JSON.parse(testCase.results),
        })),
      };
    });

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
    const {
      testBasis,
      causeEffects,
      graphNodes,
      graphLinks,
      constraints,
      testCoverage,
      testDatas,
      testScenarios,
      ...others
    } = data;

    testScenarios.forEach((x) => x);

    let _causeEffects = causeEffects ?? [];
    if (_causeEffects.some((x) => !x.orderIndex)) {
      _causeEffects = this._orderCauseEffect(_causeEffects);
    }

    const _data = {
      ...others,
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
    };

    return _data;
  };

  _getWorkById = async (projectId, workId) => {
    const { setWork, history } = this.props;
    const result = await workService.getAsync(projectId, workId);
    let workData = {};

    testScenarioAnsCaseStorage.setId(workId);

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
      const testScenariosAndCases = this._convertTestScenarios(
        result.data.testScenarios ?? [],
        result.data.graphNodes ?? []
      );
      this._saveWorkToLocalStorage(testScenariosAndCases);

      workData = this._getWorkData(result.data);
    }

    setWork({ ...workData, loaded: true });
  };

  _saveWorkToLocalStorage = (data) => {
    try {
      testScenarioAnsCaseStorage.set(data);
    } catch (e) {
      if (e instanceof DOMException && (e.code === 22 || e.code === 1024)) {
        alert(Language.get('workquotaexceed'), {
          warning: true,
          actionText: 'OK',
          onClose: this._onCloseAlert,
        });
      }
    }
  };

  _onCloseAlert = () => {
    localStorage.clear();
    window.location.reload();
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
    const { viewMode, isLockedPanel, gridPanelLayout, formName, openRenameWorkModal } = this.state;
    const { workName, projectName } = this.props;
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
            <WorkSyncData />
            <Button
              color="link"
              size="sm"
              className="icon-btn sm"
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
              className="icon-btn sm"
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
};

const mapDispatchToProps = { setWork };
const mapStateToProps = (state) => ({
  loadedWork: state.work.loaded,
  workName: state.work.name,
  projectName: state.work.projectName,
});

export default connect(mapStateToProps, mapDispatchToProps)(Workspace);
