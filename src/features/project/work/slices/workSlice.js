import { createSlice } from '@reduxjs/toolkit';

export const workSlice = createSlice({
  name: 'work',
  initialState: {
    name: '',
    version: '',
    projectName: '',
    generatingReport: false,
    testBasis: null,
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
      console.log('setTestBasis');
      return { ...state, testBasis: action.payload };
    },
  },
});

export const { setWorkName, setWork, setGeneratingReport, setTestBasis } = workSlice.actions;

export default workSlice.reducer;
