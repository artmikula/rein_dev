import { configureStore } from '@reduxjs/toolkit';
import projectSliceReducer from 'features/project/slices/projectSlice';
import workSliceReducer from 'features/project/work/slices/workSlice';

export default configureStore({
  reducer: {
    project: projectSliceReducer,
    work: workSliceReducer,
  },
});
