import { LABELCOLOR } from '../constants';
import cytoscape from '../lib/cytoscapejs';
import { isActiveNode } from '../utils';

const cytoscapeSetup = (container) => {
  const cy = cytoscape({
    container,
    maxZoom: 3,
    minZoom: 0.5,
    style: [
      {
        selector: 'node',
        css: {
          color: LABELCOLOR.NODE,
          fontWeight: 'bold',
          'background-fit': 'cover',
          'overlay-opacity': 0,
          'text-valign': 'center',
          'text-halign': 'center',
        },
      },
      { selector: 'node[nodeId]', css: { label: 'data(nodeId)' } },
      { selector: 'node[fontSize]', css: { 'font-size': 'data(fontSize)' } },
      { selector: 'node[bgImage]', css: { backgroundImage: 'data(bgImage)' } },
      { selector: 'node[zIndex]', css: { 'z-index': 'data(zIndex)' } },
      { selector: 'node[bgColor]', css: { backgroundColor: 'data(bgColor)' } },
      { selector: 'node[shape]', css: { shape: 'data(shape)' } },
      { selector: 'node[size]', css: { width: 'data(size)', height: 'data(size)' } },
      { selector: 'node:selected', css: { 'border-style': 'dashed', 'border-color': 'red', 'border-width': '2px' } },
      {
        selector: 'edge',
        css: {
          'curve-style': 'data(edgeType)',
          'target-arrow-shape': 'triangle',
          'control-point-distances': [0.3, 20, 0, -20, 0.7],
          'control-point-weights': [0.3, 0.4, 0.5, 0.6, 0.7],
        },
      },
      { selector: 'edge[lineWidth]', css: { width: 'data(lineWidth)' } },
      {
        selector: 'edge[lineColor]',
        css: { 'line-color': 'data(lineColor)', 'target-arrow-color': 'data(lineColor)' },
      },
      {
        selector: 'edge[label]',
        css: { label: 'data(label)', color: LABELCOLOR.EDGE, fontWeight: 'bold' },
      },
      { selector: 'edge:selected', css: { 'line-color': 'red', 'target-arrow-color': 'red' } },
      {
        selector: '.eh-handle',
        css: {
          width: '12px',
          height: '12px',
          backgroundColor: 'red',
          'overlay-opacity': 0,
          'border-width': '12px',
          'border-opacity': 0,
        },
      },
      { selector: '.eh-source', style: { 'border-width': 2, 'border-color': 'red' } },
      { selector: '.eh-target', style: { 'border-width': 2, 'border-color': 'red' } },
    ],
  });

  cy.on('mouseover', 'node', (e) => {
    if (e.target._private.classes.has('eh-handle')) {
      document.body.style.cursor = 'alias';
    } else if (isActiveNode(e.target) && e.target.grabbable()) {
      document.body.style.cursor = 'move';
    }
  });

  cy.on('mouseout', 'node', () => {
    document.body.style.cursor = 'auto';
  });

  cy.on('cxttap ', (e) => {
    const ele = e.target;
    if (ele === cy) {
      cy.nodes(':selected').unselect();
      cy.edges(':selected').unselect();
    } else if ((ele.nodes() && isActiveNode(ele)) || ele.isEdge()) {
      if (!ele.selected()) {
        cy.nodes(':selected').unselect();
        cy.edges(':selected').unselect();
        ele.select();
      }
    }
  });

  return cy;
};

export default cytoscapeSetup;
