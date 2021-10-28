import { SubMenu } from 'features/shared/components';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import PropTypes from 'prop-types';
import React from 'react';

export default function BaseSubMenu({ shortcuts, domainEvent }) {
  const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const actions = shortcuts.map(({ text, code, shortcutKeys }) => {
    return {
      text: Language.get(text),
      shortcutKeys: shortcutKeys.map((shorcutKey) => capitalizeFirstLetter(shorcutKey)),
      action: () => {
        eventBus.publish(domainEvent, { code });
      },
    };
  });

  return <SubMenu actions={actions} className="mh-100" />;
}

BaseSubMenu.propTypes = {
  shortcuts: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      shorcutKey: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ).isRequired,
  domainEvent: PropTypes.string.isRequired,
};
