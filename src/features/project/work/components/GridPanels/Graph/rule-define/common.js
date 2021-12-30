import { GRAPH_NODE_TYPE } from 'features/shared/constants';
import { PALETTE_CODES } from 'features/shared/inspection-palettes';

// true: violate rule, false: valid
export const nodesSagSwellInterruptionHaveToConnectedWithOneAndOnlyConst = (currentNode, graphData) => {
  if (currentNode.type !== GRAPH_NODE_TYPE.CAUSE) {
    return false;
  }

  const hasSagSwellInterruptionPalette = (node) => {
    if (!node.inspectionPalettes) {
      return false;
    }
    const arr = node.inspectionPalettes.split(',');
    return !!arr.find((x) => x === PALETTE_CODES.Sag || x === PALETTE_CODES.Swell || x === PALETTE_CODES.Interruption);
  };

  const { graphNodes, constraints } = graphData;

  const checkingNodes = graphNodes.filter(hasSagSwellInterruptionPalette);
  if (checkingNodes.length <= 1) {
    return false;
  }

  const onlyOneContrainIncludesAllCheckingNodes = (x) => {
    const result =
      x.type === GRAPH_NODE_TYPE.ONLYONE && checkingNodes.every((n) => x.nodes.find((y) => y.graphNodeId === n.id));
    return result;
  };

  const hasOnlyOneConstrainIncludesAllCheckingNodes = !!constraints.find(onlyOneContrainIncludesAllCheckingNodes);

  return !hasOnlyOneConstrainIncludesAllCheckingNodes;
};

export const a = {};
