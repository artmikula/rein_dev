/* eslint-disable max-lines */
import {
  canAddDirectConstraint,
  canAddUndirectConstraint,
  getNextGroupNodeIndex,
  getOldEdges,
  getRenderCauseEffectPostition,
  getRenderUndirectConstraintPosition,
  hasEdge,
} from 'features/project/work/biz/Graph';
import { CLASSIFY, GRAPH_LINK_TYPE, GRAPH_NODE_TYPE, NODE_INSPECTION, OPERATOR_TYPE } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import React from 'react';
import { v4 as uuid } from 'uuid';
import NodePaletteView from './components/NodePaletteView';
import contextMenusSetup from './configs/contextmenu';
import cytoscapeSetup from './configs/cytoscape';
import definitionTooltipSetup from './configs/definitionTooltip';
import edgehandleSetup from './configs/edgehandles';
import effectGroupSetup from './configs/effectGroup';
import gridlinesSetup from './configs/gridlines';
import inspectionSetup from './configs/inspection';
import { DEFAULT_NODE_X, DEFAULT_SPACE, NODE_INPECTION_TEXT_KEY } from './constants';
import {
  convertGraphNodeToNode,
  createAngleNode,
  createEdge,
  createGraphNode,
  createIconNode,
  createOperatorNode,
  edgeAngle,
  getGraphSize,
  getIconPosition,
  getNodeLabelFromUnconstraintConstraintType,
  getNodeTypeFromConstraintType,
  isActiveNode,
  isUndirectConstraint,
  isUndirectConstraintNode,
} from './utils';

class GraphManager {
  constructor(container, options = {}) {
    const { onGraphChange, generate } = options;
    this.aligning = false;
    this.onGraphChange = () => onGraphChange(this.aligning);
    this.generate = generate;
    this.lastestSelectedNode = null;
    this.tapNode = false;
    this._init(container);
    this.dblTimeout = null;
    this.targetTap = null;
  }

  _init = (container) => {
    this.graph = cytoscapeSetup(container);
    edgehandleSetup(this.graph);
    gridlinesSetup(this.graph);
    inspectionSetup(this.graph);
    definitionTooltipSetup(this.graph);
    effectGroupSetup(this.graph, this._handleEffectGroupChange);
    contextMenusSetup(this.graph, {
      align: this.align,
      addGroup: this.addGroup,
      generate: this.generate,
      delete: this.removeSelectedElement,
      addExclusive: () => this.addUndirectConstraint(GRAPH_LINK_TYPE.EXCLUSIVE),
      addInclusive: () => this.addUndirectConstraint(GRAPH_LINK_TYPE.INCLUSIVE),
      addOnlyOne: () => this.addUndirectConstraint(GRAPH_LINK_TYPE.ONLYONE),
      lockPosition: this.lockPosition,
      unlockPosition: this.unlockPosition,
      addRequire: () => this.addDirectConstraint(GRAPH_LINK_TYPE.REQUIRE),
      addMask: () => this.addDirectConstraint(GRAPH_LINK_TYPE.MASK),
      setPalette: () => this._handleSetPalette(),
    });
    this.graph.on('ehcomplete', this._handleDrawEdgeComplete);
    this.graph.on('select', 'node', this._handleSelect);
    this.graph.on('unselect', 'node', this._handleUnselect);
    this.graph.on('position', 'node[type]', this._handleNodePositionChange);
    this.graph.on('add', 'node', this._handleAddNode);
    this.graph.on('remove', 'node', this._handleRemoveNode);
    this.graph.on('add', 'edge', this._handleAddEdge);
    this.graph.on('remove', 'edge', this._handleRemoveEdge);
    this.graph.on('tap', 'node', this._handleOperatorNodeTap);
    this.graph.on('mousedown', 'node', this._handleMouseDownOnNode);
    this.graph.on('mouseup', 'node', this._handleMouseUpOnNode);
    this.graph.on('dblclick', 'node', this._handleDblTap);
    this.graph.on('vdblclick', 'node', this._handleDblTap);
    this.graph.on('dblclick', 'node', this._handleDblTap);
    this.graph.on('tap', 'node', this._handleDblTap);
  };

