import { createSlice } from '@reduxjs/toolkit';

export const undoSlice = createSlice({
  name: 'undoHandlers',
  initialState: {
    handlers: [],
    actionStates: [],
  },
  reducers: {
    subscribeUndoHandlers: (state, action) => {
      const existsHandler = state.handlers.find((handler) => handler.component === action.payload.component);
      return {
        handlers: existsHandler ? state.handlers : state.handlers.concat(action.payload),
        actionStates: state.actionStates,
      };
    },
    unSubscribeUndoHandlers: (state, action) => ({
      handlers: state.handlers.filter((handler) => handler.component !== action.payload.component),
      actionStates: state.actionStates,
    }),
    pushActionStates: (state, action) => ({
      handlers: state.handlers,
      actionStates: state.actionStates.concat(action.payload),
    }),
    popActionStates: (state) => ({
      handlers: state.handlers,
      actionStates: state.actionStates.length > 0 ? state.actionStates.slice(0, -1) : state.actionStates,
    }),
  },
});

export const { subscribeUndoHandlers, unSubscribeUndoHandlers, pushActionStates, popActionStates } = undoSlice.actions;

export default undoSlice.reducer;
