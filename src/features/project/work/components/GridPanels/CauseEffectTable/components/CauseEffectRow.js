import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { CLASSIFY } from '../../../../../../shared/constants';
import ChildCauseEffect from './ChildCauseEffect';
import IconButton from './IconButton';

export default function CauseEffectRow({ data, onDelete, onMerge, onUnabridge }) {
  const [collapsed, setCollapsed] = useState(false);
  const { id, type, node, mergedChildren, mergedNodes, definition } = data;

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

  let nodeClassName = type === CLASSIFY.CAUSE ? 'cause-id' : 'effect-id';
  nodeClassName += ' cause-effect-node';

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
            <span className={nodeClassName} onDrop={handleDrop}>
              {node}
            </span>
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
};
