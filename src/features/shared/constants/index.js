export const MAX_PROJECT_FILE_SIZE = 2097152; // Byte = 2MB
export const ACCEPTED_PROJECT_FILE = ['.cetaprj'];

export const STRING = {
  FILE_NAME_LIST: 'List',
  GRID_PANEL_LAYOUT: 'GRID_PANEL_LAYOUT',
  GRID_PANEL_VIEW_MODE: 'GRID_PANEL_VIEW_MODE',
  GRID_PANEL_IS_LOCK: 'GRID_PANEL_IS_LOCK',
  DEFINITION: 'DEFINITION',
};

export const PROJECT_FORM_NAME = {
  CREATE: 'CREATE_PROJECT',
  IMPORT: 'IMPORT_PROJECT',
};

export const WORK_FORM_NAME = {
  CREATE: 'CREATE_WORK',
  IMPORT: 'IMPORT_WORK',
};

export const LANGUAGE = {
  en: 'English (United States)',
  ko: '한국어(대한민국)',
};

export const CULTURE = {
  en: 'en-US',
  vi: 'vi-VN',
  th: 'th-TH',
  ko: 'ko-KR',
};

export const VIEW_MODE = {
  SINGLE: 'SINGLE',
  SPLIT: 'SPLIT',
};

export const CLASSIFY = {
  CAUSE: 'Cause',
  CAUSE_PREFIX: 'C',
  EFFECT: 'Effect',
  EFFECT_PREFIX: 'E',
  GROUP: 'Group',
  GROUP_PREFIX: 'G',
};

export const GRAPH_NODE_TYPE = {
  CAUSE: 'Cause',
  EFFECT: 'Effect',
  GROUP: 'Group',
  EXCLUSIVE: 'Exclusive',
  INCLUSIVE: 'Inclusive',
  ONLYONE: 'OnlyOne',
  PIN: 'PIN',
  INSPECTION: 'INSPECTION',
  ANGLE: 'ANGLE',
  OPERATOR_TYPE: 'OPERATOR_TYPE',
};

export const GRAPH_LINK_TYPE = {
  NONE: 'None',
  EXCLUSIVE: 'Exclusive',
  INCLUSIVE: 'Inclusive',
  ONLYONE: 'OnlyOne',
  REQUIRE: 'Require',
  MASK: 'Mask',
};

export const CONSTRAINT_TYPE = {
  NONE: 'None',
  EXCLUSIVE: 'Exclusive',
  INCLUSIVE: 'Inclusive',
  ONLYONE: 'OnlyOne',
  REQUIRE: 'Require',
  MASK: 'Mask',
};

export const OPERATOR_TYPE = {
  AND: 'And',
  OR: 'Or',
  NOT: 'Not',
};

export const TEST_SCENARIO_TYPE = {
  Myers: 'Myers',
  MUTP: 'MUTP',
  CUTPNFP: 'CUTPNFP',
  MNFP: 'MNFP',
  UTP: 'UTP',
  NFP: 'NFP',
};

export const G_TYPE = {
  NODE: 'Node',
  LINK: 'Link',
  CONSTRAINT: 'Constraint',
};

export const RESULT_TYPE = {
  None: 'None',
  True: 'True',
  False: 'False',
};

export const TEST_CASE_GENERATION_METHOD = {
  MyersTechnique: 'MyersTechnique',
  DNFLogicCoverage: 'DNFLogicCoverage',
};

export const NODE_INSPECTION = {
  None: 0,
  DisconnectedNode: 1,
  MissingIsRelation: 2,
  MissingNotRelation: 4,
  HasRelationInSameGroup: 8,
  EConstraintViolation: 16,
  IConstraintViolation: 32,
  OConstraintViolation: 64,
  RConstraintViolation: 128,
  MConstraintViolation: 256,
  ConstraintViolation: 512,
};

