import { GRAPH_NODE_TYPE, NODE_INSPECTION } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import { NODE_INPECTION_TEXT_KEY } from '../constants';

const inspectionSetup = (cy) => {
  const { container } = cy._private;

  const _getId = (id) => `popup_inspection_${id}`;

  const _getInspections = (inspection) => {
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

  const _hide = (inspectionNode) => {
    const inspectionDOM = document.getElementById(_getId(inspectionNode.data().id));
    if (inspectionDOM) {
      container.removeChild(inspectionDOM);
    }
  };

  const _createItem = (inspection) => {
    const item = document.createElement('div');
    item.textContent = inspection.text;

    if (inspection.type === NODE_INSPECTION.DisconnectedNode) {
      item.setAttribute('class', 'text-danger font-weight-bold');
    }

    return item;
  };

  const _createContainer = (inspectionNode) => {
    const { id, node } = inspectionNode.data();

    const inspectionDOM = document.createElement('div');
    inspectionDOM.setAttribute('id', _getId(id));
    inspectionDOM.setAttribute('class', 'inspection position-fixed bg-white px-2 py-1 small border');
    // inspection title
    const title = document.createElement('div');
    title.setAttribute('class', 'font-weight-bold');
    title.textContent = `${Language.get('inspection')} ${node}:`;
    inspectionDOM.appendChild(title);

    return inspectionDOM;
  };

  const _show = (e, inspectionNode) => {
    const { inspection } = inspectionNode.data();

    const inspectionDOM = _createContainer(inspectionNode);
    // inspection items
    const sortedInspections = _getInspections(inspection).sort((a, b) => a.type - b.type);
    sortedInspections.forEach((inspection) => {
      inspectionDOM.appendChild(_createItem(inspection));
    });
    // show inspection popup on screen
    container.appendChild(inspectionDOM);
    // set position
    const { offsetX, offsetY } = e;
    const { clientWidth, clientHeight } = inspectionDOM;
    let top = offsetY + 30;
    let left = offsetX;

    if (offsetX + clientWidth > container.clientWidth && offsetX > clientWidth) {
      left = container.clientWidth - clientWidth;
    }

    if (offsetY + clientHeight > container.clientHeight && offsetY > clientHeight) {
      top = container.clientHeight - clientHeight;
    }

    inspectionDOM.style.top = `${top}px`;
    inspectionDOM.style.left = `${left}px`;
  };

  cy.on('mouseover', 'node', (e) => {
    if (e.target.data().type === GRAPH_NODE_TYPE.INSPECTION) {
      _show(e.originalEvent, e.target);
    }
  });

  cy.on('mouseout', 'node', (e) => {
    if (e.target.data().type === GRAPH_NODE_TYPE.INSPECTION) {
      _hide(e.target);
    }
  });

  return cy;
};

export default inspectionSetup;
