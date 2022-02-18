/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { CLASSIFY } from '../../../../../../shared/constants';
import ChildCauseEffect from './ChildCauseEffect';
import IconButton from './IconButton';

export default function CauseEffectRow({ data, onDelete, onMerge, onUnabridge, onEditNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const { id, type, node, mergedChildren, mergedNodes, definition } = data;

  const editNodeTextboxId = `edit-${node}-text-box`;

  const handleCollapseRow = (e) => {
    e.preventDefault();
    setCollapsed(!collapsed);
  };

  const handleOnDelete = (e) => {
    e.preventDefault();
    onDelete(data);
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('text', id);
  };

  const handleDrop = (e) => {
    e.stopPropagation();
    onMerge(e.dataTransfer.getData('text'), id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClickNode = () => setEditing(true);

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
  nodeClassName += ' cause-effect-node';

  const editBoxClassName = `edit-node-box ${nodeClassName}`;

  useEffect(() => {
    if (isEditing) {
      document.getElementById(editNodeTextboxId).focus();
    }
  }, [isEditing]);

  return (
    <>
      <tr draggable="true" onDragStart={handleDragStart} onDragOver={handleDragOver}>
        <th className="cause-effect-wrapper" scope="row">
          <div className="cause-effect-cell">
            {mergedChildren.length > 0 && (
              <a href="#toggler" onClick={handleCollapseRow}>
                {collapsed ? (
                  <i className="bi bi-chevron-contract mr-2" />
                ) : (
                  <i className="bi bi-chevron-expand mr-2" />
                )}
              </a>
            )}
            {isEditing ? (
              <input
                type="number"
                id={editNodeTextboxId}
                className={editBoxClassName}
                onKeyPress={handleKeypress}
                onBlur={handleBlur}
                defaultValue={node.substr(1, node.length - 1)}
              />
            ) : (
              <span className={nodeClassName} onDrop={handleDrop} onClick={handleClickNode}>
                {node}
              </span>
            )}
          </div>
        </th>
        <td>{definition}</td>
        <td>
          {mergedNodes.join(', ')}
          <IconButton
            id={`delete${id}`}
            tooltip={`Delete ${node}`}
            onClick={handleOnDelete}
            iconClassName="bi bi-trash delete-icon"
          />
        </td>
      </tr>
      {mergedChildren.map((mergedRow) => {
        return <ChildCauseEffect data={mergedRow} collapsed={collapsed} key={mergedRow.id} onUnabridge={onUnabridge} />;
      })}
    </>
  );
}

CauseEffectRow.defaultProps = {
  onMerge: () => {},
  onUnabridge: () => {},
  onEditNode: () => {},
};

CauseEffectRow.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    node: PropTypes.string,
    mergedChildren: PropTypes.arrayOf(PropTypes.object),
    mergedNodes: PropTypes.arrayOf(PropTypes.string),
    definition: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onMerge: PropTypes.func,
  onUnabridge: PropTypes.func,
  onEditNode: PropTypes.func,
};
