interface ITestAssertionRow {
  graphNodeId: string;
  nodeId: string;
  definition: string;
  result: boolean;
}

interface ITestCaseRow {
  [key: string]: any;
  id: string;
  Name: string;
  isSelected: boolean;
  results?: string;
  isLastRow?: boolean;
}

interface ITestScenarioAndCaseRow {
  [key: string]: any;
  id: string;
  Name: string;
  isSelected: boolean;
  resultType: string;
  effectDefinition: string;
  results?: string;
  isBaseScenario?: boolean;
  isValid?: boolean;
  testAssertions?: ITestAssertionRow[];
  testCases?: ITestCaseRow[];
  isViolated?: boolean;
  sourceTargetType?: string;
  totalPage: number;
  page: number;
}

interface ITestScenarioAndCaseColumn {
  headerName: string;
  key: string;
  title?: string;
}

interface ITestScenarioReport {
  [key: string]: any;
  name: string;
  cause: number;
  group: number;
  bools: ITestScenarioReport[];
  expectedResults?: string;
}

interface ITestCaseReport {
  [key: string]: any;
  name: string;
  causes: [];
  definition?: string;
  expectedResults?: string;
}

export type {
  ITestAssertionRow,
  ITestCaseRow,
  ITestScenarioAndCaseRow,
  ITestScenarioAndCaseColumn,
  ITestScenarioReport,
  ITestCaseReport,
};