  changeNodeId = (oldNodeId, newNodeId) => {
    const node = this.graph.nodes().find((x) => x.data().nodeId === oldNodeId);

    if (node) {
      node.data().nodeId = newNodeId;
      this.remove(node);
      this.draw(node);
      this.onGraphChange();
    }
  };

  _handleDblTap = (e) => {
    const target = e.target[0];
    if (isActiveNode(target) && !isUndirectConstraintNode(target) && this.targetTap && this.targetTap === target) {
      clearTimeout(this.dblTimeout);
      this.targetTap = null;
      this._openPaletteView(e.target);
    } else {
      this.dblTimeout = setTimeout(() => {
        this.targetTap = null;
      }, 300);
      this.targetTap = target;
    }
  };

  _handleSetPalette = () => {
    const nodes = this.graph.nodes(':selected');
    if (nodes.length === 0) {
      return;
    }

    this._openPaletteView(nodes);
  };

  _openPaletteView = (target) => {
    let _closeModal = () => {};
    const handleClose = () => _closeModal();
    const nodesData = target
      .map((x) => x.data())
      .sort((a, b) => {
        const aIndex = parseInt(a.nodeId.replace(CLASSIFY.CAUSE_PREFIX, ''), 10);
        const bIndex = parseInt(b.nodeId.replace(CLASSIFY.CAUSE_PREFIX, ''), 10);
        return aIndex - bIndex;
      });

    const handleSave = (inspectionPalettes) => {
      target.forEach((x) => {
        const node = x;
        node.data().inspectionPalettes = inspectionPalettes;
      });

      this.onGraphChange();
    };

    const modaProps = {
      title: target.length === 1 ? Language.get('nodedetail') : Language.get('setpalettes'),
      content: <NodePaletteView nodes={nodesData} onClose={handleClose} onSave={handleSave} />,
      actions: null,
    };

    _closeModal = window.modal(modaProps);
  };

  _hideOperator = (node) => {
    this._removeOperator(node);
    node._private.edges.forEach((edge) => {
      if (edge.source() === node && !edge.target().selected()) {
        this._removeOperator(edge.target());
      }
    });
  };

  _showOperator = (node) => {
    this._drawOperator(node);
    node._private.edges.forEach((edge) => {
      if (edge.source() === node && !edge.target().selected()) {
        this._drawOperator(edge.target());
      }
    });
  };

  _handleMouseDownOnNode = (e) => {
    if (e.target.selected()) {
      this.graph.nodes(':selected').forEach((node) => {
        this._hideOperator(node);
      });
    } else {
      this._hideOperator(e.target);
    }
  };

  _handleMouseUpOnNode = (e) => {
    if (e.target.selected()) {
      this.graph.nodes(':selected').forEach((node) => {
        this._showOperator(node);
      });
    } else {
      this._showOperator(e.target);
    }
  };

  _handleEffectGroupChange = (effectNode) => {
    // remove edge between this node with related effect node have same effect group
    effectNode._private.edges.forEach((edge) => {
      const { target, source } = edge._private;
      if (
        (source !== effectNode && effectNode.data().effectGroup === source.data().effectGroup) ||
        (target !== effectNode && effectNode.data().effectGroup === target.data().effectGroup)
      ) {
        this.remove(edge);
      }
    });
    this.onGraphChange();
  };

  _handleOperatorNodeTap = (e) => {
    const node = e.target;
    if (node.data().type === GRAPH_NODE_TYPE.OPERATOR_TYPE) {
      node.data().node.data().targetType =
        node.data().node.data().targetType === OPERATOR_TYPE.OR ? OPERATOR_TYPE.AND : OPERATOR_TYPE.OR;
      this._drawOperator(node.data().node);
      this.onGraphChange();
    }
  };

  _removeOperator = (node) => {
    const { type } = node.data();
    if (type === GRAPH_NODE_TYPE.EFFECT || type === GRAPH_NODE_TYPE.GROUP) {
      const oldAngle = this.graph.nodes().find((x) => x.data().id === `${GRAPH_NODE_TYPE.ANGLE}_${node.data().id}`);

      if (oldAngle) {
        this.remove(oldAngle);
      }

      const oldOperator = this.graph
        .nodes()
        .find((x) => x.data().id === `${GRAPH_NODE_TYPE.OPERATOR_TYPE}_${node.data().id}`);

      if (oldOperator) {
        this.remove(oldOperator);
      }
    }
  };

