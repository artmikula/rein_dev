import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { CLASSIFY } from '../../../../../../shared/constants';
import ChildCauseEffect from './ChildCauseEffect';
import IconButton from './IconButton';

export default function CauseEffectRow({ data, onDelete, index }) {
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

  let nodeClassName = type === CLASSIFY.CAUSE ? 'cause-id' : 'effect-id';
  nodeClassName += ' cause-effect-node';

  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <>
          <tr ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
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
                <span className={nodeClassName}>{node}</span>
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
            return <ChildCauseEffect data={mergedRow} collapsed={collapsed} key={mergedRow.id} />;
          })}
        </>
      )}
    </Draggable>
  );
}

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
  index: PropTypes.number.isRequired,
};
