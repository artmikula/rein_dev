import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { COVERAGE_ASPECT, GENERATE_STATUS } from 'features/shared/constants';
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
    generating: false,
  } as IWorkSlice,
  reducers: {
    setWork: (state, action: PayloadAction<IWorkSlice>) => {
      const { testBasis, causeEffects, graph, testCoverage, testDatas, loaded, name } = action.payload;
      const _state = state;
      _state.testBasis = testBasis ?? _state.testBasis;
      _state.causeEffects = causeEffects ?? _state.causeEffects;
      _state.graph = {
        graphNodes: graph.graphNodes ?? _state.graph.graphNodes,
        graphLinks: graph.graphLinks ?? _state.graph.graphLinks,
        constraints: graph.constraints ?? _state.graph.constraints,
      };
      _state.testCoverage = testCoverage ?? _state.testCoverage;
      _state.testDatas = testDatas ?? _state.testDatas;
      _state.loaded = loaded ?? _state.loaded;
      _state.name = name ?? '';

      return _state;
    },
    setGeneratingReport: (state, action: PayloadAction<boolean>) => {
      const _state = state;
      _state.generatingReport = action.payload;
      return _state;
    },
    setTestBasis: (state, action: PayloadAction<string>) => {
      const _state = state;
      _state.testBasis.content = action.payload;
      return _state;
    },
    setCauseEffects: (state, action: PayloadAction<ICauseEffect[]>) => {
      const _state = state;
      _state.causeEffects = action.payload;
      return _state;
    },
    setGraph: (state, action: PayloadAction<IGraphState>) => {
      const _state = state;
      _state.graph = action.payload;
      return _state;
    },
    setTestCoverages: (state, action: PayloadAction<ITestCoverage>) => {
      const _state = state;
      _state.testCoverage = action.payload;
      return _state;
    },
    setTestDatas: (state, action: PayloadAction<ITestDataDetail[]>) => {
      const _state = state;
      _state.testDatas = action.payload;
      return _state;
    },
    setDbContext: (state, action: PayloadAction<IDbContext>) => {
      const _state = state;
      _state.dbContext = action.payload;
      return _state;
    },
    setGenerating: (state, action: PayloadAction<string>) => {
      const _state = state;
      _state.generating = action.payload === GENERATE_STATUS.START;
      return _state;
    },
  },
});

export const {
  setWork,
  setGeneratingReport,
  setTestBasis,
  setCauseEffects,
  setGraph,
  setTestCoverages,
  setTestDatas,
  setDbContext,
  setGenerating,
} = workSlice.actions;

export default workSlice.reducer;
