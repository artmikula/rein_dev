/* eslint-disable no-bitwise */
import { GRAPH_LINK_TYPE, GRAPH_NODE_TYPE, NODE_INSPECTION, OPERATOR_TYPE } from 'features/shared/constants';
import { INSPECTION_PALETTES } from 'features/shared/inspection-palettes';
import appConfig from 'features/shared/lib/appConfig';
import { differenceWith, isEqual } from 'lodash';
import { DEFAULT_NODE_X, EDGE_COLOR, NODE_BG_COLOR } from './constants';
import P5 from './lib/p5';
import ruleDefine from './rule-define';

export const caculateInsplectionPalette = (graphData) => {
  graphData.graphNodes.forEach((graphNode) => {
    if (graphNode.inspectionPalettes) {
      const inspectionPaletteResults = new Set();

      graphNode.inspectionPalettes.split(',').forEach((paletteCode) => {
        const palette = INSPECTION_PALETTES[paletteCode];

        if (palette) {
          palette.rules.forEach((ruleCode) => {
            if (ruleDefine[ruleCode]({ currentNode: graphNode, graphData })) {
              inspectionPaletteResults.add(ruleCode);
            }
          });
        }
      });

      const _graphNode = graphNode;
      _graphNode.inspectionPaletteResults = [...inspectionPaletteResults].sort().join(',');
    }
  });

  return graphData;
};

export const isUndirectConstraint = (type) =>
  type === GRAPH_LINK_TYPE.EXCLUSIVE || type === GRAPH_LINK_TYPE.INCLUSIVE || type === GRAPH_LINK_TYPE.ONLYONE;

export const isUndirectConstraintNodeType = (type) =>
  type === GRAPH_NODE_TYPE.EXCLUSIVE || type === GRAPH_NODE_TYPE.INCLUSIVE || type === GRAPH_NODE_TYPE.ONLYONE;

export const isUndirectConstraintNode = (node) => isUndirectConstraintNodeType(node.data().type);

export const isDirectConstraint = (type) => type === GRAPH_LINK_TYPE.MASK || type === GRAPH_LINK_TYPE.REQUIRE;

export const isActiveNode = (node) => {
  const { type } = node.data();
  return (
    type === GRAPH_NODE_TYPE.EFFECT ||
    type === GRAPH_NODE_TYPE.CAUSE ||
    type === GRAPH_NODE_TYPE.GROUP ||
    type === GRAPH_NODE_TYPE.EXCLUSIVE ||
    type === GRAPH_NODE_TYPE.INCLUSIVE ||
    type === GRAPH_NODE_TYPE.ONLYONE
  );
};

export const getConstraintTypeFromNodeType = (type) => {
  switch (type) {
    case GRAPH_NODE_TYPE.EXCLUSIVE:
      return GRAPH_LINK_TYPE.EXCLUSIVE;
    case GRAPH_NODE_TYPE.INCLUSIVE:
      return GRAPH_LINK_TYPE.INCLUSIVE;
    case GRAPH_NODE_TYPE.ONLYONE:
      return GRAPH_LINK_TYPE.ONLYONE;
    default:
      return GRAPH_LINK_TYPE.NONE;
  }
};

export const getNodeTypeFromConstraintType = (type) => {
  switch (type) {
    case GRAPH_LINK_TYPE.EXCLUSIVE:
      return GRAPH_NODE_TYPE.EXCLUSIVE;
    case GRAPH_LINK_TYPE.INCLUSIVE:
      return GRAPH_NODE_TYPE.INCLUSIVE;
    case GRAPH_LINK_TYPE.ONLYONE:
      return GRAPH_NODE_TYPE.ONLYONE;
    default:
      return null;
  }
};

export const getNodeLabelFromUnconstraintConstraintType = (type) => {
  switch (type) {
    case GRAPH_LINK_TYPE.EXCLUSIVE:
      return 'E';
    case GRAPH_LINK_TYPE.INCLUSIVE:
      return 'I';
    case GRAPH_LINK_TYPE.ONLYONE:
      return 'O';
    default:
      return null;
  }
};

export const getIconPosition = (node, type) => {
  const { x, y } = node.position();
  const { nodeSize } = appConfig.graph;
  if (type === GRAPH_NODE_TYPE.PIN) {
    return { x: x + nodeSize / 2, y: y - nodeSize / 2 };
  }
  return { x: x - (nodeSize / 2 + 5), y: y - 25 };
};

