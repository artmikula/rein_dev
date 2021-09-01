import React from 'react';
import PropTypes from 'prop-types';
import StyleButton from './StyleButton';

export default function InlineStyleControls(props) {
  const INLINE_STYLES = [
    { label: 'Bold', style: 'BOLD' },
    { label: 'Italic', style: 'ITALIC' },
    { label: 'Underline', style: 'UNDERLINE' },
    { label: 'Monospace', style: 'CODE' },
  ];
  const { editorState, onToggle } = props;
  const currentStyle = editorState.getCurrentInlineStyle();

  return (
    <div>
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
}
InlineStyleControls.propTypes = {
  editorState: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.func])).isRequired,
  onToggle: PropTypes.func.isRequired,
};
