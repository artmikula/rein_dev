import { createSlice } from '@reduxjs/toolkit';
import { COVERAGE_ASPECT } from 'features/shared/constants';
import { cloneDeep } from 'lodash';

export const defaultTestCoverageData = {
  [COVERAGE_ASPECT.TestCase]: { actualPercent: 0, planPercent: 0, denominator: 0 },
  [COVERAGE_ASPECT.Cause]: { actualPercent: 0, planPercent: 0, denominator: 0 },
  [COVERAGE_ASPECT.CauseTestData]: { actualPercent: 0, planPercent: 0, denominator: 0 },
  [COVERAGE_ASPECT.Effect]: { actualPercent: 0, planPercent: 0, denominator: 0 },
  [COVERAGE_ASPECT.ComplexLogicalRelation]: { actualPercent: 0, planPercent: 0, denominator: 0 },
  [COVERAGE_ASPECT.Scenario]: { actualPercent: 0, planPercent: 0, denominator: 0 },
  [COVERAGE_ASPECT.BaseScenario]: { actualPercent: 0, planPercent: 0, denominator: 0 },
  [COVERAGE_ASPECT.ValidScenario]: { actualPercent: 0, planPercent: 0, denominator: 0 },
  [COVERAGE_ASPECT.InvalidScenario]: { actualPercent: 0, planPercent: 0, denominator: 0 },
};

export const workSlice = createSlice({
  name: 'work',
  initialState: {
    name: '',
    version: '',
    projectName: '',
    generatingReport: false,
    testBasis: {
      content:
        '{"blocks":[{"key":"6jveu","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
    },
    causeEffects: [],
    graph: {
      graphNodes: [],
      graphLinks: [],
      constraints: [],
    },
    testCoverages: cloneDeep(defaultTestCoverageData),
    testDatas: [],
    testScenariosAndCases: [],
  },
  reducers: {
    setWorkName: (state, action) => {
      const _state = state;
      _state.name = action.payload;
    },
    setWork: (state, action) => {
      const { name, version, projectName } = action.payload;
      return { ...state, name, version, projectName };
    },
    setGeneratingReport: (state, action) => {
      const generatingReport = action.payload;
      return { ...state, generatingReport };
    },
    setTestBasis: (state, action) => {
      return { ...state, testBasis: { content: action.payload } };
    },
    setCauseEffects: (state, action) => {
      return { ...state, causeEffects: action.payload };
    },
    setGraph: (state, action) => {
      return { ...state, graph: action.payload };
    },
    setTestCoverages: (state, action) => {
      return { ...state, testCoverages: action.payload };
    },
    setTestDatas: (state, action) => {
      return { ...state, testDatas: action.payload };
    },
  },
});

export const {
  setWorkName,
  setWork,
  setGeneratingReport,
  setTestBasis,
  setCauseEffects,
  setGraph,
  setTestCoverages,
  setTestDatas,
} = workSlice.actions;

export default workSlice.reducer;
