import { Button } from 'reactstrap';
import { GRID_PANEL_SIZE, VIEW_MODE } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import TestData from '../../biz/TestData';
import CauseEffectTable from './CauseEffectTable';
import Graph from './Graph';
import GridPanelItem from './GridPanelItem';
import SSMertic from './SSMetric';
import TestBasis from './TestBasis';
import TestCoverage from './TestCoverage';
import TestDataTable from './TestDataTable';
import TestScenarioAndCase from './TestScenarioAndCase';

export default class GridPanels extends Component {
  setGraphActionHandler = (graphActionHandler) => {
    this.setState({ graphActionHandler });
  };

  handleGraphAction = (action) => {
    if (!this.state) {
      return;
    }
    const { graphActionHandler } = this.state;
    if (graphActionHandler && graphActionHandler[action]) {
      graphActionHandler[action]();
    }
  };

  panels = [
    {
      title: Language.get('testbasis'),
      component: <TestBasis />,
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
      component: <CauseEffectTable />,
    },
    {
      title: Language.get('ssmetric'),
      component: <SSMertic />,
    },
    {
      title: Language.get('testcoverage'),
      component: <TestCoverage />,
    },
    {
      title: Language.get('causeandeffectgraph'),
      component: <Graph setActionHandler={this.setGraphActionHandler} />,
      renderTitle: (title) => {
        return (
          <div className="flex-title">
            <div className="title-text">{title}</div>
            <div>
              <div className="btn-actions">
                <Button className="icons-img icon-btn icon-add" onClick={() => this.handleGraphAction('generate')} />
                <Button className="icons-img icon-btn icon-aline" onClick={() => this.handleGraphAction('align')} />
                <Button className="icons-img icon-btn icon-zoom-in" onClick={() => this.handleGraphAction('zoomIn')} />
                <Button
                  className="icons-img icon-btn icon-zoom-out"
                  onClick={() => this.handleGraphAction('zoomOut')}
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
      component: [<TestScenarioAndCase />, <TestDataTable />],
    },
  ];

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
    const { viewMode, isLockedPanel, layouts, onLayoutChange } = this.props;
    const {
      screenHeight,
      gridCols,
      panelHeight,
      panelMargin,
      togglePanelWidth,
      splitViewPanelWidth,
      singleViewPanelWidth,
    } = GRID_PANEL_SIZE;
    const wrapperHeight = screenHeight + panelMargin.x + panelMargin.y;
    let panelWidth = splitViewPanelWidth;
    if (viewMode === VIEW_MODE.SINGLE) {
      panelWidth = singleViewPanelWidth;
    }

    return (
      <div style={{ height: wrapperHeight }} className="overflow-auto">
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
              >
                {this.panels[index]?.component}
              </GridPanelItem>
            </div>
          ))}
        </GridLayout>
      </div>
    );
  }
}
GridPanels.propTypes = {
  viewMode: PropTypes.string.isRequired,
  isLockedPanel: PropTypes.bool.isRequired,
  onLayoutChange: PropTypes.func.isRequired,
  layouts: PropTypes.arrayOf(PropTypes.object).isRequired,
};
