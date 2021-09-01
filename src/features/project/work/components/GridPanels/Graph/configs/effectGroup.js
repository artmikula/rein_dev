import { GRAPH_NODE_TYPE } from 'features/shared/constants';
import appConfig from 'features/shared/lib/appConfig';

const effectGroupSetup = (cy, onEffectGroupChange) => {
  const { container } = cy._private;

  let effectGroupDOM;
  let effectNode;
  let x;
  let y;

  const _getId = (effectNode) => `popup_effect_group_${effectNode.data().id}`;

  const _createEffectGroup = (x, y) => {
    const { effectGroup } = effectNode.data();

    effectGroupDOM = document.createElement('div');
    effectGroupDOM.setAttribute('id', _getId(effectNode));
    effectGroupDOM.setAttribute('class', 'position-fixed bg-white px-1 small border');

    const top = y;
    const left = x - appConfig.graph.nodeSize / 2;

    effectGroupDOM.setAttribute('style', `top: ${top}px; left: ${left}px; display: block;`);

    const selectDOM = document.createElement('select');
    selectDOM.setAttribute('value', 0);
    selectDOM.setAttribute('class', 'border-0');
    selectDOM.setAttribute('style', `outline: none`);
    selectDOM.setAttribute('name', `effect-group`);
    selectDOM.onmousedown = (e) => e.stopPropagation();
    selectDOM.onchange = (e) => {
      if (effectNode) {
        effectNode.data().effectGroup = parseInt(e.target.value, 10);
        onEffectGroupChange(effectNode);
      }
    };

    effectGroupDOM.appendChild(selectDOM);

    for (let i = 1; i < 10; i++) {
      const optionDOM = document.createElement('option');
      optionDOM.textContent = i;
      optionDOM.setAttribute('value', i);
      optionDOM.setAttribute('id', `popup_effect_group_${i}`);
      if (effectGroup === i) {
        optionDOM.setAttribute('selected', 'true');
      }

      selectDOM.appendChild(optionDOM);
    }

    container.appendChild(effectGroupDOM);
  };

  const _removeEffectGroup = () => {
    if (effectNode) {
      const dom = document.getElementById(_getId(effectNode));
      effectNode = null;

      if (dom) {
        container.removeChild(dom);
      }
    }
  };

  const _showEffectGroup = (e) => {
    _removeEffectGroup();

    effectNode = e.target;
    _createEffectGroup(x, y);
  };

  cy.on('mousedown', 'node', (e) => {
    x = e.originalEvent.offsetX;
    y = e.originalEvent.offsetY;
  });

  cy.on('select', 'node', (e) => {
    const { type } = e.target.data();

    if (type === GRAPH_NODE_TYPE.EFFECT) {
      _showEffectGroup(e);
    }
  });

  cy.on('unselect ', 'node', _removeEffectGroup);
  cy.on('grab', _removeEffectGroup);
  cy.on('dragpan', _removeEffectGroup);
  cy.on('remove', 'node', (e) => {
    if (e.target === effectNode) {
      _removeEffectGroup();
    }
  });
};

export default effectGroupSetup;
