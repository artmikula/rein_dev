import { CLASSIFY, GRAPH_LINK_TYPE, GRAPH_NODE_TYPE } from 'features/shared/constants';
import appConfig from 'features/shared/lib/appConfig';
import { DEFAULT_NODE_X, DEFAULT_SPACE, EDGE_COLOR } from '../components/GridPanels/Graph/constants';
import { isUndirectConstraintNode } from '../components/GridPanels/Graph/utils';

const allAreCause = (nodes) => {
  return !nodes.some((x) => x._private.data.type !== GRAPH_NODE_TYPE.CAUSE);
};

const allAreEffect = (nodes) => {
  return !nodes.some((x) => x._private.data.type !== GRAPH_NODE_TYPE.EFFECT);
};

const similarityArray = (arr1, arr2) => {
  return !arr1.some((x) => !arr2.some((y) => y === x)) && !arr2.some((x) => !arr1.some((y) => y === x));
};

const getEdges = (nodes, graphNodeType) => {
  const _edges = [];

  nodes.forEach((node) => {
    const { edges } = node._private;
    edges.forEach((edge) => {
      if (edge._private.source._private.data.type === graphNodeType) {
        _edges.push(edge);
      }
    });
  });

  return _edges;
};

const hasUndirectConstraint = (nodes, graphNodeType) => {
  const undirectConstraintEdges = getEdges(nodes, graphNodeType);

  for (let i = 0; i < undirectConstraintEdges.length; i++) {
    const undirectConstraintEdge = undirectConstraintEdges[i];
    const { source } = undirectConstraintEdge._private;
    const targets = source._private.edges.map((edge) => edge._private.target);

    if (similarityArray(targets, nodes)) {
      return true;
    }
  }
  return false;
};

export const hasEdge = (nodes, type) => {
  const targetEdges = nodes[0]._private.edges;
  const sourceEdges = nodes[1]._private.edges;
  return targetEdges.find((x) => x._private.data.type === type && sourceEdges.some((y) => y === x));
};

export const canAddUndirectConstraint = (nodes, graphNodeType) => {
  return !(nodes.length <= 1 || !allAreCause(nodes) || hasUndirectConstraint(nodes, graphNodeType));
};

export const canAddDirectConstraint = (nodes, graphLinkType) => {
  return !(
    nodes.length !== 2 ||
    (!allAreEffect(nodes) && graphLinkType === GRAPH_LINK_TYPE.MASK) ||
    (!allAreCause(nodes) && graphLinkType === GRAPH_LINK_TYPE.REQUIRE)
  );
};

export const getEdgeParams = (sourceNode, isNotRelation) => {
  const params = {
    data: {
      type: isUndirectConstraintNode(sourceNode) ? sourceNode._private.data.type : GRAPH_LINK_TYPE.NONE,
      isNotRelation,
      lineColor: isNotRelation ? EDGE_COLOR.NOT_RELATION : EDGE_COLOR.RELATION,
      lineWidth: appConfig.graph.lineWidth,
    },
  };
  if (isUndirectConstraintNode(sourceNode)) {
    params.data.lineColor = EDGE_COLOR.CONSTRAINT;
  }
  return params;
};

export const getOldEdges = (sourceEdges, targetEdges, addedEle) => {
  return sourceEdges.filter(
    (sourceEdge) =>
      targetEdges.some((targetEdge) => targetEdge === sourceEdge) &&
      addedEle !== sourceEdge &&
      sourceEdge._private.data.type === addedEle._private.data.type
  );
};

export const getRenderCauseEffectPostition = (nodes, type) => {
  let maxY = 0;
  nodes.forEach((x) => {
    if (x._private.data.type === type && x._private.position.y > maxY) {
      maxY = x._private.position.y;
    }
  });
  return {
    x: type === GRAPH_NODE_TYPE.CAUSE ? DEFAULT_NODE_X.CAUSE : DEFAULT_NODE_X.EFFECT,
    y: maxY + DEFAULT_SPACE,
  };
};

export const getNextGroupNodeIndex = (nodes) => {
  let maxIndex = 0;
  nodes.forEach((x) => {
    if (x._private.data.type === GRAPH_NODE_TYPE.GROUP) {
      const index = parseInt(x._private.data.nodeId.replace(CLASSIFY.GROUP_PREFIX, ''), 10);
      if (index > maxIndex) {
        maxIndex = index;
      }
    }
  });
  return ++maxIndex;
};

export const getRenderUndirectConstraintPosition = (nodes) => {
  let max = Number.MIN_SAFE_INTEGER;
  let min = Number.MAX_SAFE_INTEGER;
  nodes.forEach((node) => {
    const { y } = node._private.position;
    max = y > max ? y : max;
    min = y < min ? y : min;
  });
  return { x: 50, y: (min + max) / 2 };
};
