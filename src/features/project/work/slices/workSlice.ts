import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { COVERAGE_ASPECT } from 'features/shared/constants';
import { IDbContext } from 'features/shared/storage-services/dbContext/models';
import { cloneDeep } from 'lodash';
import { ICauseEffect, ITestCoverage, ITestDataDetail } from 'types/models';
import { IGraphState, IWorkSlice } from 'types/stateModels';

export const defaultTestCoverageData: ITestCoverage = {
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
    dbContext: null,
  } as IWorkSlice,
  reducers: {
    setWorkName: (state, action: PayloadAction<string>) => {
      const _state = state;
      _state.name = action.payload;
    },
    setWork: (state, action: PayloadAction<IWorkSlice>) => {
      return { ...state, ...action.payload };
    },
    setGeneratingReport: (state, action: PayloadAction<boolean>) => {
      const generatingReport = action.payload;
      return { ...state, generatingReport };
    },
    setTestBasis: (state, action: PayloadAction<string>) => ({
      ...state,
      testBasis: { content: action.payload },
    }),
    setCauseEffects: (state, action: PayloadAction<ICauseEffect[]>) => ({ ...state, causeEffects: action.payload }),
    setGraph: (state, action: PayloadAction<IGraphState>) => ({ ...state, graph: action.payload }),
    setTestCoverages: (state, action: PayloadAction<ITestCoverage>) => ({ ...state, testCoverage: action.payload }),
    setTestDatas: (state, action: PayloadAction<ITestDataDetail[]>) => ({ ...state, testDatas: action.payload }),
    setDbContext: (state, action: PayloadAction<IDbContext>) => {
      const _state = state;
      _state.dbContext = action.payload;
      return _state;
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
  setDbContext,
} = workSlice.actions;

export default workSlice.reducer;
