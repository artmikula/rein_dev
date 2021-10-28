import { TEST_DATA_SHORTCUT } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import React from 'react';
import BaseSubMenu from '../BaseSubMenu';

export default function TestDataMenu() {
  return <BaseSubMenu shortcuts={TEST_DATA_SHORTCUT} domainEvent={domainEvents.TEST_DATA_MENU_DOMAINEVENT} />;
}
