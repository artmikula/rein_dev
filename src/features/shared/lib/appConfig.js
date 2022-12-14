import { COMPLEX_LOGICAL, TEST_CASE_METHOD } from '../constants';

/**
 * @type {{
 *  version: string,
 *  deviceId: string,
 *  general: any,
 *  graph: any,
 *  testScenarioAndCase: any,
 *  similarity: any,
 *  testCoverage: any,
 *  testData: any
 * }}
 */

export const defaultOption = {
  general: {
    testCaseMethod: TEST_CASE_METHOD.MyersTechnique,
    viewOmmited: true,
  },
  graph: {
    nodeSize: 50,
    causeColor: '#0078d4',
    effectColor: '#28a745',
    groupColor: '#98C9EA',
    errorColor: '#965196',
    constraintColor: '#535353',
    isRelationColor: '#98C9EA',
    notRelationColor: '#965196',
    lineWidth: 1,
  },
  testScenarioAndCase: {
    testCasePageSize: 100,
  },
  similarity: { enable: true, rate: 70 },
  testCoverage: { complexLogical: COMPLEX_LOGICAL.Average, threshold: 1 },
  testData: {
    String: [
      { intensity: 1, trueData: 'Valid string', falseData: 'NULL' },
      { intensity: 2, trueData: '', falseData: 'Empty string' },
      { intensity: 3, trueData: '', falseData: 'Special characters' },
      { intensity: 4, trueData: '', falseData: 'String that its length exeeds maximum length of "N' },
    ],
    Numberic: [
      { intensity: 1, trueData: 'Positive integer, Negative integer', falseData: 'Negative integer, Positive integer' },
      {
        intensity: 2,
        trueData: 'Positive real number, Negative real number',
        falseData: 'Negative real number, Positive real number, Negative real number',
      },
      { intensity: 3, trueData: 'Positive number, Negative number', falseData: 'NULL, 0' },
    ],
    Bool: [
      { intensity: 1, trueData: 'True', falseData: 'False' },
      { intensity: 2, trueData: 'False', falseData: 'NULL' },
    ],
    Tupple: [
      { intensity: 1, trueData: '[1,2],[2,3]', falseData: '[1,2],[2,3]' },
      { intensity: 2, trueData: '', falseData: '' },
      { intensity: 3, trueData: '', falseData: '' },
    ],
  },
};

const appConfig = {
  version: process.env.APP_VERSION,
  // default option, can be override when user has saved options
  ...defaultOption,
};

export const setDeviceId = (value) => {
  appConfig.deviceId = value;
};

export default appConfig;