  _drawOperator = (node) => {
    this._removeOperator(node);
    const { type } = node.data();
    if (type === GRAPH_NODE_TYPE.EFFECT || type === GRAPH_NODE_TYPE.GROUP) {
      const edges = node._private.edges.filter((x) => x.data().type === GRAPH_LINK_TYPE.NONE && x.target() === node);
      if (edges.length >= 2) {
        const angleNode = createAngleNode(node);
        angleNode.data.angle = edgeAngle(edges);
        this.draw(angleNode);
        const operatorNode = createOperatorNode(node, angleNode.data.angle);
        this.draw(operatorNode);
      }
    }
  };

  _handleAddEdge = (e) => this._drawOperator(e.target.target());

  _handleRemoveEdge = (e) => this._drawOperator(e.target.target());

  _drawIcon = (node, type) => {
    const iconNode = createIconNode(node, type);
    const old = this.graph.$id(`${iconNode.data.id}`);
    if (old) {
      this.remove(old);
    }
    this.draw(iconNode);
  };

  _removeIcon = (node, type) => {
    const iconNode = this.graph.$id(`${type}_${node.data().id}`);
    if (iconNode) {
      this.remove(iconNode);
    }
  };

  _handleAddNode = (e) => {
    const node = e.target;
    const { inspection, isLocked, inspectionPaletteResults } = node.data();
    // draw pin icon
    if (isLocked && isActiveNode(node)) {
      this._drawIcon(node, GRAPH_NODE_TYPE.PIN);
    }
    // draw inspection icon
    if (
      ((inspection && inspection > 0) || (inspectionPaletteResults && inspectionPaletteResults.length > 0)) &&
      isActiveNode(node) &&
      !isUndirectConstraintNode(node)
    ) {
      this._drawIcon(node, GRAPH_NODE_TYPE.INSPECTION);
    }
  };

  _handleRemoveNode = (e) => {
    const node = e.target;
    if (node && isActiveNode(node)) {
      this._removeIcon(node, GRAPH_NODE_TYPE.PIN); // remove pin icon
      this._removeIcon(node, GRAPH_NODE_TYPE.INSPECTION); // remove inspection icon
      this._removeOperator(node);
    }
  };

  _handleSelect = (e) => {
    this.lastestSelectedNode = e.target;
  };

  _handleUnselect = () => {
    this.lastestSelectedNode = null;
  };

  _setPosition = (node, position) => {
    node.position(position);
    this._showOperator(node);
  };

  _handleNodePositionChange = (e) => {
    const { classes, data } = e.target._private;
    if (!classes.has('eh-handle') && !classes.has('eh-ghost')) {
      // update pin icon
      const pinNode = this.graph.$id(`${GRAPH_NODE_TYPE.PIN}_${data.id}`);
      if (pinNode) {
        pinNode.position(getIconPosition(e.target, GRAPH_NODE_TYPE.PIN));
      }

      // update inspection icon
      const inspectionNode = this.graph.$id(`${GRAPH_NODE_TYPE.INSPECTION}_${data.id}`);
      if (inspectionNode) {
        inspectionNode.position(getIconPosition(e.target, GRAPH_NODE_TYPE.INSPECTION));
      }
      this.aligning = true;
      this.onGraphChange();
      this.aligning = false;
    }
  };

  _handleDrawEdgeComplete = (e, sourceNode, targetNode, addedEles) => {
    const addedEle = addedEles[0];
    const sourceEdges = sourceNode._private?.edges;
    const targetEdges = targetNode._private?.edges;
    const oldEdges = getOldEdges(sourceEdges, targetEdges, addedEle);

    if (oldEdges.length > 0) {
      const oldEdge = oldEdges[0];
      const addedEleData = addedEle.data();
      const oldEdgeData = oldEdge.data();
      if (addedEleData.target !== oldEdgeData.target || addedEleData.isNotRelation !== oldEdgeData.isNotRelation) {
        this.remove(addedEle);
        this.remove(oldEdge);
        Object.assign(addedEleData, {
          id: oldEdgeData.id,
          type: oldEdgeData.type,
          target: addedEleData.target,
          source: addedEleData.source,
          isNotRelation: addedEleData.isNotRelation,
        });
        this.draw(addedEle);
        this.onGraphChange();
      } else {
        this.remove(addedEle);
      }
    } else {
      this.onGraphChange();
    }
  };

