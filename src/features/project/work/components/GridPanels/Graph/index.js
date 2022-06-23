/* eslint-disable max-lines */
import { setGraph } from 'features/project/work/slices/workSlice';
import {
  FILE_NAME,
  GRAPH_LINK_TYPE,
  GRAPH_SHORTCUT,
  GRAPH_SHORTCUT_CODE,
  G_TYPE,
  OPTION_TYPE,
} from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import eventBus from 'features/shared/lib/eventBus';
import { debounce } from 'lodash';
import Mousetrap from 'mousetrap';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { DELETE_KEY } from './constants';
import GraphManager from './graphManager';
import './style.scss';
import {
  caculateInsplectionPalette,
  compareNodeArray,
  compareEdgeArray,
  convertDirectConstraintToEdge,
  convertGraphLinkToEdge,
  convertGraphNodeToNode,
  convertUndirectConstraintToEdge,
  convertUndirectConstraintToNode,
  covertGraphStateToSavedData,
  getGraphSize,
  isDirectConstraint,
  separateNodes,
  separateEdges,
} from './utils';

class Graph extends Component {
  _raiseEventUpdate = debounce(() => {
    this._raiseEvent({ action: domainEvents.ACTION.GRAPH_UPDATE });
  }, 300);

  _raiseEvenGraphAligning = debounce(() => {
    this._raiseEvent({ action: domainEvents.ACTION.GRAPH_ALIGN });
  }, 300);

  constructor(props) {
    super(props);
    this.state = {
      removedGraph: {
        constraints: [],
        graphNodes: [],
        graphLinks: [],
      },
    };
    this.graphManager = null;
    this.graphState = null;
    this.consumers = [
      domainEvents.DES.TESTSCENARIOS,
      domainEvents.DES.TESTCOVERAGE,
      domainEvents.DES.TESTDATA,
      domainEvents.DES.SSMETRIC,
    ];
    this.dataIniting = false;
    this.initiatedGraph = false;
  }

  componentDidMount() {
    const { onGenerate } = this.props;

    const container = document.getElementById('graph_container_id');
    this.graphManager = new GraphManager(container, {
      onGraphChange: this._handleGraphChange,
      generate: async () => {
        if (onGenerate) {
          onGenerate();
        }

        // add delay to show waiting message before run to Generate process
        function delay(milliseconds) {
          return new Promise((resolve) => {
            setTimeout(resolve, milliseconds);
          });
        }
        await delay(50);

        this._raiseEvent({ action: domainEvents.ACTION.GENERATE });
      },
    });

    this._drawGraph(this.graphManager);
    // get graph state
    this.graphState = this.graphManager.getState();
    // register domain event
    eventBus.subscribe(this, domainEvents.CAUSEEFFECT_DOMAINEVENT, (event) => {
      this._handleCauseEffectEvents(event.message);
    });
    eventBus.subscribe(this, domainEvents.GRAPH_MENU_DOMAINEVENT, (event) => {
      this._handleShortCutEvents(event.message.code);
    });
    eventBus.subscribe(this, domainEvents.TEST_SCENARIO_DOMAINEVENT, (event) => {
      this._handleTestScenarioAndCaseEvents(event.message);
    });
    eventBus.subscribe(this, domainEvents.WORK_MENU_DOMAINEVENT, (event) => {
      this._handleWorkMenuEvents(event.message);
    });
    document.addEventListener('click', this._handleClick, false);
    // register shortcut
    GRAPH_SHORTCUT.forEach(({ code, shortcutKeys }) => {
      Mousetrap.bind(shortcutKeys.join('+'), (e) => {
        e.preventDefault();
        this._handleShortCutEvents(code);
      });
    });

    const { setActionHandler } = this.props;
    if (setActionHandler) {
      setActionHandler(this.graphManager);
    }
  }

  componentDidUpdate() {
    this._drawGraph(this.graphManager);
  }

  _raiseEvent = (message) => {
    eventBus.publish(domainEvents.GRAPH_DOMAINEVENT, message);
  };

  _updateInspectionPalettes = (data) => {
    const updatedData = caculateInsplectionPalette(data);
    this.graphManager.updateInspections(updatedData.graphNodes);
  };

  _handleGraphChange = (graphAligning = false) => {
    if (graphAligning) {
      this._raiseEvenGraphAligning({ action: domainEvents.ACTION.GRAPH_ALIGN });
    } else {
      const { setGraph, graph } = this.props;
      const { removedGraph } = this.state;

      if (this.graphState && this.graphManager && !this.dataIniting) {
        const currentState = this.graphManager.getState();
        const data = covertGraphStateToSavedData(currentState);
        this._updateInspectionPalettes(data);
        // check remove graphNode
        const { removeNodes } = compareNodeArray(graph.graphNodes, data.graphNodes);
        const { removeEdges } = compareEdgeArray(graph.graphLinks, data.graphLinks);
        this.setState({
          removedGraph: {
            constraints: [],
            graphNodes: separateNodes(removeNodes).graphNodes,
            graphLinks: separateEdges(removeEdges).graphLinks,
          },
        });

        if (removedGraph.graphNodes.length > 0) {
          const { graphNodes } = removedGraph;
          this._raiseEvent({
            action: domainEvents.ACTION.ACCEPTDELETE,
            value: graphNodes,
            'g-type': G_TYPE.NODE,
          });
        }

        // raise update event and save graph data
        this._raiseEventUpdate();
        setGraph(data);
      }
    }
  };

