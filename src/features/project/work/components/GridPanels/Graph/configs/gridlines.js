import gridGuide from 'cytoscape-grid-guide';
import cytoscape from '../lib/cytoscapejs';

const config = {
  gridSpacing: 10,
  snapToGridOnRelease: false,
  guidelinesStyle: {
    strokeStyle: 'black',
    horizontalDistColor: '#ff0000',
    verticalDistColor: 'green',
    initPosAlignmentColor: '#0000ff',
  },
};

const gridlinesSetup = (cy) => {
  if (!cy.gridGuide) {
    gridGuide(cytoscape);
  }

  return cy.gridGuide(config);
};

export default gridlinesSetup;
