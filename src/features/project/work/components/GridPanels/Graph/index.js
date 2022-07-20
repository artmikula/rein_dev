/* eslint-disable max-lines */
import React, { Component } from 'react';
import { debounce } from 'lodash';
import Mousetrap from 'mousetrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { setGraph } from 'features/project/work/slices/workSlice';
import {
  ACTIONS_STATE_NAME,
  FILE_NAME,
  GRAPH_LINK_TYPE,
  GRAPH_NODE_TYPE,
  GRAPH_SHORTCUT,
  GRAPH_SHORTCUT_CODE,
  G_TYPE,
  OPTION_TYPE,
  PANELS_NAME,
  UNDO_ACTIONS_STACKS,
} from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import eventBus from 'features/shared/lib/eventBus';
import {
  subscribeUndoHandlers,
  unSubscribeUndoHandlers,
  pushUndoStates,
  popUndoStates,
  pushRedoStates,
  popRedoStates,
  clearRedoStates,
} from 'features/project/work/slices/undoSlice';
import ActionsHelper from 'features/shared/lib/actionsHelper';
import { DELETE_KEY } from './constants';
import GraphManager from './graphManager';
import {
  calculateInspectionPalette,
  compareNodeArray,
  convertDirectConstraintToEdge,
  convertGraphLinkToEdge,
  convertGraphNodeToNode,
  convertUndirectConstraintToEdge,
  convertUndirectConstraintToNode,
  covertGraphStateToSavedData,
  getGraphSize,
  isDirectConstraint,
  separateNodes,
} from './utils';
import './style.scss';

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
      cutData: {
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
    this.storeActions = false;
  }

  componentDidMount() {
    const { onGenerate, setActionHandler, subscribeUndoHandlers } = this.props;

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
      onDragFreeOn: this._storeActionsToUndoStates,
      storeActionsWhenDelete: this._storeActionsToUndoStates,
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

    if (setActionHandler) {
      setActionHandler(this.graphManager);
    }

    subscribeUndoHandlers({
      component: PANELS_NAME.GRAPH,
      update: this._updateUndoState,
      undo: this._handleUpdateActions,
    });
  }

  componentDidUpdate() {
    this._drawGraph(this.graphManager);
  }

  componentWillUnmount() {
    const { unSubscribeUndoHandlers } = this.props;
    eventBus.unsubscribe(this);
    document.removeEventListener('click', this._handleClick, false);
    Mousetrap.reset();
    unSubscribeUndoHandlers({ component: PANELS_NAME.GRAPH });
  }

  _raiseEvent = (message) => {
    eventBus.publish(domainEvents.GRAPH_DOMAINEVENT, message);
  };

  _updateInspectionPalettes = (data) => {
    const updatedData = calculateInspectionPalette(data);
    this.graphManager.updateInspections(updatedData.graphNodes);
  };

  _handleGraphChange = (graphAligning = false) => {
    if (graphAligning) {
      this._raiseEvenGraphAligning({ action: domainEvents.ACTION.GRAPH_ALIGN });
    } else {
      const { setGraph, graph } = this.props;

      if (this.graphState && this.graphManager && !this.dataIniting) {
        const currentState = this.graphManager.getState();
        const data = covertGraphStateToSavedData(currentState);
        this._updateInspectionPalettes(data);
        // check remove graphNode
        const { removeNodes } = compareNodeArray(graph.graphNodes, data.graphNodes);
        const { graphNodes } = separateNodes(removeNodes);

        if (graphNodes.length > 0) {
          this._raiseEvent({
            action: domainEvents.ACTION.ACCEPTDELETE,
            value: graphNodes,
            'g-type': G_TYPE.NODE,
            storeActions: this.storeActions,
          });
        }

        // raise update event and save graph data
        this._raiseEventUpdate();
        setGraph(data);
      }
    }
    this.storeActions = false;
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
      this._storeActionsToUndoStates();
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

  _handleCutEvent = (eventData) => {
    const { graph } = this.props;
    const graphNodes = graph.graphNodes.filter((graphNode) => eventData.some((item) => graphNode.nodeId === item));
    if (graphNodes.length > 0) {
      const constraints = [];
      const graphLinks = [];
      graphNodes.forEach((graphNode) => {
        // find graph link for cut cause nodes
        if (graphNode.type === GRAPH_NODE_TYPE.CAUSE) {
          const cutGraphLinks = graph.graphLinks.filter((graphLink) => graphLink.source.nodeId === graphNode.nodeId);
          if (cutGraphLinks.length > 0) {
            cutGraphLinks.forEach((cutGraphLink) => {
              const isExists = graphLinks.find((graphLink) => graphLink.id === cutGraphLink.id);
              if (!isExists) {
                graphLinks.push(cutGraphLink);
              }
            });
          }
        }
        // find graph link for cut effect nodes
        if (graphNode.type === GRAPH_NODE_TYPE.EFFECT) {
          const cutGraphLinks = graph.graphLinks.filter((graphLink) => graphLink.target.nodeId === graphNode.nodeId);
          if (cutGraphLinks.length > 0) {
            cutGraphLinks.forEach((cutGraphLink) => {
              const isExists = graphLinks.find((graphLink) => graphLink.id === cutGraphLink.id);
              if (!isExists) {
                graphLinks.push(cutGraphLink);
              }
            });
          }
        }
        // find constraint related to graph node
        const cutConstraints = graph.constraints.filter((constraint) =>
          constraint.nodes.some((node) => node.graphNodeId === graphNode.id)
        );
        if (cutConstraints.length > 0) {
          cutConstraints.forEach((cutConstraint) => {
            const isExists = constraints.find((constraint) => constraint.id === cutConstraint.id);
            if (!isExists) {
              constraints.push(cutConstraint);
            }
          });
        }
      });
      const cutData = {
        constraints,
        graphNodes,
        graphLinks,
      };
      this.setState({ cutData });
    }
  };

  _handlePasteEvent = () => {
    const { setGraph, graph } = this.props;
    const { cutData } = this.state;
    const newGraph = {
      constraints: graph.constraints.slice(),
      graphNodes: graph.graphNodes.slice(),
      graphLinks: graph.graphLinks.slice(),
    };
    const reDrawGraph = {
      constraints: [],
      graphNodes: [],
      graphLinks: [],
    };
    cutData.graphNodes.forEach((data) => {
      const isExists = newGraph.graphNodes.find((graphNode) => graphNode.nodeId === data.nodeId);
      if (!isExists) {
        newGraph.graphNodes.push(data);
        reDrawGraph.graphNodes.push(data);
      }
    });

    // after re-draw all nodes, start to re-draw links and constraints
    cutData.graphNodes.forEach((data) => {
      if (data.type === GRAPH_NODE_TYPE.CAUSE) {
        const newGraphLinks = cutData.graphLinks.filter((graphLink) => graphLink.source.nodeId === data.nodeId);
        if (newGraphLinks.length > 0) {
          newGraphLinks.forEach((graphLink) => {
            const isExists = newGraph.graphLinks.find((newGraphLink) => newGraphLink.id === graphLink.id);
            if (!isExists) {
              newGraph.graphLinks.push(graphLink);
              reDrawGraph.graphLinks.push(graphLink);
            }
          });
        }
      }
      if (data.type === GRAPH_NODE_TYPE.EFFECT) {
        const newGraphLinks = cutData.graphLinks.filter((graphLink) => graphLink.target.nodeId === data.nodeId);
        if (newGraphLinks.length > 0) {
          newGraphLinks.forEach((graphLink) => {
            const isExists = newGraph.graphLinks.find((newGraphLink) => newGraphLink.id === graphLink.id);
            if (!isExists) {
              newGraph.graphLinks.push(graphLink);
              reDrawGraph.graphLinks.push(graphLink);
            }
          });
        }
      }
      const newConstraints = cutData.constraints.filter((constraint) =>
        constraint.nodes.some((node) => node.graphNodeId === data.id)
      );
      if (newConstraints.length > 0) {
        newConstraints.forEach((constraint) => {
          const isExists = newGraph.constraints.find((oldConstraint) => oldConstraint.id === constraint.id);
          if (!isExists) {
            newGraph.constraints.push(constraint);
            reDrawGraph.constraints.push(constraint);
          }
        });
      }
    });
    setGraph(newGraph);
    this._drawGraph(this.graphManager, reDrawGraph, true);
    this.setState({ cutData: { constraints: [], graphNodes: [], graphLinks: [] } });
  };

  _handleCauseEffectEvents = (message) => {
    const { action, receivers, value, storeActions } = message;
    switch (action) {
      case domainEvents.ACTION.ADD: {
        this._handleAddNodes(value);
        break;
      }
      case domainEvents.ACTION.ACCEPTDELETE:
        this.storeActions = storeActions;
        if (receivers === undefined || receivers.includes(domainEvents.DES.GRAPH)) {
          this.graphManager.deleteCauseEffectNode(value);
        }
        break;
      case domainEvents.ACTION.UPDATE:
        this._updateDefinition(value);
        break;
      case domainEvents.ACTION.CHANGE_NODE_ID:
        this._changeNodeId(value);
        break;
      case domainEvents.ACTION.CUT:
        if (receivers && receivers.includes(domainEvents.DES.GRAPH)) {
          this._handleCutEvent(value);
        }
        break;
      case domainEvents.ACTION.PASTE:
        if (receivers && receivers.includes(domainEvents.DES.GRAPH)) {
          this._handlePasteEvent();
        }
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
  /* End events */

  _drawGraph = (graphManager, graphs = null, forceUpdate = false) => {
    const { graph, workLoaded } = this.props;
    const _graphNodes = graphs?.graphNodes ?? graph.graphNodes;
    const _graphLinks = graphs?.graphLinks ?? graph.graphLinks;
    const _constraints = graphs?.constraints ?? graph.constraints;

    if ((!this.initiatedGraph && workLoaded) || forceUpdate) {
      this.dataIniting = true;

      _graphNodes.forEach((graphNode) => graphManager.draw(convertGraphNodeToNode(graphNode)));

      _graphLinks.forEach((graphLink) => graphManager.draw(convertGraphLinkToEdge(graphLink)));

      _constraints.forEach((constraint) => {
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

  /* Undo/Redo Actions */
  _storeActionsToUndoStates = async () => {
    const { undoStates, pushUndoStates, redoStates, clearRedoStates } = this.props;
    if (undoStates.length >= UNDO_ACTIONS_STACKS) {
      undoStates.shift();
    }

    if (redoStates.length > 0) {
      clearRedoStates();
    }

    const currentState = this._getCurrentState();

    await pushUndoStates(currentState);
    this._handleGraphChange();
  };

  _getCurrentState = () => {
    const { undoHandlers, graph } = this.props;

    return ActionsHelper.getCurrentState(undoHandlers, ACTIONS_STATE_NAME.GRAPH, graph, PANELS_NAME.GRAPH);
  };

  _updateUndoState = (newState) => {
    const { graph } = this.props;
    return ActionsHelper.updateUndoState(newState, ACTIONS_STATE_NAME.GRAPH, graph);
  };

  _handleUpdateActions = async (currentState) => {
    const { setGraph } = this.props;
    const currentGraphs = currentState.graph;
    await this.graphManager.deleteNodes();
    this._drawGraph(this.graphManager, currentGraphs, true);
    setGraph(currentGraphs);
    this._raiseEventUpdate();
  };
  /* End Undo/Redo Actions */

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
  subscribeUndoHandlers: PropTypes.func.isRequired,
  unSubscribeUndoHandlers: PropTypes.func.isRequired,
  undoHandlers: PropTypes.oneOfType([PropTypes.array]).isRequired,
  undoStates: PropTypes.oneOfType([PropTypes.array]).isRequired,
  redoStates: PropTypes.oneOfType([PropTypes.array]).isRequired,
  pushUndoStates: PropTypes.func.isRequired,
  clearRedoStates: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  workName: state.work.name,
  graph: state.work.graph,
  workLoaded: state.work.loaded,
  undoHandlers: state.undoHandlers.handlers,
  undoStates: state.undoHandlers.undoStates,
  redoStates: state.undoHandlers.redoStates,
});

const mapDispatchToProps = {
  setGraph,
  subscribeUndoHandlers,
  unSubscribeUndoHandlers,
  pushUndoStates,
  popUndoStates,
  pushRedoStates,
  popRedoStates,
  clearRedoStates,
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Graph));
