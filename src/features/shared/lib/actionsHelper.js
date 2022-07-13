class ActionsHelper {
  updateUndoState(undoHandlers, currentState) {
    let newState = currentState;
    undoHandlers.forEach((undoHandler) => {
      if (typeof undoHandler.update === 'function') {
        newState = undoHandler.update(currentState);
      }
    });
    return newState;
  }
}

export default new ActionsHelper();
