import { getEdgeParams } from 'features/project/work/biz/Graph';
import cytoscape from '../lib/cytoscapejs';
import edgehandles from '../lib/edgehandles';
import { canAddEdge } from '../utils.js';

const edgehandleSetup = (cy) => {
  const config = {
    handlePosition: () => 'middle bottom',
    preview: false,
    edgeParams: (sourceNode, targetNode, i, isNotRelation) => {
      return getEdgeParams(sourceNode, isNotRelation);
    },
    ghostEdgeParams: (sourceNode, ghostNode, isNotRelation) => {
      return getEdgeParams(sourceNode, isNotRelation);
    },
    edgeType: (sourceNode, targetNode) => {
      return canAddEdge(sourceNode, targetNode) ? 'flat' : undefined;
    },
  };

  if (!cy.edgehandles) {
    edgehandles(cytoscape);
  }

  return cy.edgehandles(config);
};

export default edgehandleSetup;
