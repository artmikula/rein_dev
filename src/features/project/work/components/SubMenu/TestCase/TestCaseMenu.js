import { SubMenu } from 'features/shared/components';
import { TEST_CASE_SHORTCUT } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import React from 'react';

export default function TestCaseMenu() {
  const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const actions = TEST_CASE_SHORTCUT.map(({ text, code, shortcutKeys }) => {
    return {
      text: Language.get(text),
      shortcutKeys: shortcutKeys.map((shorcutKey) => capitalizeFirstLetter(shorcutKey)),
      action: () => {
        eventBus.publish(domainEvents.TEST_CASE_MENU_DOMAINEVENT, { code });
      },
    };
  });

  return <SubMenu actions={actions} className="mh-100" />;
}