  _deleteRelatedUnconstraintNode = (node) => {
    node._private.edges.forEach((edge) => {
      if (
        isUndirectConstraint(edge.data().type) &&
        isUndirectConstraintNode(edge.source()) &&
        edge.source()._private.edges.length === 2
      ) {
        this.remove(edge.source());
      }
    });
  };

  draw = (ele) => {
    return this.graph.add(ele).find((x) => x.data().id === ele.data.id);
  };

  remove = (ele) => this.graph.remove(ele).find((x) => x.data().id === ele.data.id);

  getState = () => {
    const nodes = [];
    this.graph.nodes().forEach((node) => {
      if (isActiveNode(node)) {
        const { data, position, edges } = node._private;
        const nodeData = { ...data, ...position };
        if (isUndirectConstraintNode(node)) {
          nodeData.edges = edges.map((edge) => edge.data());
        }
        nodes.push(nodeData);
      }
    });

    const edges = [];
    this.graph.edges().forEach((edge) => {
      if (!isUndirectConstraint(edge.data().type) && !edge._private.classes.has('eh-ghost')) {
        edges.push(edge.data());
      }
    });

    return { nodeState: nodes, edgeState: edges };
  };

  updateInspections = (items) => {
    items.forEach((item) => {
      const node = this.graph.$id(`${item.id}`);

      if (
        (node && node.data().inspection !== item.inspection) ||
        node.data().inspectionPaletteResults !== item.inspectionPaletteResults
      ) {
        const edges = [...node._private.edges];
        this.remove(node);
        edges.forEach((edge) => this.remove(edge));
        const newNode = this.draw(convertGraphNodeToNode(item));
        edges.forEach((edge) => {
          this.draw(edge);
        });
        this._removeIcon(newNode, GRAPH_NODE_TYPE.INSPECTION);

        if (
          item.inspection !== NODE_INSPECTION.None ||
          (item.inspectionPaletteResults && item.inspectionPaletteResults.length > 0)
        ) {
          this._drawIcon(newNode, GRAPH_NODE_TYPE.INSPECTION);
        }
      }
    });
  };

  updateDefinition = (item) => {
    const node = this.graph.nodes().find((node) => node.data().definitionId === item.definitionId);
    if (node) {
      node.data().definition = item.definition;
    }
  };

  drawCauseEffect = (causeEffect, actionType) => {
    const { node, type, definitionId, definition } = causeEffect;
    const nodeType = type === CLASSIFY.CAUSE ? GRAPH_NODE_TYPE.CAUSE : GRAPH_NODE_TYPE.EFFECT;
    const { x, y } = getRenderCauseEffectPostition(this.graph.nodes(), nodeType);
    const inspection = NODE_INSPECTION.DisconnectedNode;
    const graphNode = createGraphNode(uuid(), node, nodeType, x, y, inspection, definitionId, definition);
    this.draw(convertGraphNodeToNode(graphNode));
    this.onGraphChange(actionType);
  };

  reDrawCauseEffect = (ele) => {
    const existsNode = this.graph.nodes().find((node) => node.data().id === ele.data.id);
    if (existsNode) {
      this.remove(existsNode);
    }
    this.draw(ele);
    this.onGraphChange();
  };

  removeSelectedElement = () => {
    const nodes = this.graph.nodes(':selected');
    const edges = this.graph.edges(':selected');
    if (nodes.length > 0) {
      nodes.forEach((node) => {
        this._deleteRelatedUnconstraintNode(node);
        this.remove(node);
      });
      this.onGraphChange();
    }

    if (edges.length > 0) {
      edges.forEach((edge) => {
        if (isUndirectConstraint(edge.data().type) && edge.source()._private.edges.length <= 2) {
          this.remove(edge.source());
        } else {
          this.remove(edge);
        }
      });
      this.onGraphChange();
    }
  };