/* Grid panel layout data */
const _defaultScreenWidth = 1920;
const _numColPanel = 4;
const _gridCols = 192;
const _gridRows = 24;
const _screenWidth = window.innerWidth < _defaultScreenWidth ? _defaultScreenWidth * 4 : window.innerWidth * 4;
const _screenHeight = window.innerHeight - 98;
const _panelMargin = { x: 7, y: 7 };
const _panelWidth = 12;
const _panelMinWidth = 6;
const _panelHeight = Math.floor(_screenHeight / _gridRows) - _panelMargin.y;

export const GRID_PANEL_SIZE = {
  defaultScreenWidth: _defaultScreenWidth,
  screenWidth: _screenWidth,
  screenHeight: _screenHeight,
  gridCols: _gridCols,
  numColPanel: _numColPanel,
  panelMargin: _panelMargin,
  panelWidth: _panelWidth,
  panelMinWidth: _panelMinWidth,
  splitViewPanelWidth: _screenWidth - _panelMargin.x * 2,
  singleViewPanelWidth: window.innerWidth * _numColPanel - _panelMargin.x * 2,
  panelHeight: _panelHeight,
  togglePanelWidth: 1,
};

export const DEFAULT_LAYOUTS = [
  { i: '0', x: 0, y: 0, w: _panelWidth, h: _gridRows, minH: 4, minW: _panelMinWidth },
  { i: '1', x: _panelWidth, y: 0, w: _panelWidth, h: _gridRows / 3, minH: 4, minW: _panelMinWidth },
  { i: '2', x: _panelWidth, y: _gridRows / 3, w: _panelWidth, h: _gridRows / 3, minH: 4, minW: _panelMinWidth },
  { i: '3', x: _panelWidth, y: (_gridRows / 3) * 2, w: _panelWidth, h: _gridRows / 3, minH: 4, minW: _panelMinWidth },
  { i: '4', x: _panelWidth * 2, y: 0, w: _panelWidth, h: _gridRows, minH: 4, minW: _panelMinWidth },
  { i: '5', x: _panelWidth * 3, y: 0, w: _panelWidth, h: _gridRows, minH: 4, minW: _panelMinWidth },
];

export const DEFAULT_LAYOUTS_SINGLE = [
  { i: '0', x: 0, y: 0, w: _panelWidth * _numColPanel, h: _gridRows, minH: 4, minW: _panelMinWidth },
  { i: '1', x: _panelWidth, y: 0, w: _panelWidth * _numColPanel, h: _gridRows / 3, minH: 4, minW: _panelMinWidth },
  {
    i: '2',
    x: _panelWidth,
    y: _gridRows / 3,
    w: _panelWidth * _numColPanel,
    h: _gridRows / 3,
    minH: 4,
    minW: _panelMinWidth,
  },
  {
    i: '3',
    x: _panelWidth,
    y: (_gridRows / 3) * 2,
    w: _panelWidth * _numColPanel,
    h: _gridRows / 3,
    minH: 4,
    minW: _panelMinWidth,
  },
  { i: '4', x: _panelWidth * 2, y: 0, w: _panelWidth * _numColPanel, h: _gridRows, minH: 4, minW: _panelMinWidth },
  { i: '5', x: _panelWidth * 3, y: 0, w: _panelWidth * _numColPanel, h: _gridRows, minH: 4, minW: _panelMinWidth },
];
/* End Grid panel layout data */

export const GRAPH_SHORTCUT_CODE = {
  SAVE_AS_PICTURE: 'SAVE_AS_PICTURE',
  GRAPH_OPTION: 'GRAPH_OPTION',
  ALIGN: 'ALIGN',
  GENERATE: 'GENERATE',
  CAUSE_GROUP: 'CAUSE_GROUP',
  EFFECT_GROUP: 'EFFECT_GROUP',
  EXCLUSIVE: 'EXCLUSIVE',
  INCLUSIVE: 'INCLUSIVE',
  ONLYONE: 'ONLYONE',
  REQUIRE: 'REQUIRE',
  MASK: 'MASK',
};

