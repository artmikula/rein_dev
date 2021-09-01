const domainEvents = {
  ACTION: {
    REMOVE: 'REMOVE',
    NOTACCEPT: 'NOTACCEPT',
    ADD: 'ADD',
    UPDATE: 'UPDATE',
    ACCEPTDELETE: 'ACCEPTDELETE',
    GENERATE: 'GENERATE',
    ACCEPTGENERATE: 'ACCEPTGENERATE',
    REPORTWORK: 'REPORTWORK',
  },
  DES: {
    TESTBASIS: 'TESTBASIS',
    GRAPH: 'GRAPH',
    CAUSEEFFECT: 'CAUSEEFFECT',
    TESTDATA: 'TESTDATA',
    TESTCOVERAGE: 'TESTCOVERAGE',
    SSMETRIC: 'SSMETRIC',
    TESTSCENARIOS: 'TESTCENARIOS',
    WORKMENU: 'WORKMENU',
  },
  TESTBASIC_CLASSIFYASCAUSE_DOMAINEVENT: 'TESTBASIC_CLASSIFYASCAUSE_DOMAINEVENT',
  TESTBASIC_CLASSIFYASEFFECT_DOMAINEVENT: 'TESTBASIC_CLASSIFYASEFFECT_DOMAINEVENT',
  CAUSEEFFECT_ONCHANGE_DOMAINEVENT: 'CAUSEEFFECT_ONCHANGE_DOMAINEVENT',
  GRAPH_ONCHANGE_DOMAINEVENT: 'GRAPH_ONCHANGE_DOMAINEVENT',
  TEST_COVERAGE_ONCHANGE_DOMAINEVENT: 'TEST_COVERAGE_ONCHANGE_DOMAINEVENT',
  GRAPH_MENU_DOMAINEVENT: 'GRAPH_MENU_DOMAINEVENT',
  TEST_DATA_MENU_DOMAINEVENT: 'TEST_DATA_MENU_DOMAINEVENT',
  TEST_CASE_MENU_DOMAINEVENT: 'TEST_CASE_MENU_DOMAINEVENT',
  TEST_SCENARIO_DOMAINEVENT: 'TEST_SCENARIO_DOMAINEVENT',
  TEST_DATA_DOMAINEVENT: 'TEST_DATA_DOMAINEVENT',
  WORK_MENU_DOMAINEVENT: 'WORK_MENU_DOMAINEVENT',
};

export default domainEvents;