  _getGraphImage = () => {
    const { width, height } = getGraphSize(this.graphManager.graph.nodes(), this.graphManager.graph.edges());
    const dummyContainer = document.createElement('div');

    dummyContainer.style.width = `${width + 50}px`;
    dummyContainer.style.height = `${height + 50}px`;
    dummyContainer.style.visibility = `hidden`;
    dummyContainer.style.position = 'fixed';
    dummyContainer.setAttribute('id', `dummy-container`);

    document.body.append(dummyContainer);

    const dummyGraphManager = new GraphManager(dummyContainer, { onGraphChange: () => {} });
    this._drawGraph(dummyGraphManager, null, true);
    dummyGraphManager.graph.center();

    const href = dummyGraphManager.graph.jpg();

    dummyGraphManager.graph.destroy();
    document.body.removeChild(dummyContainer);

    return href;
  };

  _saveAsPicture = () => {
    const { workName } = this.props;
    const tmpLink = document.createElement('a');

    tmpLink.download = FILE_NAME.GRAPH_IMAGE.replace('workname', workName.replace(/\s+/g, '_'));
    tmpLink.href = this._getGraphImage();
    document.body.appendChild(tmpLink);

    tmpLink.click();

    document.body.removeChild(tmpLink);
  };

  _handleDeleteAction = (e) => {
    if (e.which === DELETE_KEY) {
      this.graphManager.removeSelectedElement();
    }
  };

  _handleClick = (e) => {
    if (e.target.getAttribute('data-id') === 'layer0-selectbox') {
      document.addEventListener('keyup', this._handleDeleteAction, false);
    } else {
      document.removeEventListener('keyup', this._handleDeleteAction, false);
    }
  };

  _handleCauseEffectEvents = (message) => {
    const { action, receives, value } = message;
    switch (action) {
      case domainEvents.ACTION.ADD: {
        this._handleAddNodes(value);
        break;
      }
      case domainEvents.ACTION.ACCEPTDELETE:
        if (receives === undefined || receives.includes(domainEvents.DES.GRAPH)) {
          this.graphManager.deleteCauseEffectNode(value);
        }
        break;
      case domainEvents.ACTION.UPDATE:
        this._updateDefinition(value);
        break;
      case domainEvents.ACTION.CHANGE_NODE_ID:
        this._changeNodeId(value);
        break;
      case domainEvents.ACTION.RECREATE:
        this._reCreateGraph(value);
        break;
      default:
        break;
    }
  };

  _changeNodeId = (value) => {
    this.graphManager.changeNodeId(value.oldNode, value.newNode);
  };

  _handleAddNodes = (data) => {
    data.forEach((item) => {
      const { isMerged } = item;
      if (!isMerged) {
        this.graphManager.drawCauseEffect(item);
      }
    });
  };

  /* Events */
  _handleTestScenarioAndCaseEvents = (message) => {
    const { action, value } = message;
    switch (action) {
      case domainEvents.ACTION.ACCEPTGENERATE:
        this.graphManager.clear();
        this._drawGraph(this.graphManager, value, true);
        break;
      default:
        break;
    }
  };

  _updateDefinition = (value) => {
    this.graphManager.updateDefinition(value);
    this._raiseEvent({ action: domainEvents.ACTION.ACCEPTUPDATE, value });
  };

  _handleShortCutEvents = (code) => {
    switch (code) {
      case GRAPH_SHORTCUT_CODE.SAVE_AS_PICTURE:
        this._saveAsPicture();
        break;
      case GRAPH_SHORTCUT_CODE.GRAPH_OPTION:
        window.option({ optionType: OPTION_TYPE.GRAPH });
        break;
      case GRAPH_SHORTCUT_CODE.ALIGN:
        this.graphManager.align();
        break;
      case GRAPH_SHORTCUT_CODE.GENERATE:
        this._raiseEvent({ action: domainEvents.ACTION.GENERATE });
        break;
      case GRAPH_SHORTCUT_CODE.CAUSE_GROUP:
        console.log('CAUSE_GROUP');
        break;
      case GRAPH_SHORTCUT_CODE.EFFECT_GROUP:
        console.log('EFFECT_GROUP');
        break;
      case GRAPH_SHORTCUT_CODE.EXCLUSIVE:
        this.graphManager.addUndirectConstraint(GRAPH_LINK_TYPE.EXCLUSIVE);
        break;
      case GRAPH_SHORTCUT_CODE.INCLUSIVE:
        this.graphManager.addUndirectConstraint(GRAPH_LINK_TYPE.INCLUSIVE);
        break;
      case GRAPH_SHORTCUT_CODE.ONLYONE:
        this.graphManager.addUndirectConstraint(GRAPH_LINK_TYPE.ONLYONE);
        break;
      case GRAPH_SHORTCUT_CODE.REQUIRE:
        this.graphManager.addDirectConstraint(GRAPH_LINK_TYPE.REQUIRE);
        break;
      case GRAPH_SHORTCUT_CODE.MASK:
        this.graphManager.addDirectConstraint(GRAPH_LINK_TYPE.MASK);
        break;
      default:
        break;
    }
  };

