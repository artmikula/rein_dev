import { TEMPLATE_SHORTCUT } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import React from 'react';
import BaseSubMenu from '../BaseSubMenu';

export default function TemplateMenu() {
  return (
    <BaseSubMenu
      shortcuts={TEMPLATE_SHORTCUT}
      domainEvent={domainEvents.TEST_CASE_MENU_DOMAINEVENT}
      className="mh-100"
    />
  );
}