const isMacOS = navigator.platform.search('Mac') >= 0;

const ctrlCode = isMacOS ? 'command' : 'ctrl';

const altCode = isMacOS ? 'option' : 'alt';

export const GRAPH_SHORTCUT = [
  {
    code: GRAPH_SHORTCUT_CODE.SAVE_AS_PICTURE,
    text: 'saveaspicture',
    shortcutKeys: [ctrlCode, 'shift', 'p'],
  },
  {
    code: GRAPH_SHORTCUT_CODE.GRAPH_OPTION,
    text: 'graphoption',
    shortcutKeys: [ctrlCode, 'shift', 'o'],
  },
  { code: GRAPH_SHORTCUT_CODE.ALIGN, text: 'align', shortcutKeys: [ctrlCode, 'shift', 'a'] },
  { code: GRAPH_SHORTCUT_CODE.GENERATE, text: 'generate', shortcutKeys: [ctrlCode, 'g'] },
  { code: GRAPH_SHORTCUT_CODE.CAUSE_GROUP, text: 'causegroup', shortcutKeys: [ctrlCode, altCode, 'c'] },
  { code: GRAPH_SHORTCUT_CODE.EFFECT_GROUP, text: 'effectgroup', shortcutKeys: [ctrlCode, 'e'] },
  { code: GRAPH_SHORTCUT_CODE.EXCLUSIVE, text: 'exclusive', shortcutKeys: [ctrlCode, altCode, 'e'] },
  { code: GRAPH_SHORTCUT_CODE.INCLUSIVE, text: 'inclusive', shortcutKeys: [ctrlCode, altCode, 'i'] },
  {
    code: GRAPH_SHORTCUT_CODE.ONLYONE,
    text: 'onlyandonlyone',
    shortcutKeys: [ctrlCode, altCode, 'o'],
  },
  { code: GRAPH_SHORTCUT_CODE.REQUIRE, text: 'require', shortcutKeys: [ctrlCode, altCode, 'r'] },
  { code: GRAPH_SHORTCUT_CODE.MASK, text: 'mark', shortcutKeys: [ctrlCode, altCode, 'm'] },
];

export const TEST_DATA_SHORTCUT_CODE = {
  EXPORT: 'EXPORT_TEST_DATA',
  IMPORT: 'IMPORT_TEST_DATA',
  DEFAULT_SETUP: 'DEFAULT_SETUP',
};

export const TEST_DATA_SHORTCUT = [
  { code: TEST_DATA_SHORTCUT_CODE.EXPORT, text: 'export', shortcutKeys: [ctrlCode, 'b'] },
  { code: TEST_DATA_SHORTCUT_CODE.IMPORT, text: 'import', shortcutKeys: [ctrlCode, 'i'] },
  {
    code: TEST_DATA_SHORTCUT_CODE.DEFAULT_SETUP,
    text: 'defaultsetup',
    shortcutKeys: [ctrlCode, 'shift', 'd'],
  },
];

export const TEST_CASE_SHORTCUT_CODE = {
  EXPORT: 'EXPORT',
  METHOLOGY: 'METHOLOGY',
  CONTRACTION: 'CONTRACTION',
  EXPORT_TEST_SCENARIO: 'EXPORT_TEST_SCENARIO',
  EXPORT_TEST_CASE: 'EXPORT_TEST_CASE',
};

export const TEST_CASE_SHORTCUT = [
  { code: TEST_CASE_SHORTCUT_CODE.EXPORT, text: 'export', shortcutKeys: [ctrlCode, 'r'] },
  { code: TEST_CASE_SHORTCUT_CODE.METHOLOGY, text: 'methology', shortcutKeys: [ctrlCode, 'shift', 'm'] },
  {
    code: TEST_CASE_SHORTCUT_CODE.CONTRACTION,
    text: 'contractionhideorview',
    shortcutKeys: [ctrlCode, 'shift', 'c'],
  },
  { code: TEST_CASE_SHORTCUT_CODE.EXPORT_TEST_SCENARIO, text: 'exporttestscenario' },
  { code: TEST_CASE_SHORTCUT_CODE.EXPORT_TEST_CASE, text: 'exporttestcase' },
];

