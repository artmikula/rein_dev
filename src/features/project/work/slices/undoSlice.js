import { createSlice } from '@reduxjs/toolkit';

export const undoSlice = createSlice({
  name: 'undoHandlers',
  initialState: {
    handlers: [],
    actionStates: [],
    undoStates: [],
    redoStates: [],
  },
  reducers: {
    subscribeUndoHandlers: (state, action) => {
      const existsHandler = state.handlers.find((handler) => handler.component === action.payload.component);
      return {
        handlers: existsHandler ? state.handlers : state.handlers.concat(action.payload),
        actionStates: state.actionStates,
        undoStates: state.undoStates,
        redoStates: state.redoStates,
      };
    },
    unSubscribeUndoHandlers: (state, action) => ({
      handlers: state.handlers.filter((handler) => handler.component !== action.payload.component),
      actionStates: state.actionStates,
      undoStates: state.undoStates,
      redoStates: state.redoStates,
    }),
    pushActionStates: (state, action) => ({
      handlers: state.handlers,
      actionStates: state.actionStates.concat(action.payload),
      undoStates: state.undoStates,
      redoStates: state.redoStates,
    }),
    popActionStates: (state) => ({
      handlers: state.handlers,
      actionStates: state.actionStates.length > 0 ? state.actionStates.slice(0, -1) : state.actionStates,
      undoStates: state.undoStates,
      redoStates: state.redoStates,
    }),
    pushUndoStates: (state, action) => ({
      handlers: state.handlers,
      actionStates: state.actionStates,
      undoStates: state.undoStates.concat(action.payload),
      redoStates: state.redoStates,
    }),
    popUndoStates: (state) => ({
      handlers: state.handlers,
      actionStates: state.actionStates,
      undoStates: state.undoStates.length > 0 ? state.undoStates.slice(0, -1) : state.undoStates,
      redoStates: state.redoStates,
    }),
    pushRedoStates: (state, action) => ({
      handlers: state.handlers,
      actionStates: state.actionStates,
      undoStates: state.undoStates,
      redoStates: state.redoStates.concat(action.payload),
    }),
    popRedoStates: (state) => ({
      handlers: state.handlers,
      actionStates: state.actionStates,
      undoStates: state.undoStates,
      redoStates: state.redoStates.length > 0 ? state.redoStates.slice(0, -1) : state.redoStates,
    }),
    clearRedoStates: (state) => ({
      handlers: state.handlers,
      actionStates: state.actionStates,
      undoStates: state.undoStates,
      redoStates: [],
    }),
  },
});

export const {
  subscribeUndoHandlers,
  unSubscribeUndoHandlers,
  pushActionStates,
  popActionStates,
  pushUndoStates,
  popUndoStates,
  pushRedoStates,
  popRedoStates,
  clearRedoStates,
} = undoSlice.actions;

export default undoSlice.reducer;
