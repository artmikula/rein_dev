import constraintService from 'features/project/work/services/constraintService';
import graphLinkService from 'features/project/work/services/graphLinkService';
import graphNodeService from 'features/project/work/services/graphNodeService';
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
import { DELETE_KEY, EFFECTTYPE } from './constants';
import GraphManager from './graphManager';
import './style.scss';
import {
  compareEdgeArray,
  compareNodeArray,
  convertDirectConstraintToEdge,
  convertEdgeToDirectConstraint,
  convertEdgeToGraphLink,
  convertGraphLinkToEdge,
  convertGraphNodeToNode,
  convertNodeToGraphNode,
  convertNodeToUndirectConstraint,
  convertUndirectConstraintToEdges,
  convertUndirectConstraintToNode,
  covertGraphStateToSavedData,
  getGraphSize,
  isDirectConstraint,
  separateEdges,
  separateNodes,
} from './utils';

class Graph extends Component {
  _syncData = debounce(async (oldState, currentState) => {
    const { nodeState, edgeState } = currentState;
    const { addNodes, updateNodes, removeNodes } = compareNodeArray(oldState.nodeState, nodeState);
    const { addEdges, updateEdges, removeEdges } = compareEdgeArray(oldState.edgeState, edgeState);
    const _removeEdges = removeEdges.filter((x) => !removeNodes.some((y) => x.source === y.id || x.target === y.id));
    // sync removed nodes
    let succeeded = await this._removeNodesAsync(removeNodes);
    // sync updated nodes
    succeeded = succeeded && (await this._updateNodesAsync(updateNodes));
    // sync added nodes
    succeeded = succeeded && (await this._addNodesAsync(addNodes));
    // sync removed edges
    succeeded = succeeded && (await this._removeEdgesAsync(_removeEdges));
    // sync updated edges
    succeeded = succeeded && (await this._updateEdgesAsync(updateEdges));
    // sync added edges
    if (succeeded) {
      await this._addEdgesAsync(addEdges);
    }
  }, 500);

  constructor(props) {
    super(props);
    this.graphManager = null;
    this.graphState = null;
    this.consumers = [
      domainEvents.DES.TESTSCENARIOS,
      domainEvents.DES.TESTCOVERAGE,
      domainEvents.DES.TESTDATA,
      domainEvents.DES.SSMETRIC,
    ];
    this.initialingData = false;
  }

