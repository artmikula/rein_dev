import React from 'react';
import { TEST_DATA_SHORTCUT } from 'features/shared/constants';
import eventBus from 'features/shared/lib/eventBus';
import { SubMenu } from 'features/shared/components';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';

export default function TestDataMenu() {
  const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const actions = TEST_DATA_SHORTCUT.map(({ text, code, shortcutKeys }) => {
    return {
      text: Language.get(text),
      shortcutKeys: shortcutKeys.map((shorcutKey) => capitalizeFirstLetter(shorcutKey)),
      action: () => {
        eventBus.publish(domainEvents.TEST_DATA_MENU_DOMAINEVENT, { code });
      },
    };
  });

  return <SubMenu actions={actions} className="mh-100" />;
}