export const translationByAngle = (x, y, distance, angle) => {
  let _angle;

  if (angle >= (Math.PI * 3) / 2) {
    _angle = 2 * Math.PI - angle;
  } else if (angle >= Math.PI) {
    _angle = Math.PI - angle;
  } else if (angle >= Math.PI / 2) {
    _angle = Math.PI - angle;
  } else {
    _angle = -angle;
  }

  let deltaX = distance * Math.cos(_angle);
  let deltaY = distance * Math.sin(_angle);
  deltaX = angle > Math.PI / 2 && angle < (Math.PI * 3) / 2 ? -Math.abs(deltaX) : Math.abs(deltaX);
  deltaY = angle > 0 && angle < Math.PI ? Math.abs(deltaY) : -Math.abs(deltaY);

  return { x: x + deltaX, y: y + deltaY };
};

export const createGraphNode = (
  id,
  nodeId,
  type,
  positionX,
  positionY,
  inspection,
  definitionId = '',
  definition = ''
) => ({
  id,
  nodeId,
  type,
  positionX,
  positionY,
  targetType: type === 'Group' ? OPERATOR_TYPE.AND : OPERATOR_TYPE.OR,
  isLocked: false,
  effectGroup: 1,
  inspection,
  definitionId,
  definition,
});

export const createEdge = (id, sourceId, targetId, isNotRelation, type) => {
  const edge = {
    group: 'edges',
    data: {
      id,
      source: sourceId,
      target: targetId,
      isNotRelation,
      type,
      lineWidth: appConfig.graph.lineWidth,
      edgeType: isDirectConstraint(type) ? 'unbundled-bezier' : 'bezier',
    },
  };
  edge.data.lineColor = isNotRelation ? EDGE_COLOR.NOT_RELATION : EDGE_COLOR.RELATION;
  edge.data.label = type === GRAPH_LINK_TYPE.MASK ? 'M' : '';
  edge.data.label = type === GRAPH_LINK_TYPE.REQUIRE ? 'R' : edge.data.label;

  if (isUndirectConstraint(type) || isDirectConstraint(type)) {
    edge.data.lineColor = EDGE_COLOR.CONSTRAINT;
  }

  return edge;
};

export const createIconNode = (node, type) => {
  const { id, inspection, nodeId, inspectionPaletteResults } = node.data();
  let bgImage = type === GRAPH_NODE_TYPE.PIN ? '/img/pinIcon.svg' : '/img/warningIcon.svg';
  if (type === GRAPH_NODE_TYPE.INSPECTION) {
    bgImage =
      inspection & NODE_INSPECTION.DisconnectedNode || (inspectionPaletteResults && inspectionPaletteResults.length > 0)
        ? '/img/errorIcon.svg'
        : bgImage;
  }
  return {
    group: 'nodes',
    data: {
      id: `${type}_${id}`,
      size: '15px',
      type,
      shape: 'rectangle',
      inspection,
      node: nodeId,
      zIndex: 1,
      bgImage,
      inspectionPaletteResults,
    },
    position: getIconPosition(node, type),
    grabbable: false,
    selectable: false,
  };
};

export const createAngleNode = (node) => {
  const { id } = node.data();
  const _id = `${GRAPH_NODE_TYPE.ANGLE}_${id}`;
  const size = `${appConfig.graph.nodeSize + 40}px`;
  const _size = appConfig.graph.nodeSize + 40;

  return {
    group: 'nodes',
    data: { id: _id, size, _size, type: GRAPH_NODE_TYPE.ANGLE, zIndex: 0 },
    position: node.position(),
    grabbable: false,
    selectable: false,
  };
};

export const createOperatorNode = (node, angleObj) => {
  const { id, targetType } = node.data();
  const _id = `${GRAPH_NODE_TYPE.OPERATOR_TYPE}_${id}`;
  const bgImage = targetType === OPERATOR_TYPE.OR ? '/img/operator_or.svg' : '/img/operator_and.svg';
  const angle = angleObj.antiClockWise
    ? (angleObj.end + angleObj.start - 2 * Math.PI) / 2
    : (angleObj.end + angleObj.start) / 2;
  const delta = (appConfig.graph.nodeSize + 80) / 2;

  return {
    group: 'nodes',
    data: { id: _id, type: GRAPH_NODE_TYPE.OPERATOR_TYPE, zIndex: 0, node, bgImage, size: '30px' },
    position: translationByAngle(node.position().x, node.position().y, delta, angle),
    grabbable: false,
    selectable: false,
  };
};