  async componentDidMount() {
    const container = document.getElementById('graph_container_id');
    this.graphManager = new GraphManager(container, {
      onGraphChange: this._handleGraphChange,
      generate: () => this._raiseEvent({ action: domainEvents.ACTION.GENERATE }),
    });
    await this._getData(this.graphManager);
    // get graph state
    this.graphState = this.graphManager.getState();
    // register domain event
    eventBus.subscribe(this, domainEvents.CAUSEEFFECT_ONCHANGE_DOMAINEVENT, (event) => {
      this._handleEvents(event.message);
    });
    eventBus.subscribe(this, domainEvents.GRAPH_MENU_DOMAINEVENT, (event) => {
      this._handleShortCutEvents(event.message.code);
    });
    eventBus.subscribe(this, domainEvents.TEST_SCENARIO_DOMAINEVENT, (event) => {
      this._handleEvents(event.message);
    });
    eventBus.subscribe(this, domainEvents.WORK_MENU_DOMAINEVENT, (event) => {
      this._handleWorkMenuEvents(event.message);
    });
    eventBus.subscribe(this, domainEvents.WORK_DATA_COLLECTION, (event) => {
      this._handleDataCollectionRequest(event.message);
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

  _raiseEvent = (message) => {
    eventBus.publish(domainEvents.GRAPH_ONCHANGE_DOMAINEVENT, message);
  };

  _handleDataCollectionRequest = () => {
    const currentState = this.graphManager.getState();
    const data = covertGraphStateToSavedData(currentState);

    this._raiseEvent({ action: domainEvents.ACTION.COLLECT_RESPONSE, value: data });
  };

  _addNodesAsync = async (addNodes) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { undirectConstraintNodes, graphNodes } = separateNodes(addNodes);

    if (undirectConstraintNodes.length > 0) {
      const data = undirectConstraintNodes.map((constraint) => convertNodeToUndirectConstraint(constraint));
      const result = await constraintService.createBatchAsync(projectId, workId, data);

      if (!result.error) {
        // update graph state
        this.graphState.nodeState = [...this.graphState.nodeState, ...undirectConstraintNodes];
        this._raiseEvent({
          action: domainEvents.ACTION.ADD,
          value: undirectConstraintNodes,
          'g-type': G_TYPE.CONSTRAINT,
          receivers: this.consumers,
        });
      } else {
        return false;
      }
    }

    if (graphNodes.length > 0) {
      const data = graphNodes.map((graphNode) => convertNodeToGraphNode(graphNode));
      const result = await graphNodeService.createBatchAsync(projectId, workId, data);

      if (!result.error) {
        // update graph state
        this.graphState.nodeState = [...this.graphState.nodeState, ...graphNodes];
        this._raiseEvent({
          action: domainEvents.ACTION.ADD,
          value: graphNodes,
          'g-type': G_TYPE.NODE,
          receivers: this.consumers,
        });
      } else {
        return false;
      }
    }
    return true;
  };

  _removeNodesAsync = async (removeNodes) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { undirectConstraintNodes, graphNodes } = separateNodes(removeNodes);

    if (undirectConstraintNodes.length > 0) {
      const ids = undirectConstraintNodes.map((constraint) => constraint.id);
      const result = await constraintService.deleteBatchAsync(projectId, workId, ids);

      if (!result.error) {
        // update graph state
        this.graphState.nodeState = this.graphState.nodeState.filter(
          (x) => !undirectConstraintNodes.some((y) => y.id === x.id)
        );
        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: undirectConstraintNodes,
          'g-type': G_TYPE.CONSTRAINT,
          receivers: this.consumers,
        });
      } else {
        return false;
      }
    }

