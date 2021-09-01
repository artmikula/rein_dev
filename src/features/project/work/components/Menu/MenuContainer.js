import Language from 'features/shared/languages/Language';
import React from 'react';
import { Nav, NavItem } from 'reactstrap';
import GraphMenu from '../SubMenu/Graph/GraphMenu';
import ProjectMenu from '../SubMenu/Project/ProjectMenu';
import TestCaseMenu from '../SubMenu/TestCase/TestCaseMenu';
import TestDataMenu from '../SubMenu/TestData/TestDataMenu';
import WorkMenu from '../SubMenu/Work/WorkMenu';
import MenuItem from './MenuItem';

export default function MenuContainer() {
  return (
    <Nav className="justify-content-end justify-content-sm-start">
      <NavItem className="mx-1">
        <MenuItem iconClassName="bi bi-journal-richtext" text={Language.get('project')} dropdown={<ProjectMenu />} />
      </NavItem>
      <NavItem className="mx-1">
        <MenuItem iconClassName="bi bi-list-task" text={Language.get('work')} dropdown={<WorkMenu />} />
      </NavItem>
      <NavItem className="mx-1">
        <MenuItem iconClassName="bi bi-graph-up" text={Language.get('graph')} dropdown={<GraphMenu />} />
      </NavItem>
      <NavItem className="mx-1">
        <MenuItem iconClassName="bi bi-file-bar-graph" text={Language.get('testdata')} dropdown={<TestDataMenu />} />
      </NavItem>
      <NavItem className="mx-1">
        <MenuItem iconClassName="bi bi-diagram-3" text={Language.get('testcase')} dropdown={<TestCaseMenu />} />
      </NavItem>
    </Nav>
  );
}
