import { configureStore } from '@reduxjs/toolkit';
import projectSliceReducer from 'features/project/slices/projectSlice';
import workSliceReducer from 'features/project/work/slices/workSlice';
import undoSliceReducer from 'features/project/work/slices/undoSlice';

export default configureStore({
  reducer: {
    project: projectSliceReducer,
    work: workSliceReducer,
    undoHandlers: undoSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