    if (graphNodes.length > 0) {
      const ids = graphNodes.map((graphNode) => graphNode.id);
      const result = await graphNodeService.deleteBatchAsync(projectId, workId, ids);

      if (!result.error) {
        // update graph state
        this.graphState.nodeState = this.graphState.nodeState.filter((x) => !graphNodes.some((y) => y.id === x.id));
        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: graphNodes,
          'g-type': G_TYPE.NODE,
        });
      } else {
        return false;
      }
    }
    return true;
  };

  _updateNodesAsync = async (updateNodes) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { undirectConstraintNodes, graphNodes } = separateNodes(updateNodes);

    if (undirectConstraintNodes.length > 0) {
      const data = undirectConstraintNodes.map((undirectConstraintNode) =>
        convertNodeToUndirectConstraint(undirectConstraintNode)
      );
      const result = await constraintService.updateBatchAsync(projectId, workId, data);

      if (!result.error) {
        undirectConstraintNodes.forEach((x) => {
          Object.assign(
            this.graphState.nodeState.find((y) => y.id === x.id),
            x
          );
        });
        this._raiseEvent({
          action: domainEvents.ACTION.UPDATE,
          value: data,
          'g-type': G_TYPE.CONSTRAINT,
          receivers: this.consumers,
        });
      } else {
        return false;
      }
    }

    if (graphNodes.length > 0) {
      const data = graphNodes.map((graphNode) => convertNodeToGraphNode(graphNode));
      const result = await graphNodeService.updateBatchAsync(projectId, workId, data);

      if (!result.error) {
        graphNodes.forEach((x) => {
          Object.assign(
            this.graphState.nodeState.find((y) => y.id === x.id),
            x
          );
        });
        this._raiseEvent({
          action: domainEvents.ACTION.UPDATE,
          value: data,
          'g-type': G_TYPE.NODE,
          receivers: this.consumers,
        });
      } else {
        return false;
      }
    }
    return true;
  };

  _addEdgesAsync = async (addEdges) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { directConstraints, graphLinks } = separateEdges(addEdges);

    if (directConstraints.length > 0) {
      const data = directConstraints.map((constraint) => convertEdgeToDirectConstraint(constraint));
      const result = await constraintService.createBatchAsync(projectId, workId, data);

      if (!result.error) {
        this.graphState.edgeState = [...this.graphState.edgeState, ...directConstraints];
        this._raiseEvent({
          action: domainEvents.ACTION.ADD,
          value: directConstraints,
          'g-type': G_TYPE.CONSTRAINT,
          receivers: this.consumers,
        });
      } else {
        return false;
      }
    }

    if (graphLinks.length > 0) {
      const data = graphLinks.map((graphLink) => convertEdgeToGraphLink(graphLink));
      const result = await graphLinkService.createBatchAsync(projectId, workId, data);

      if (!result.error) {
        this.graphState.edgeState = [...this.graphState.edgeState, ...graphLinks];
        this._raiseEvent({
          action: domainEvents.ACTION.ADD,
          value: graphLinks,
          'g-type': G_TYPE.LINK,
          receivers: this.consumers,
        });
      } else {
        return false;
      }
    }
    return true;
  };

  _removeEdgesAsync = async (removeEdges) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { directConstraints, graphLinks } = separateEdges(removeEdges);

    if (directConstraints.length > 0) {
      const ids = directConstraints.map((constraint) => constraint.id);
      const result = await constraintService.deleteBatchAsync(projectId, workId, ids);

      if (!result.error) {
        this.graphState.edgeState = this.graphState.edgeState.filter(
          (x) => !directConstraints.some((y) => y.id === x.id)
        );
        this._raiseEvent({
          action: domainEvents.ACTION.REMOVE,
          value: directConstraints,
          'g-type': G_TYPE.CONSTRAINT,
          receivers: this.consumers,
        });
      } else {
        return false;
      }
    }

    if (graphLinks.length > 0) {
      const ids = graphLinks.map((graphLink) => graphLink.id);
      const result = await graphLinkService.deleteBatchAsync(projectId, workId, ids);

      if (!result.error) {
        this.graphState.edgeState = this.graphState.edgeState.filter((x) => !graphLinks.some((y) => y.id === x.id));
        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: graphLinks,
          'g-type': G_TYPE.LINK,
          receivers: this.consumers,
        });
      } else {
        return false;
      }
    }
    return true;
  };

  _updateEdgesAsync = async (updateEdges) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { directConstraints, graphLinks } = separateEdges(updateEdges);

    if (directConstraints.length > 0) {
      const data = directConstraints.map((directConstraint) => convertEdgeToDirectConstraint(directConstraint));
      const result = await constraintService.updateBatchAsync(projectId, workId, data);

      if (!result.error) {
        directConstraints.forEach((x) => {
          Object.assign(
            this.graphState.edgeState.find((y) => y.id === x.id),
            x
          );
        });
        this._raiseEvent({
          action: domainEvents.ACTION.UPDATE,
          value: data,
          'g-type': G_TYPE.CONSTRAINT,
          receivers: this.consumers,
        });
      } else {
        return false;
      }
    }

    if (graphLinks.length > 0) {
      const data = graphLinks.map((graphLink) => convertEdgeToGraphLink(graphLink));
      const result = await graphLinkService.updateBatchAsync(projectId, workId, data);

      if (!result.error) {
        graphLinks.forEach((x) => {
          Object.assign(
            this.graphState.edgeState.find((y) => y.id === x.id),
            x
          );
        });
        this._raiseEvent({
          action: domainEvents.ACTION.UPDATE,
          value: data,
          'g-type': G_TYPE.LINK,
          receivers: this.consumers,
        });
      } else {
        return false;
      }
    }
    return true;
  };

  _handleGraphChange = (actionType) => {
    if (actionType === EFFECTTYPE.EFFECT && this.graphState && this.graphManager && !this.initialingData) {
      const oldState = { ...this.graphState };
      const currentState = this.graphManager.getState();
      this._syncData(oldState, currentState);
    }
  };

  _getGraphImage = async () => {
    const { width, height } = getGraphSize(this.graphManager.graph.nodes(), this.graphManager.graph.edges());
    const dummyContainer = document.createElement('div');

    dummyContainer.style.width = `${width + 50}px`;
    dummyContainer.style.height = `${height + 50}px`;
    dummyContainer.style.visibility = `hidden`;
    dummyContainer.style.position = 'fixed';
    dummyContainer.setAttribute('id', `dummy-container`);

    document.body.append(dummyContainer);

    const dummyGraphManager = new GraphManager(dummyContainer, { onGraphChange: () => {} });
    await this._getData(dummyGraphManager);
    dummyGraphManager.graph.center();

    const href = dummyGraphManager.graph.jpg();

    dummyGraphManager.graph.destroy();
    document.body.removeChild(dummyContainer);

    return href;
  };

  _saveAsPicture = async () => {
    const { work } = this.props;
    const tmpLink = document.createElement('a');

    tmpLink.download = FILE_NAME.GRAPH_IMAGE.replace('workname', work.name.replace(/\s+/g, '_'));
    tmpLink.href = await this._getGraphImage();
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

  /* Events */
  _handleEvents = async (message) => {
    const { action, receives, value } = message;
    switch (action) {
      case domainEvents.ACTION.ADD: {
        const { isMerged } = value;
        if (!isMerged) {
          this.graphManager.drawCauseEffect(value, EFFECTTYPE.EFFECT);
        }
        break;
      }
      case domainEvents.ACTION.ACCEPTDELETE: {
        if (receives === undefined || receives.includes(domainEvents.DES.GRAPH)) {
          this.graphManager.deleteCauseEffectNode(value, EFFECTTYPE.SIDEEFFECT);
        }
        break;
      }
      case domainEvents.ACTION.ACCEPTGENERATE: {
        const { match } = this.props;
        const { projectId, workId } = match.params;
        // update generated graphNodes
        await graphNodeService.updateBatchAsync(projectId, workId, value.graphNodes);
        // clear all graph and draw again
        this.graphManager.clear();
        await this._getData(this.graphManager);
        break;
      }
      default:
        break;
    }
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

  _handleWorkMenuEvents = async (message) => {
    const { action } = message;
    if (action === domainEvents.ACTION.REPORTWORK) {
      const inspections = this.graphManager.getInspectionsReportData();

      this._raiseEvent({
        action: domainEvents.ACTION.REPORTWORK,
        value: { graphSrc: await this._getGraphImage(), inspections },
        receivers: domainEvents.DES.WORKMENU,
      });
    }
  };
  /* End events */

  _getData = async (graphManager) => {
    this.initialingData = true;
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const getGraphNodesResult = await graphNodeService.getListAsync(projectId, workId);
    if (getGraphNodesResult.data) {
      getGraphNodesResult.data.forEach((graphNode) => graphManager.draw(convertGraphNodeToNode(graphNode)));
      const getGraphLinksResult = await graphLinkService.getListAsync(projectId, workId);
      if (getGraphLinksResult.data) {
        getGraphLinksResult.data.forEach((graphLink) => graphManager.draw(convertGraphLinkToEdge(graphLink)));
      } else {
        window.alert(getGraphLinksResult.error);
      }

      const getContraintsResult = await constraintService.getListAsync(projectId, workId);
      if (getContraintsResult.data) {
        getContraintsResult.data.forEach((constraint) => {
          if (isDirectConstraint(constraint.type)) {
            graphManager.draw(convertDirectConstraintToEdge(constraint));
          } else {
            const node = convertUndirectConstraintToNode(constraint);
            graphManager.draw(node);
            const edges = convertUndirectConstraintToEdges(constraint);
            edges.forEach((edge) => graphManager.draw(edge));
          }
        });
      } else {
        window.alert(getContraintsResult.error);
      }
    } else {
      window.alert(getGraphNodesResult.error);
    }
    this.initialingData = false;
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
  match: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.bool])).isRequired,
  setActionHandler: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  work: state.work,
});

export default connect(mapStateToProps)(withRouter(Graph));
