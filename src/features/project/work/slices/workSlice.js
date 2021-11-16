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
    loaded: false,
    testBasis: {
      content: null,
    },
    causeEffects: [],
    graph: {
      graphNodes: [],
      graphLinks: [],
      constraints: [],
    },
    testCoverage: cloneDeep(defaultTestCoverageData),
    testDatas: [],
    inspectionTemplates: [{ id: '0', name: 'Default', ruleSet: '1,2,3,5' }],
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
    setTestBasis: (state, action) => ({ ...state, testBasis: { content: action.payload } }),
    setCauseEffects: (state, action) => ({ ...state, causeEffects: action.payload }),
    setGraph: (state, action) => ({ ...state, graph: action.payload }),
    setTestCoverages: (state, action) => ({ ...state, testCoverage: action.payload }),
    setTestDatas: (state, action) => ({ ...state, testDatas: action.payload }),
    setInspectionTemplates: (state, action) => ({ ...state, inspectionTemplates: action.payload }),
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
  setInspectionTemplates,
} = workSlice.actions;

export default workSlice.reducer;
