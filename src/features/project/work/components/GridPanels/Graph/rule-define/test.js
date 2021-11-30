/* eslint-disable prefer-const */
const rule1 = new Set(['SAG', 'SWELL']);
const rule2 = new Set(['SAG', 'INTERRUPTION']);
const rule3 = new Set(['SWELL', 'INTERRUPTION']);

const GRAPH_NODE_TYPE = {
  CAUSE: 'Cause',
  EFFECT: 'Effect',
  GROUP: 'Group',
  EXCLUSIVE: 'Exclusive',
  INCLUSIVE: 'Inclusive',
  ONLYONE: 'OnlyOne',
  PIN: 'PIN',
  INSPECTION: 'INSPECTION',
  ANGLE: 'ANGLE',
  OPERATOR_TYPE: 'OPERATOR_TYPE',
};

const graphData = {
  graphNodes: [
    {
      id: '3d2c9cb6-4db7-42af-b464-a02cd8c145f8',
      positionX: 150,
      positionY: 300,
      effectGroup: 1,
      type: 'Cause',
      nodeId: 'C3',
      childs: null,
      definition: 'INTERRUPTION',
      definitionId: '6b8a0076-fafb-4e2f-a59a-074ea1ec1c47',
      targetType: 'Or',
      isLocked: false,
      workId: 'c70c1e8e-a3f0-415f-9b6e-d6d92b48974a',
      inspection: 1,
      inspectionPalettes: null,
    },
    {
      id: '613497be-c447-416e-9506-147e0b8879af',
      positionX: 150,
      positionY: 100,
      effectGroup: 1,
      type: 'Cause',
      nodeId: 'C1',
      childs: null,
      definition: 'SAG',
      definitionId: '655b9a66-ab4b-4243-a065-f4869ccb76ca',
      targetType: 'Or',
      isLocked: false,
      workId: 'c70c1e8e-a3f0-415f-9b6e-d6d92b48974a',
      inspection: 1,
      inspectionPalettes: null,
    },
    {
      id: '8c9b24a2-230c-40cd-9e9d-379ab2ed928d',
      positionX: 150,
      positionY: 200,
      effectGroup: 1,
      type: 'Cause',
      nodeId: 'C2',
      childs: null,
      definition: 'SWELL',
      definitionId: 'a5377692-8339-4d3a-8cd1-50030d6a48cc',
      targetType: 'Or',
      isLocked: false,
      workId: 'c70c1e8e-a3f0-415f-9b6e-d6d92b48974a',
      inspection: 1,
      inspectionPalettes: null,
    },
  ],
  graphLinks: [],
  constraints: [
    {
      id: '67e97d27-2e41-47db-b35d-5366e90c1934',
      positionX: 50,
      positionY: 150,
      type: 'Exclusive',
      nodes: [
        {
          graphNodeId: '613497be-c447-416e-9506-147e0b8879af',
          isNotRelation: false,
        },
        {
          graphNodeId: '8c9b24a2-230c-40cd-9e9d-379ab2ed928d',
          isNotRelation: false,
        },
      ],
    },
  ],
};

const SAG = graphData.graphNodes[1];
const SWELL = graphData.graphNodes[2];
const INTERRUPTION = graphData.graphNodes[0];

let twoCauseDefinitionDoNotHasASameExclusive = (currentNode, graphData, definitionSet) => {
  if (currentNode.type !== GRAPH_NODE_TYPE.CAUSE) {
    return false;
  }

  const currentDefinition = currentNode.definition.toUpperCase();

  if (!definitionSet.has(currentDefinition)) {
    return false;
  }

  const { graphNodes, constraints } = graphData;
  for (let i = 0; i < graphNodes.length; i++) {
    const graphNode = graphNodes[i];

    if (graphNode.type === GRAPH_NODE_TYPE.CAUSE) {
      const definition = graphNode.definition.toUpperCase();

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

console.log(twoCauseDefinitionDoNotHasASameExclusive(SAG, graphData, rule1));
console.log(twoCauseDefinitionDoNotHasASameExclusive(SAG, graphData, rule2));
console.log(twoCauseDefinitionDoNotHasASameExclusive(SAG, graphData, rule3));

console.log(twoCauseDefinitionDoNotHasASameExclusive(SWELL, graphData, rule1));
console.log(twoCauseDefinitionDoNotHasASameExclusive(SWELL, graphData, rule2));
console.log(twoCauseDefinitionDoNotHasASameExclusive(SWELL, graphData, rule3));

console.log(twoCauseDefinitionDoNotHasASameExclusive(INTERRUPTION, graphData, rule1));
console.log(twoCauseDefinitionDoNotHasASameExclusive(INTERRUPTION, graphData, rule2));
console.log(twoCauseDefinitionDoNotHasASameExclusive(INTERRUPTION, graphData, rule3));
