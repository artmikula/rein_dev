class ActionsHelper {
  updateUndoState(newState, key, data) {
    return {
      ...newState,
      [key]: data,
    };
  }

  updateStateToHandlers(undoHandlers, currentState) {
    undoHandlers.forEach((undoHandler) => {
      if (typeof undoHandler.undo === 'function') {
        undoHandler.undo(currentState);
      }
    });
  }

  getCurrentState(undoHandlers, key, data, component) {
    let currentState = {
      [key]: data,
    };

    undoHandlers.forEach((undoHandler) => {
      if (undoHandler.component !== component && typeof undoHandler.update === 'function') {
        currentState = undoHandler.update(currentState);
      }
    });

    return currentState;
  }
}

export default new ActionsHelper();
