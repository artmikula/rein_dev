import { createSlice } from '@reduxjs/toolkit';

export const workSlice = createSlice({
  name: 'work',
  initialState: {
    name: '',
    version: '',
    projectName: '',
    generatingReport: false,
    testBasis: '',
    causeEffects: [],
    graph: {
      graphNodes: [],
      graphLinks: [],
      constraints: [],
    },
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
      console.log('setTestBasis', action.payload);
      return { ...state, testBasis: action.payload };
    },
    setCauseEffects: (state, action) => {
      console.log('setCauseEffects', action.payload);
      return { ...state, causeEffects: action.payload };
    },
    setGraph: (state, action) => {
      console.log('setGraph', action.payload);
      return { ...state, graph: action.payload };
    },
  },
});

export const { setWorkName, setWork, setGeneratingReport, setTestBasis, setCauseEffects, setGraph } = workSlice.actions;

export default workSlice.reducer;