export const REIN_SHORTCUT_CODE = {
  CHOOSE_TEMPLATE: 'CHOOSE_TEMPLATE',
  CREATE_UPDATE_TEMPLATE: 'CREATE_UPDATE_TEMPLATE',
  IMPORT_META: 'IMPORT_META',
  UPLOAD_TEST_CASE: 'UPLOAD_TEST_CASE',
};

export const TEMPLATE_SHORTCUT = [
  { code: REIN_SHORTCUT_CODE.CHOOSE_TEMPLATE, text: 'chooseinpectiontemplate' },
  { code: REIN_SHORTCUT_CODE.CREATE_UPDATE_TEMPLATE, text: 'createupdateinspectiontemplate' },
  { code: REIN_SHORTCUT_CODE.IMPORT_META, text: 'loadmeta' },
  { code: REIN_SHORTCUT_CODE.UPLOAD_TEST_CASE, text: 'uploadtestcasetocloud' },
];

export const TEST_DATA = {
  String: {
    1: {
      true: 'Valid string',
      false: 'NULL',
    },
    2: {
      true: '',
      false: 'Empty string',
    },
    3: {
      true: '',
      false: 'Special characters',
    },
    4: {
      true: '',
      false: 'String that its length exceeds maximum length of "N"',
    },
  },
  Numberic: {
    1: {
      true: 'Positive integer, Negative integer',
      false: 'Negative integer, Positive integer',
    },
    2: {
      true: 'Positive real number, Negative real number',
      false: 'Negative real number, Positive real number',
    },
    3: {
      true: 'Positive number, Negative number',
      false: 'NULL,0',
    },
  },
  Bool: {
    1: {
      true: 'True',
      false: 'False',
    },
    2: {
      true: 'False',
      false: 'NULL',
    },
  },
};

export const FILE_NAME = {
  REPORT_WORK: 'ceta_workname_report.pdf',
  EXPORT_TEST_DATA: 'ceta_workname_test_data.csv',
  EXPORT_TEST_CASE: 'ceta_workname_test_case.csv',
  EXPORT_TEST_SCENARIO: 'ceta_workname_test_scenario.csv',
  GRAPH_IMAGE: 'ceta_workname_graph.png',
};

export const OPTION_TYPE = {
  GENERAL: 'GENERAL',
  GRAPH: 'GRAPH',
  TEST_DATA: 'TEST_DATA',
  SENTENCE_SIMILARITY: 'SENTENCE_SIMILARITY',
  TEST_COVERAGE: 'TEST_COVERAGE',
};

export const EXPRESSION_TYPE = {
  Expression: 'Expression',
  Variable: 'Variable',
  Operator: 'Operator',
};

export const SCENARIO_PROPERTIES = {
  SecnarioType: 'secnarioType',
  IsViolated: 'isViolated',
  IsFeasible: 'isFeasible',
};

export const COMPLEX_LOGICAL = {
  Average: 'Average',
  WeightedAverage: 'WeightedAverage',
  UserDefined: 'UserDefined',
};

export const TEST_CASE_METHOD = {
  MyersTechnique: 'MyersTechnique',
  MUMCUT: 'MUMCUT',
};

export const COVERAGE_ASPECT = {
  TestCase: 'testCase',
  Cause: 'cause',
  CauseTestData: 'causeTestData',
  Effect: 'effect',
  ComplexLogicalRelation: 'complexLogicalRelation',
  Scenario: 'scenario',
  BaseScenario: 'baseScenario',
  ValidScenario: 'validScenario',
  InvalidScenario: 'invalidScenario',
};

export const TESTDATA_TYPE = {
  TrueData: 'TrueData',
  FalseData: 'FalseData',
};
