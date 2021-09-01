import React from 'react';
import PropTypes from 'prop-types';
import BlockStyleControls from './BlockStyleControls';
import InlineStyleControls from './InlineStyleControls';

export default function StyleControlEditor(props) {
  const { editorState, onToggleBlockType, onToggleInlineStyle } = props;
  return (
    <>
      <BlockStyleControls editorState={editorState} onToggle={onToggleBlockType} />
      <InlineStyleControls editorState={editorState} onToggle={onToggleInlineStyle} />
      <div className="dropdown-divider mb-3" />
    </>
  );
}

StyleControlEditor.propTypes = {
  editorState: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.func])).isRequired,
  onToggleBlockType: PropTypes.func.isRequired,
  onToggleInlineStyle: PropTypes.func.isRequired,
};
