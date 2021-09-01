import { createSlice } from '@reduxjs/toolkit';

export const projectSlice = createSlice({
  name: 'project',
  initialState: {
    projectId: null,
  },
  reducers: {
    selectProject: (state, action) => {
      const _state = state;
      _state.projectId = action.payload;
    },
  },
});

export const { selectProject } = projectSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`
export const selectProjectId = (state) => state.project.projectId;

export default projectSlice.reducer;
