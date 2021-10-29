import { TEST_CASE_SHORTCUT } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import React from 'react';
import BaseSubMenu from '../BaseSubMenu';

export default function TestCaseMenu() {
  return <BaseSubMenu shortcuts={TEST_CASE_SHORTCUT} domainEvent={domainEvents.TEST_CASE_MENU_DOMAINEVENT} />;
}