  deleteCauseEffectNode = (causeEffect, actionType) => {
    const node = this.graph.nodes().find((x) => x.data().definitionId === causeEffect.definitionId);
    if (node) {
      this._deleteRelatedUnconstraintNode(node);
      this.remove(node);
      this.onGraphChange(actionType);
    }
  };

  _alignGraphNode = (nodes, type, prefix, defaultX) => {
    const graphNodes = nodes
      .filter((node) => node.data().type === type)
      .sort((nodeA, nodeB) => {
        const nodeAIndex = parseInt(nodeA.data().nodeId.replace(prefix, ''), 10);
        const nodeBIndex = parseInt(nodeB.data().nodeId.replace(prefix, ''), 10);
        return nodeAIndex - nodeBIndex;
      });
    let sortedDistinctEffectGroups;

    if (type === GRAPH_NODE_TYPE.EFFECT) {
      sortedDistinctEffectGroups = graphNodes.map((x) => x.data().effectGroup).sort((a, b) => a - b);
    }

    graphNodes.forEach((graphNode, index) => {
      let y = (index + 1) * DEFAULT_SPACE;
      let x = defaultX;

      if (type === GRAPH_NODE_TYPE.GROUP) {
        const causeEdges = graphNode._private.edges.filter(
          (edge) => edge.source().data().type === GRAPH_NODE_TYPE.CAUSE
        );

        if (causeEdges.length > 0) {
          y =
            causeEdges.map((edge) => edge.source().position().y).reduce((sum, value) => sum + value, 0) /
            causeEdges.length;
        }
      }

      if (type === GRAPH_NODE_TYPE.EFFECT) {
        x = sortedDistinctEffectGroups.findIndex((x) => x === graphNode.data().effectGroup) * 100 + defaultX;
      }

      this._setPosition(graphNode, { x, y });
    });
  };

  _alignUnconstraintNode = (nodes, type, defaultX) => {
    const unconstraintNodes = nodes.filter((node) => node.data().type === type);

    unconstraintNodes.forEach((unconstraintNode) => {
      const y =
        unconstraintNode._private.edges
          .map((edge) => edge.target().position().y)
          .reduce((sum, value) => sum + value, 0) / unconstraintNode._private.edges.length;
      this._setPosition(unconstraintNode, { x: defaultX, y });
    });
  };

  align = () => {
    // align node
    this.aligning = true;
    const nodes = this.graph.nodes();
    this._alignGraphNode(nodes, GRAPH_NODE_TYPE.CAUSE, CLASSIFY.CAUSE_PREFIX, DEFAULT_NODE_X.CAUSE);
    this._alignGraphNode(nodes, GRAPH_NODE_TYPE.GROUP, CLASSIFY.GROUP_PREFIX, DEFAULT_NODE_X.GROUP);
    this._alignGraphNode(nodes, GRAPH_NODE_TYPE.EFFECT, CLASSIFY.EFFECT_PREFIX, DEFAULT_NODE_X.EFFECT);
    this._alignUnconstraintNode(nodes, GRAPH_NODE_TYPE.EXCLUSIVE, DEFAULT_NODE_X.EXCLUSIVE);
    this._alignUnconstraintNode(nodes, GRAPH_NODE_TYPE.INCLUSIVE, DEFAULT_NODE_X.INCLUSIVE);
    this._alignUnconstraintNode(nodes, GRAPH_NODE_TYPE.ONLYONE, DEFAULT_NODE_X.ONLYONE);
    // zoom in/out
    const { width, height } = getGraphSize(nodes, this.graph.edges());
    const { clientWidth, clientHeight } = this.graph.container();
    let zoom = clientWidth / width;
    zoom = clientHeight / height < zoom ? clientHeight / height : zoom;
    this.graph.zoom(zoom - 0.05);
    // align center all nodes
    this.graph.center();
    this.aligning = false;
  };

  zoomIn = () => {
    let zoom = this.graph._private?.zoom;
    if (zoom) {
      zoom += 0.25;
      this.graph.zoom(zoom);
    }
  };

