import graphNodeService from 'features/project/work/services/graphNodeService';
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
import Mousetrap from 'mousetrap';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { DELETE_KEY } from './constants';
import GraphManager from './graphManager';
import './style.scss';
import {
  compareNodeArray,
  convertDirectConstraintToEdge,
  convertGraphLinkToEdge,
  convertGraphNodeToNode,
  convertUndirectConstraintToEdges,
  convertUndirectConstraintToNode,
  covertGraphStateToSavedData,
  getGraphSize,
  isDirectConstraint,
  separateNodes,
} from './utils';

class Graph extends Component {
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

  _handleGraphChange = () => {
    const { setGraph, graph } = this.props;

    if (this.graphState && this.graphManager && !this.initialingData) {
      const currentState = this.graphManager.getState();
      const data = covertGraphStateToSavedData(currentState);
      const { removeNodes } = compareNodeArray(graph.graphNodes, data.graphNodes);
      const { graphNodes } = separateNodes(removeNodes);

      if (graphNodes.length > 0) {
        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: graphNodes,
          'g-type': G_TYPE.NODE,
        });
      }

      setGraph(data);
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
    const { workName } = this.props;
    const tmpLink = document.createElement('a');

    tmpLink.download = FILE_NAME.GRAPH_IMAGE.replace('workname', workName.replace(/\s+/g, '_'));
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
          this.graphManager.drawCauseEffect(value);
        }
        break;
      }
      case domainEvents.ACTION.ACCEPTDELETE: {
        if (receives === undefined || receives.includes(domainEvents.DES.GRAPH)) {
          this.graphManager.deleteCauseEffectNode(value);
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
    const { graph } = this.props;

    this.initialingData = true;

    graph.graphNodes.forEach((graphNode) => graphManager.draw(convertGraphNodeToNode(graphNode)));

    graph.graphLinks.forEach((graphLink) => graphManager.draw(convertGraphLinkToEdge(graphLink)));

    graph.constraints.forEach((constraint) => {
      if (isDirectConstraint(constraint.type)) {
        graphManager.draw(convertDirectConstraintToEdge(constraint));
      } else {
        const node = convertUndirectConstraintToNode(constraint);
        graphManager.draw(node);
        const edges = convertUndirectConstraintToEdges(constraint);
        edges.forEach((edge) => graphManager.draw(edge));
      }
    });

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
  workName: state.work.name,
  graph: state.work.graph,
});

const mapDispatchToProps = { setGraph };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Graph));