  _handleWorkMenuEvents = (message) => {
    const { action } = message;
    if (action === domainEvents.ACTION.REPORTWORK) {
      const inspections = this.graphManager.getInspectionsReportData();
      const graphSrc = this._getGraphImage();

      this._raiseEvent({
        action: domainEvents.ACTION.REPORTWORK,
        value: { graphSrc, inspections },
        receivers: domainEvents.DES.WORKMENU,
      });
    }
  };

  _reCreateGraph = (data) => {
    if (this.graphState && this.graphManager && !this.dataIniting) {
      const { setGraph } = this.props;
      const { removedGraph } = this.state;
      const currentState = this.graphManager.getState();
      const graphState = covertGraphStateToSavedData(currentState);
      this._updateInspectionPalettes(graphState);
      const currentRemovedGraph = {
        constraints: [],
        graphLinks: removedGraph.graphLinks.filter((graphLink) => data.some((item) => item.node === graphLink.nodeId)),
        graphNodes: removedGraph.graphNodes.filter((graphNode) => data.some((item) => item.node === graphNode.nodeId)),
      };
      const newGraph = {
        constraints: graphState.constraints.slice(),
        graphLinks: graphState.graphLinks.slice(),
        graphNodes: graphState.graphNodes.slice(),
      };
      if (currentRemovedGraph.graphNodes.length > 0) {
        currentRemovedGraph.graphNodes.forEach((removedGraphNode) => {
          const isExists = newGraph.graphNodes.find((graphNode) => graphNode.nodeId === removedGraphNode.nodeId);
          if (!isExists) {
            newGraph.graphNodes.push(removedGraphNode);
          }
        });
        if (currentRemovedGraph.graphLinks.length > 0) {
          currentRemovedGraph.graphLinks.forEach((removedGraphLink) => {
            const isExists = newGraph.graphLinks.find((graphLink) => graphLink.nodeId === removedGraphLink.nodeId);
            if (!isExists) {
              newGraph.graphLinks.push(removedGraphLink);
            }
          });
        }
      }

      this._raiseEventUpdate();
      setGraph(newGraph);
      this._handleGraphChange();
    }
  };
  /* End events */

  _drawGraph = (graphManager, graphNodes = null, forceUpdate = false) => {
    const { graph, workLoaded } = this.props;
    const _graphNodes = graphNodes ?? graph.graphNodes;

    if ((!this.initiatedGraph && workLoaded) || forceUpdate) {
      this.dataIniting = true;

      _graphNodes.forEach((graphNode) => graphManager.draw(convertGraphNodeToNode(graphNode)));

      graph.graphLinks.forEach((graphLink) => graphManager.draw(convertGraphLinkToEdge(graphLink)));

      graph.constraints.forEach((constraint) => {
        if (isDirectConstraint(constraint.type)) {
          graphManager.draw(convertDirectConstraintToEdge(constraint));
        } else {
          const node = convertUndirectConstraintToNode(constraint);
          graphManager.draw(node);
          const edges = convertUndirectConstraintToEdge(constraint);
          edges.forEach((edge) => graphManager.draw(edge));
        }
      });

      this.dataIniting = false;
      this.initiatedGraph = true;

      const currentState = this.graphManager.getState();
      const data = covertGraphStateToSavedData(currentState);
      this._updateInspectionPalettes(data);
    }
  };

  componentWillUnmout() {
    eventBus.unsubscribe(this);
    document.removeEventListener('click', this._handleClick, false);
    Mousetrap.reset();
  }

  render() {
    return <div className="w-100" id="graph_container_id" />;
  }
}

Graph.propTypes = {
  setActionHandler: PropTypes.func.isRequired,
  workName: PropTypes.string.isRequired,
  graph: PropTypes.shape({
    graphNodes: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    graphLinks: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    constraints: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  }).isRequired,
  workLoaded: PropTypes.bool.isRequired,
  setGraph: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  workName: state.work.name,
  graph: state.work.graph,
  workLoaded: state.work.loaded,
});

const mapDispatchToProps = { setGraph };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Graph));
