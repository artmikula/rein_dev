import { GRAPH_NODE_TYPE } from 'features/shared/constants';

const definitionTooltipSetup = (cy) => {
  const { container } = cy._private;
  let definitionDOM;
  let timeout;

  const createDefinitionToolTip = () => {
    definitionDOM = document.createElement('div');
    definitionDOM.setAttribute('id', `popup_definition`);
    definitionDOM.setAttribute('style', `top: 0px; left: 0px; display: none; max-width: 300px`);
    definitionDOM.setAttribute('class', 'position-fixed bg-white px-2 py-1 small border');
    container.appendChild(definitionDOM);

    window.definitionDOM = definitionDOM;
  };

  const hideDefinitionToolTip = () => {
    definitionDOM.style.display = 'none';
  };

  const showDefinitionToolTip = (e) => {
    clearTimeout(timeout);
    hideDefinitionToolTip();

    const { definition } = e.target.data();

    definitionDOM.textContent = definition;
    definitionDOM.style.display = 'block';

    const { offsetX, offsetY } = e.originalEvent;
    const { clientWidth, clientHeight } = definitionDOM;
    let top = offsetY + 30;
    let left = offsetX;

    if (offsetX + clientWidth > container.clientWidth && offsetX > clientWidth) {
      left = container.clientWidth - clientWidth;
    }

    if (offsetY + clientHeight > container.clientHeight && offsetY > clientHeight) {
      top = container.clientHeight - clientHeight;
    }

    definitionDOM.style.top = `${top}px`;
    definitionDOM.style.left = `${left}px`;
  };

  createDefinitionToolTip();

  cy.on('mouseover', 'node', (e) => {
    const { type } = e.target.data();

    if (type === GRAPH_NODE_TYPE.EFFECT || type === GRAPH_NODE_TYPE.CAUSE) {
      timeout = setTimeout(() => showDefinitionToolTip(e), 1000);
    }
  });

  cy.on('mouseout', 'node', () => {
    document.body.style.cursor = 'auto';
    clearTimeout(timeout);
    hideDefinitionToolTip();
  });

  cy.on('cxttapstart ', () => {
    clearTimeout(timeout);
    hideDefinitionToolTip();
  });

  cy.on('tapstart ', () => {
    clearTimeout(timeout);
    hideDefinitionToolTip();
  });
};

export default definitionTooltipSetup;
