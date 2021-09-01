import { GRAPH_NODE_TYPE } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';

const contextMenusSetup = (cy, actions) => {
  const { container } = cy._private;
  const menuItems = [
    { id: 'align', languageKey: 'align' },
    { id: 'generate', languageKey: 'generate' },
    { id: 'addGroup', languageKey: 'addgroup' },
    { id: 'delete', languageKey: 'delete', selector: 'node:selected, edge:selected' },
    { id: 'lockPosition', languageKey: 'lockposition', selector: 'node:grabbable:selected' },
    { id: 'unlockPosition', languageKey: 'unlockposition', selector: 'node:ungrabbable:selected' },
    { id: 'addExclusive', languageKey: 'addexclusive', selector: `node:selected[type = "${GRAPH_NODE_TYPE.CAUSE}"]` },
    { id: 'addInclusive', languageKey: 'addinclusive', selector: `node:selected[type = "${GRAPH_NODE_TYPE.CAUSE}"]` },
    {
      id: 'addOnlyOne',
      languageKey: 'addoneandonlyone',
      selector: `node:selected[type = "${GRAPH_NODE_TYPE.CAUSE}"]`,
    },
    { id: 'addRequire', languageKey: 'addrequire', selector: `node:selected[type = "${GRAPH_NODE_TYPE.CAUSE}"]` },
    { id: 'addMask', languageKey: 'addmask', selector: `node:selected[type = "${GRAPH_NODE_TYPE.EFFECT}"]` },
  ];

  let contextmenu;
  let event;

  const _hideItem = (id) => document.getElementById(`graph_menu_item_${id}`).setAttribute('style', `display: none`);

  const _showItem = (id) => document.getElementById(`graph_menu_item_${id}`).setAttribute('style', `display: block`);

  const _hide = () => contextmenu.setAttribute('style', `display: none`);

  const _onMenuItemClick = (e, item) => {
    if (actions[item.id]) {
      actions[item.id](event);
    }
    _hide();
  };

  const _createMenuItem = (item) => {
    const menuItem = document.createElement('button');
    menuItem.textContent = Language.get(item.languageKey);
    menuItem.setAttribute('id', `graph_menu_item_${item.id}`);
    menuItem.setAttribute('class', 'context-menu-item py-2 px-4 text-left bg-white border-0 w-100 font-weight-light');
    menuItem.setAttribute('style', `display: none`);
    menuItem.onclick = (e) => _onMenuItemClick(e, item);
    menuItem.onmousedown = (e) => e.stopPropagation();

    return menuItem;
  };

  const _show = () => {
    let showable = false;
    menuItems.forEach((item) => {
      if (item.selector) {
        const eles = cy.$(item.selector);
        if (eles.find((ele) => ele === event.target)) {
          _showItem(item.id);
          showable = true;
        } else {
          _hideItem(item.id);
        }
      } else {
        _showItem(item.id);
        showable = true;
      }
    });

    if (showable) {
      contextmenu.style.display = 'flex';

      const { offsetX, offsetY } = event.originalEvent;
      const { clientWidth, clientHeight } = contextmenu;
      let top = offsetY + 36;
      let left = offsetX;

      if (offsetX + clientWidth > container.clientWidth && offsetX > clientWidth) {
        left = offsetX - clientWidth;
      }

      if (offsetY + clientHeight > container.clientHeight && offsetY > clientHeight) {
        top = offsetY - clientHeight;
      }

      contextmenu.style.top = `${top}px`;
      contextmenu.style.left = `${left}px`;
    } else {
      _hide();
    }
  };

  const _createContextMenu = () => {
    contextmenu = document.createElement('div');
    contextmenu.setAttribute('id', 'graph_context_menu');
    contextmenu.setAttribute('class', 'context-menu shadow rounded position-fixed flex-column');
    contextmenu.setAttribute('style', `display: none`);

    menuItems.forEach((item) => contextmenu.appendChild(_createMenuItem(item)));

    container.appendChild(contextmenu);
  };

  _createContextMenu();

  cy.on('cxttap', (e) => {
    e.originalEvent.stopPropagation();
    if (e.originalEvent.target.id.search('graph_menu_item_') >= 0) {
      _hide();
    } else {
      event = e;
      _show();
    }
  });

  cy.on('tap', _hide);
};

export default contextMenusSetup;
