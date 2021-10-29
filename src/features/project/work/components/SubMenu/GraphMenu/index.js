import { GRAPH_SHORTCUT } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import React from 'react';
import BaseSubMenu from '../BaseSubMenu';

export default function GraphMenu() {
  return <BaseSubMenu shortcuts={GRAPH_SHORTCUT} domainEvent={domainEvents.GRAPH_MENU_DOMAINEVENT} />;
}