export const convertGraphNodeToNode = (graphNode) => {
  const { type, positionX, positionY, isLocked, inspection, ...others } = graphNode;
  const _size = appConfig.graph.nodeSize;
  const size = `${_size}px`;
  const { lineWidth } = appConfig.graph;
  const node = {
    group: 'nodes',
    data: { size, _size, lineWidth, type, isLocked, zIndex: 1, inspection, ...others },
    position: { x: positionX, y: positionY },
    grabbable: !isLocked,
  };

  switch (type) {
    case GRAPH_NODE_TYPE.CAUSE:
      node.data.bgColor = appConfig.graph.causeColor;
      break;
    case GRAPH_NODE_TYPE.EFFECT:
      node.data.bgColor = appConfig.graph.effectColor;
      break;
    case GRAPH_NODE_TYPE.GROUP:
      node.data.bgColor = appConfig.graph.groupColor;
      break;
    case GRAPH_NODE_TYPE.EXCLUSIVE:
    case GRAPH_NODE_TYPE.INCLUSIVE:
    case GRAPH_NODE_TYPE.ONLYONE:
      node.data.fontSize = '20px';
      node.data.size = '25px';
      break;
    default:
      node.data.bgColor = NODE_BG_COLOR.DEFAULT;
      break;
  }

  // eslint-disable-next-line no-bitwise
  node.data.bgColor = inspection & NODE_INSPECTION.DisconnectedNode ? appConfig.graph.errorColor : node.data.bgColor;

  return node;
};

export const convertGraphLinkToEdge = (graphLink) => {
  const { id, source, target, isNotRelation, type } = graphLink;

  return createEdge(id, source.id, target.id, isNotRelation, type);
};

export const convertNodeToGraphNode = (node) => {
  const { x, y, ...others } = node;

  return { positionX: x, positionY: y, ...others };
};

export const convertEdgeToGraphLink = (edge, nodes) => {
  const { source, target, ...others } = edge;
  const sourceNode = (nodes || []).find((x) => x.id === source);
  const targetNode = (nodes || []).find((x) => x.id === target);

  return { sourceId: source, targetId: target, source: sourceNode, target: targetNode, ...others };
};

export const convertNodeToUndirectConstraint = (node) => {
  const { type, x, y, edges, ...others } = node;

  return {
    type: getConstraintTypeFromNodeType(type),
    positionX: x,
    positionY: y,
    nodes: edges.map((edge) => ({ graphNodeId: edge.target, isNotRelation: edge.isNotRelation })),
    ...others,
  };
};

export const convertEdgeToDirectConstraint = (edge) => {
  const { source, target, ...others } = edge;

  return {
    positionX: 0,
    positionY: 0,
    nodes: [
      { graphNodeId: source, isNotRelation: false },
      { graphNodeId: target, isNotRelation: false },
    ],
    ...others,
  };
};

export const convertDirectConstraintToEdge = (constraint) => {
  const { id, type, nodes } = constraint;

  return createEdge(id, nodes[0].graphNodeId, nodes[1].graphNodeId, false, type);
};

export const convertUndirectConstraintToNode = (constraint) => {
  const { id, type, positionX, positionY } = constraint;
  const nodeId = getNodeLabelFromUnconstraintConstraintType(type);

  return convertGraphNodeToNode(createGraphNode(id, nodeId, type, positionX, positionY, false));
};

export const convertUndirectConstraintToEdges = (constraint) => {
  const { id, type, nodes } = constraint;

  return nodes.map((node) => createEdge(`${id}_${node.graphNodeId}`, id, node.graphNodeId, node.isNotRelation, type));
};

export const canAddEdge = (sourceNode, targetNode) => {
  if (sourceNode === targetNode) {
    return false;
  }

  const sourceType = sourceNode?.data()?.type;
  const targetType = targetNode?.data()?.type;

  if (isUndirectConstraintNodeType(sourceType) && targetType === GRAPH_NODE_TYPE.CAUSE) {
    return true;
  }

  if (
    (sourceType === GRAPH_NODE_TYPE.CAUSE || sourceType === GRAPH_NODE_TYPE.GROUP) &&
    (targetType === GRAPH_NODE_TYPE.GROUP || targetType === GRAPH_NODE_TYPE.EFFECT)
  ) {
    return true;
  }

  if (sourceType === GRAPH_NODE_TYPE.EFFECT && targetType === GRAPH_NODE_TYPE.EFFECT) {
    const sourceEffectGroup = sourceNode?.data()?.effectGroup;
    const targetEffectGroup = targetNode?.data()?.effectGroup;

    if (sourceEffectGroup !== targetEffectGroup) {
      return true;
    }
  }

  return false;
};

export const compareNodeArray = (oldNodes, newNodes) => {
  const addNodes = [];
  const updateNodes = [];
  newNodes.forEach((x) => {
    const oldNode = oldNodes.find((y) => y.id === x.id);
    if (!oldNode) {
      addNodes.push(x);
    } else if (!isEqual(x, oldNode)) {
      updateNodes.push(x);
    }
  });
  const removeNodes = differenceWith(oldNodes, newNodes, (a, b) => a.id === b.id);

  return {
    addNodes,
    updateNodes,
    removeNodes,
  };
};

