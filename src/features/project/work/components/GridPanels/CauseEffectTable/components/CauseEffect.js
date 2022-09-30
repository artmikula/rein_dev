/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CLASSIFY, GENERATE_STATUS } from '../../../../../../shared/constants';

export default function CauseEffect({ id, node, type, isMerged, onEditNode, onDrop, onDragOver }) {
  const [isEditing, setEditing] = useState(false);
  const { generating } = useSelector((state) => state.work);

  const editNodeTextboxId = `edit-${node}-text-box`;

  const handleClickNode = () => {
    if (generating === GENERATE_STATUS.START || generating === GENERATE_STATUS.SUCCESS) {
      setEditing(false);
      return;
    }
    setEditing(true);
  };

  const handleEditNode = (nodeNum) => {
    setEditing(false);
    if (nodeNum.trim().length !== 0 && parseInt(nodeNum.trim(), 10)) {
      const newNode = node[0] + nodeNum;

      if (newNode !== node) {
        onEditNode(id, newNode);
      }
    }
  };

  const handleKeypress = (e) => {
    if (e.which === 13) {
      handleEditNode(e.target.value);
    }
  };

  const handleBlur = (e) => handleEditNode(e.target.value);

  let nodeClassName = type === CLASSIFY.CAUSE ? 'cause-id' : 'effect-id';
  if (generating === GENERATE_STATUS.START || generating === GENERATE_STATUS.SUCCESS) {
    nodeClassName += ' cause-effect-node-disabled';
  } else {
    nodeClassName += ' cause-effect-node';
  }

  const editBoxClassName = `edit-node-box ${nodeClassName}`;

  useEffect(() => {
    if (isEditing) {
      document.getElementById(editNodeTextboxId).focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        type="number"
        id={editNodeTextboxId}
        className={editBoxClassName}
        onKeyPress={handleKeypress}
        onBlur={handleBlur}
        defaultValue={node.substr(1, node.length - 1)}
      />
    );
  }
  if (isMerged) {
    return (
      <span className="merged-id" onClick={handleClickNode}>
        {node}
      </span>
    );
  }
  return (
    <span className={nodeClassName} onDrop={onDrop} onClick={handleClickNode} onDragOver={onDragOver}>
      {node}
    </span>
  );
}

CauseEffect.defaultProps = {
  onDrop: () => {},
  onDragOver: () => {},
  isMerged: false,
};

CauseEffect.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  node: PropTypes.string.isRequired,
  isMerged: PropTypes.bool,
  onEditNode: PropTypes.func.isRequired,
  onDrop: PropTypes.func,
  onDragOver: PropTypes.func,
};
