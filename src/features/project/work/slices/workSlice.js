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

export const storeData = (state) => {
  const workId = state.id ?? 'workId';

  localStorage.setItem(workId, JSON.stringify(state));
};

export const workSlice = createSlice({
  name: 'work',
  initialState: {
    name: '',
    version: '',
    projectName: '',
    generatingReport: false,
    testBasis: {
      content: null,
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
      return { ...state, ...action.payload };
    },
    setGeneratingReport: (state, action) => {
      const generatingReport = action.payload;
      return { ...state, generatingReport };
    },
    setTestBasis: (state, action) => {
      const newState = { ...state, testBasis: { content: action.payload } };
      storeData(newState);
      return newState;
    },
    setCauseEffects: (state, action) => {
      const newState = { ...state, causeEffects: action.payload };
      storeData(newState);
      return newState;
    },
    setGraph: (state, action) => {
      const newState = { ...state, graph: action.payload };
      storeData(newState);
      return newState;
    },
    setTestCoverages: (state, action) => {
      const newState = { ...state, testCoverages: action.payload };
      storeData(newState);
      return newState;
    },
    setTestDatas: (state, action) => {
      const newState = { ...state, testDatas: action.payload };
      storeData(newState);
      return newState;
    },
    setTestScenariosAndCases: (state, action) => {
      const newState = { ...state, testScenariosAndCases: action.payload };
      storeData(newState);
      return newState;
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
  setTestScenariosAndCases,
} = workSlice.actions;

export default workSlice.reducer;