export const compareEdgeArray = (oldEdges, newEdges) => {
  const addEdges = [];
  const updateEdges = [];
  newEdges.forEach((x) => {
    const oldEdge = oldEdges.find((y) => y.id === x.id);
    if (!oldEdge) {
      addEdges.push(x);
    } else if (!isEqual(x, oldEdge)) {
      updateEdges.push(x);
    }
  });
  const removeEdges = differenceWith(oldEdges, newEdges, (a, b) => a.id === b.id);

  return {
    addEdges,
    updateEdges,
    removeEdges,
  };
};

export const calculateAngle = (x1, y1, x2, y2) => {
  const axisS = new P5.Vector(50, 0);
  const lingAngle = new P5.Vector(x2 - x1, y2 - y1);
  return axisS.angleBetween(lingAngle);
};

export const edgeAngle = (edges) => {
  const angles = edges.map((edge) => {
    const sourcePos = edge.source().position();
    const targetPos = edge.target().position();
    const angle = calculateAngle(targetPos.x, targetPos.y, sourcePos.x, sourcePos.y);

    return angle < 0 ? 2 * Math.PI + angle : angle;
  });
  angles.sort((a, b) => a - b);
  let max = Number.MIN_SAFE_INTEGER;
  let start;
  let end;

  for (let i = 0; i < angles.length; i++) {
    const angle = i === angles.length - 1 ? 2 * Math.PI - angles[i] + angles[0] : angles[i + 1] - angles[i];

    if (angle >= max) {
      max = angle;
      start = angles[i];
      end = i === angles.length - 1 ? angles[0] : angles[i + 1];
    }
  }

  return { start: start > end ? end : start, end: end < start ? start : end, antiClockWise: start < end };
};

export const separateNodes = (nodes) => {
  const undirectConstraintNodes = [];
  const graphNodes = [];

  nodes.forEach((node) => {
    if (isUndirectConstraintNodeType(node.type)) {
      undirectConstraintNodes.push(node);
    } else {
      graphNodes.push(node);
    }
  });

  return { undirectConstraintNodes, graphNodes };
};

export const separateEdges = (edges) => {
  const directConstraints = [];
  const graphLinks = [];

  edges.forEach((edge) => {
    if (isDirectConstraint(edge.type)) {
      directConstraints.push(edge);
    } else {
      graphLinks.push(edge);
    }
  });

  return { directConstraints, graphLinks };
};

const _getMaxDirectConstraintRadius = (edges, type) => {
  let maxRadius = 0;
  const directConstraints = edges.filter((edge) => edge.data().type === type);

  directConstraints.forEach((directConstraint) => {
    const radius = Math.abs((directConstraint.source().position().y - directConstraint.target().position().y) / 2 - 30);
    maxRadius = radius > maxRadius ? radius : maxRadius;
  });

  return maxRadius;
};

export const getGraphSize = (nodes, edges) => {
  const sortedX = nodes.map((node) => node.position().x).sort((a, b) => a - b);
  const sortedY = nodes.map((node) => node.position().y).sort((a, b) => a - b);
  const maxMaskRadius = _getMaxDirectConstraintRadius(edges, GRAPH_LINK_TYPE.MASK);
  const maxRequireRadius = _getMaxDirectConstraintRadius(edges, GRAPH_LINK_TYPE.REQUIRE);
  let maxX = DEFAULT_NODE_X.EFFECT + maxMaskRadius;
  maxX = sortedX[sortedX.length - 1] > maxX ? sortedX[sortedX.length - 1] : maxX;
  let minX = DEFAULT_NODE_X.CAUSE - maxRequireRadius;
  minX = sortedX[0] < minX ? sortedX[0] : minX;
  const maxY = sortedY[sortedX.length - 1];
  const minY = sortedY[0];
  const width = maxX - minX + appConfig.graph.nodeSize;
  const height = maxY - minY + appConfig.graph.nodeSize;
  return { width, height };
};

export const covertGraphStateToSavedData = (graphState) => {
  const { nodeState, edgeState } = graphState;
  const { undirectConstraintNodes, graphNodes } = separateNodes(nodeState);
  const { directConstraints, graphLinks } = separateEdges(edgeState);

  const constraints = undirectConstraintNodes.map((x) => convertNodeToUndirectConstraint(x));
  directConstraints.forEach((x) => constraints.push(convertEdgeToDirectConstraint(x)));

  const nodes = graphNodes.map((x) => convertNodeToGraphNode(x));
  const links = graphLinks.map((x) => convertEdgeToGraphLink(x, nodes));

  return {
    graphNodes: nodes,
    graphLinks: links,
    constraints,
  };
};
