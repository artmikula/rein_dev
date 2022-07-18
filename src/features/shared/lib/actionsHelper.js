class ActionsHelper {
  updateUndoState(newState, key, data) {
    return {
      ...newState,
      [key]: data,
    };
  }
}

export default new ActionsHelper();