  zoomOut = () => {
    let zoom = this.graph._private?.zoom;
    if (zoom) {
      zoom -= 0.25;
      this.graph.zoom(zoom);
    }
  };

  addGroup = (e) => {
    const { x, y } = e.position;
    const index = getNextGroupNodeIndex(this.graph.nodes());
    const inspection = NODE_INSPECTION.DisconnectedNode;
    const graphNode = createGraphNode(uuid(), `G${index}`, GRAPH_NODE_TYPE.GROUP, x, y, inspection, null, '');
    this.draw(convertGraphNodeToNode(graphNode));
    this.onGraphChange();
  };

  lockPosition = () => {
    const nodes = this.graph.nodes(':selected');
    if (nodes.length === 0) {
      return;
    }

    nodes.ungrabify();
    nodes.forEach((node) => {
      const _node = node;
      _node.data().isLocked = true;
      this._drawIcon(_node, GRAPH_NODE_TYPE.PIN);
    });

    this.onGraphChange();
  };

  unlockPosition = () => {
    const nodes = this.graph.nodes(':selected');
    if (nodes.length === 0) {
      return;
    }

    nodes.grabify();
    nodes.forEach((node) => {
      const _node = node;
      _node.data().isLocked = false;
      this._removeIcon(node, GRAPH_NODE_TYPE.PIN);
    });

    this.onGraphChange();
  };

  addUndirectConstraint = (graphLinkType) => {
    const nodes = this.graph.nodes(':selected');
    const nodeType = getNodeTypeFromConstraintType(graphLinkType);

    if (canAddUndirectConstraint(nodes, nodeType)) {
      const nodeLabel = getNodeLabelFromUnconstraintConstraintType(nodeType);
      const { x, y } = getRenderUndirectConstraintPosition(nodes);
      const graphNode = createGraphNode(uuid(), nodeLabel, nodeType, x, y);
      const node = this.draw(convertGraphNodeToNode(graphNode));

      nodes.forEach((x) => {
        const edge = createEdge(uuid(), node.data().id, x.data().id, false, graphLinkType);
        this.draw(edge);
      });

      this.onGraphChange();
    }
  };

  addDirectConstraint = (graphLinkType) => {
    const nodes = this.graph.nodes(':selected');

    if (canAddDirectConstraint(nodes, graphLinkType)) {
      const oldEdge = hasEdge(nodes, graphLinkType);

      if (!oldEdge && this.lastestSelectedNode) {
        const target = this.lastestSelectedNode;
        const source = nodes.find((x) => x !== target);
        this.draw(createEdge(uuid(), source.data().id, target.data().id, false, graphLinkType));
        this.onGraphChange();
      } else if (!oldEdge && !this.lastestSelectedNode) {
        this.draw(createEdge(uuid(), nodes[0].data().id, nodes[1].data().id, false, graphLinkType));
        this.onGraphChange();
      } else if (oldEdge) {
        this.remove(oldEdge);
        const { source } = oldEdge.data();
        oldEdge.data().source = oldEdge.data().target;
        oldEdge.data().target = source;
        this.draw(oldEdge);

        this.onGraphChange();
      }
    }
  };

  clear = () => {
    this.graph.elements().remove();
  };

  _getNodeInspections = (inspection) => {
    const inspections = [];
    const keys = Object.keys(NODE_INSPECTION);

    keys.forEach((key) => {
      // eslint-disable-next-line no-bitwise
      if (NODE_INSPECTION[key] & inspection) {
        inspections.push({
          type: NODE_INSPECTION[key],
          text: Language.get(NODE_INPECTION_TEXT_KEY[NODE_INSPECTION[key]]),
        });
      }
    });

    return inspections;
  };

  getInspectionsReportData = () => {
    let inspections = [];
    this.graph.nodes().forEach((node) => {
      const nodeData = node.data();
      if (nodeData.type === GRAPH_NODE_TYPE.INSPECTION) {
        let nodeInspections = this._getNodeInspections(nodeData.inspection);
        nodeInspections = nodeInspections.map((e) => ({ ...e, node: nodeData.node }));
        inspections = inspections.concat(nodeInspections);
      }
    });
    return inspections;
  };
}

export default GraphManager;
