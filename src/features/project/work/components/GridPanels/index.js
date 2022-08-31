import { connect } from 'react-redux';
import { EVENT_LISTENER_LIST, GRAPH_ACTIONS, GRID_PANEL_SIZE, LAYOUT, VIEW_MODE } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { Button } from 'reactstrap';
import eventBus from 'features/shared/lib/eventBus';
import domainEvents from 'features/shared/domainEvents';
import CauseEffectTable from './CauseEffectTable';
import Graph from './Graph';
import GridPanelItem from './GridPanelItem';
import SSMertic from './SSMetric';
import TestBasis from './TestBasis';
import TestCoverage from './TestCoverage';
import TestDataTable from './TestDataTable';
import TestScenarioAndCase from './TestScenarioAndCase';

class GridPanels extends Component {
  // eslint-disable-next-line react/sort-comp
  setGraphActionHandler = (graphActionHandler) => {
    this.setState({ graphActionHandler });
  };

  panels = [
    {
      title: Language.get('testbasis'),
      children: <TestBasis />,
      renderTitle: (title) => {
        return (
          <div className="flex-title">
            <div className="title-text">{title}</div>
            <div>
              <div className="btn-actions">
                <span className="icons-img icon-btn icon-open" />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: Language.get('causeandeffecttable'),
      children: <CauseEffectTable />,
    },
    {
      title: Language.get('ssmetric'),
      children: <SSMertic />,
    },
    {
      title: Language.get('testcoverage'),
      children: <TestCoverage />,
    },
    {
      title: Language.get('causeandeffectgraph'),
      children: <Graph setActionHandler={this.setGraphActionHandler} />,
      renderTitle: (title) => {
        return (
          <div className="flex-title">
            <div className="title-text">{title}</div>
            <div>
              <div className="btn-actions">
                <Button
                  className="icons-img icon-btn icon-add"
                  onClick={() => this.handleGraphAction(GRAPH_ACTIONS.GENERATE)}
                />
                <Button
                  className="icons-img icon-btn icon-aline"
                  onClick={() => this.handleGraphAction(GRAPH_ACTIONS.ALIGN)}
                />
                <Button
                  className="icons-img icon-btn icon-zoom-in"
                  onClick={() => this.handleGraphAction(GRAPH_ACTIONS.ZOOM_IN)}
                />
                <Button
                  className="icons-img icon-btn icon-zoom-out"
                  onClick={() => this.handleGraphAction(GRAPH_ACTIONS.ZOOM_OUT)}
                />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Test Scenario/Case/Data',
      tabs: [Language.get('testscenarioortestcase'), Language.get('testdata')],
      children: [
        <TestScenarioAndCase />,
        <TestDataTable onChangeData={(value) => this.setState({ isTestDataChanged: value })} />,
      ],
    },
  ];

  constructor(props) {
    super(props);
    this.state = {
      wrapperHeight: 0,
      panelWidth: 0,
      panelHeight: 0,
      isTestDataChanged: false,
    };
  }

  handleGraphAction = (action) => {
    if (!this.state) {
      return;
    }
    const { graphActionHandler } = this.state;
    if (graphActionHandler && graphActionHandler[action]) {
      graphActionHandler[action]();
    }
  };

  componentDidMount() {
    this._initLayoutSize();
    window.addEventListener(EVENT_LISTENER_LIST.RESIZE, this._onChangeLayoutSize);

    // eventBus.subscribe(this, domainEvents.TEST_SCENARIO_DOMAINEVENT, (event) => {
    //   if (event.message.action === domainEvents.ACTION.ACCEPTGENERATE) {
    //     this.setState({ loading: false });
    //   }
    // });
  }

  componentWillUnmount() {
    window.removeEventListener(EVENT_LISTENER_LIST.RESIZE, () =>
      this.setState({ wrapperHeight: 0, panelWidth: 0, panelHeight: 0 })
    );
    eventBus.unsubscribe(this);
  }

  _generateTestCase = () => {
    const { testDatas } = this.props;
    const { isTestDataChanged } = this.state;
    if (isTestDataChanged) {
      eventBus.publish(domainEvents.TEST_DATA_DOMAINEVENT, {
        action: domainEvents.ACTION.UPDATE,
        value: { ...testDatas },
        receivers: [domainEvents.DES.TESTSCENARIOS],
      });
    }
    this.setState({ isTestDataChanged: false });
  };

  _initLayoutSize = () => {
    const { screenHeight, panelMargin, splitViewPanelWidth, panelHeight } = GRID_PANEL_SIZE;
    const wrapperHeight = screenHeight + panelMargin.x + panelMargin.y;
    this.setState({ wrapperHeight, panelWidth: splitViewPanelWidth, panelHeight });
  };

  _onChangeLayoutSize = () => {
    const { viewMode } = this.props;
    const { panelMargin, defaultScreenWidth, numColPanel, gridRows } = GRID_PANEL_SIZE;
    const minHeight = 917;

    const screenWidth = window.innerWidth < defaultScreenWidth ? defaultScreenWidth * 4 : window.innerWidth * 4;
    const screenHeight = window.innerHeight - 98;
    const panelWidth = screenWidth - panelMargin.x * 2;
    const panelHeight =
      screenHeight > minHeight
        ? Math.floor(screenHeight / gridRows) - panelMargin.y
        : Math.floor(minHeight / gridRows) - panelMargin.y;
    const wrapperHeight = screenHeight + panelMargin.x + panelMargin.y;
    const singleViewPanelWidth = window.innerWidth * numColPanel - panelMargin.x * 2;

    this.setState({ wrapperHeight, panelWidth, panelHeight });

    if (viewMode === VIEW_MODE.SINGLE) {
      this.setState({ panelWidth: singleViewPanelWidth });
    }
  };

  _handleTogglePanel = (key) => {
    /**
     * |panelA| |panelB|
     *
     * when toggle panelA
     * 1. find panelA then
     * 2.   => change width of panelA
     * 3. find all panelB which next to panelA then
     * 4.   => change position of panelB
     * 5.   => change width of panelB
     */
    const { viewMode, layouts, onLayoutChange } = this.props;
    const { panelWidth, panelMinWidth, togglePanelWidth, numColPanel } = GRID_PANEL_SIZE;
    const newLayouts = layouts.map((item) => ({ ...item }));
    const panel = newLayouts.find((e) => e.i === key);
    const panelsInColumn = newLayouts.filter((e) => e.x === panel.x && e.y !== panel.y);
    const nextPanels = newLayouts.filter((e) => e.x >= panel.x + panel.w);

    let changedWidth;

    if (panel.w > togglePanelWidth) {
      // collapse
      changedWidth = panel.w - togglePanelWidth;
      panel.minW = togglePanelWidth;
      panel.w = togglePanelWidth;
    } else {
      // expand
      panel.minW = panelMinWidth;
      const defaultWidth = viewMode === VIEW_MODE.SPLIT ? panelWidth : panelWidth * numColPanel;
      const currentWidth = panelsInColumn.reduce((max, e) => (e.w > max ? e.w : max), defaultWidth);
      panel.w = currentWidth;
      changedWidth = togglePanelWidth - panel.w;
    }

    panelsInColumn.forEach((e) => {
      const absChangedWidth = changedWidth >= 0 ? changedWidth : 0 - changedWidth;
      if (e.w > absChangedWidth) {
        changedWidth = 0;
      }
    });

    nextPanels.forEach((e) => {
      e.x -= changedWidth;
    });

    const rightPanels = nextPanels.filter((e) => e.x === panel.x + panel.w);
    rightPanels.forEach((e) => {
      if (e.w + changedWidth >= togglePanelWidth) {
        e.w += changedWidth;
      }
    });

    onLayoutChange(newLayouts);
  };

  render() {
    const { isLockedPanel, layouts, onLayoutChange, generating } = this.props;
    const { wrapperHeight, panelWidth, panelHeight, isTestDataChanged } = this.state;
    const { gridCols, panelMargin, togglePanelWidth } = GRID_PANEL_SIZE;

    return (
      <div
        style={window.innerWidth > LAYOUT.MIN_WIDTH ? { height: wrapperHeight } : { minHeight: wrapperHeight }}
        className="overflow-auto"
      >
        <GridLayout
          className="layout position-relative"
          layout={layouts}
          cols={gridCols}
          rowHeight={panelHeight}
          width={panelWidth}
          margin={[panelMargin.x, panelMargin.y]}
          draggableHandle=".draggable-tag"
          resizeHandles={['e', 's', 'se']}
          compactType="horizontal"
          useCSSTransforms
          isDraggable={!isLockedPanel}
          isDroppable={!isLockedPanel}
          isResizable={!isLockedPanel}
          onLayoutChange={onLayoutChange}
          draggableCancel=".cause-effect-node"
        >
          {layouts?.map((layout, index) => (
            <div key={layout.i} className="d-flex flex-column bg-white rounded shadow-sm">
              <GridPanelItem
                isCollapse={layout.w <= togglePanelWidth}
                isLockedPanel={isLockedPanel}
                title={this.panels[index]?.title}
                tabs={this.panels[index]?.tabs}
                index={index}
                onTogglePanel={() => this._handleTogglePanel(layout.i)}
                renderTitle={this.panels[index]?.renderTitle}
                generateTestCase={this._generateTestCase}
                isShowGenerateButton={isTestDataChanged}
              >
                {this.panels[index]?.children}
              </GridPanelItem>
            </div>
          ))}
        </GridLayout>
        {generating && (
          <div className="overlay" id="overlayDiv">
            <div className="overlay__inner">
              <div className="overlay__content">Processing...</div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

GridPanels.propTypes = {
  testDatas: PropTypes.oneOfType([PropTypes.array]).isRequired,
  viewMode: PropTypes.string.isRequired,
  isLockedPanel: PropTypes.bool.isRequired,
  onLayoutChange: PropTypes.func.isRequired,
  generating: PropTypes.bool.isRequired,
  layouts: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
};

const mapStateToProps = (state) => ({ testDatas: state.work.testDatas, generating: state.work.generating });

export default connect(mapStateToProps)(GridPanels);
