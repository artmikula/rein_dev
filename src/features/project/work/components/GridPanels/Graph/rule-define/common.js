import { GRAPH_NODE_TYPE } from 'features/shared/constants';

export const twoCauseDefinitionDoNotHasASameExclusive = (currentNode, graphData, definitionSet) => {
  if (currentNode.type !== GRAPH_NODE_TYPE.CAUSE) {
    return false;
  }

  const currentDefinition = currentNode.definition.trim().toUpperCase();

  if (!definitionSet.has(currentDefinition)) {
    return false;
  }

  const { graphNodes, constraints } = graphData;
  for (let i = 0; i < graphNodes.length; i++) {
    const graphNode = graphNodes[i];

    if (graphNode.type === GRAPH_NODE_TYPE.CAUSE) {
      const definition = graphNode.definition.trim().toUpperCase();

      if (definitionSet.has(definition) && definition !== currentDefinition) {
        const exclusives = constraints.filter((x) => x.type === GRAPH_NODE_TYPE.EXCLUSIVE);

        for (let j = 0; j < exclusives.length; j++) {
          const exclusive = exclusives[j];

          if (
            exclusive.nodes.some((x) => x.graphNodeId === currentNode.id) &&
            exclusive.nodes.some((x) => x.graphNodeId === graphNode.id)
          ) {
            return false;
          }
        }

        return true;
      }
    }
  }

  return false;
};

export const a = {};
