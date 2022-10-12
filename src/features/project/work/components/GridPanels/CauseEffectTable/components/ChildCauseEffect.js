import PropTypes from 'prop-types';
import React from 'react';
import CauseEffect from './CauseEffect';
import IconButton from './IconButton';

export default function ChildCauseEffect({ data, onEditNode, collapsed, onUnabridge, disabled }) {
  const { id, node, type, definition } = data;
  const handleUnabridge = () => onUnabridge(id);

  return (
    <tr key={id} className={`collapse merged-row ${collapsed ? 'show' : ''}`}>
      <th className="cause-effect-wrapper" scope="row">
        <div className="cause-effect-cell">
          <CauseEffect isMerged id={id} node={node} type={type} onEditNode={onEditNode} />
        </div>
      </th>
      <td>{definition}</td>
      <td>
        <IconButton
          id={`unmerge${id}`}
          tooltip={`Unabridge ${node}`}
          onClick={handleUnabridge}
          iconClassName="bi bi-subtract delete-icon"
          disabled={disabled}
        />
      </td>
    </tr>
  );
}

ChildCauseEffect.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    node: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    definition: PropTypes.string.isRequired,
  }).isRequired,
  collapsed: PropTypes.bool,
  onUnabridge: PropTypes.func,
  onEditNode: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ChildCauseEffect.defaultProps = {
  collapsed: false,
  onUnabridge: () => {},
  disabled: false,
};
