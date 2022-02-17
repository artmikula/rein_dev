import PropTypes from 'prop-types';
import React from 'react';
import IconButton from './IconButton';

export default function ChildCauseEffect({ data, collapsed, onUnabridge }) {
  const { id, node, definition } = data;
  const handleUnabridge = () => onUnabridge(id);

  return (
    <tr key={id} className={`collapse merged-row ${collapsed ? 'show' : ''}`}>
      <th className="cause-effect-wrapper" scope="row">
        <div className="cause-effect-cell">
          <span className="merged-id">{node}</span>
        </div>
      </th>
      <td>{definition}</td>
      <td>
        <IconButton
          id={`unmerge${id}`}
          tooltip={`Unabridge ${node}`}
          onClick={handleUnabridge}
          iconClassName="bi bi-subtract delete-icon"
        />
      </td>
    </tr>
  );
}

ChildCauseEffect.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string.isRequired,
    node: PropTypes.string.isRequired,
    definition: PropTypes.string.isRequired,
  }).isRequired,
  collapsed: PropTypes.bool,
  onUnabridge: PropTypes.func,
};

ChildCauseEffect.defaultProps = {
  collapsed: false,
  onUnabridge: () => {},
};
