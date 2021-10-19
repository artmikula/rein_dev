import PropTypes from 'prop-types';
import React from 'react';

export default function ChildCauseEffect({ data, collapsed }) {
  const { id, node, definition } = data;
  return (
    <tr key={id} className={`collapse merged-row ${collapsed ? 'show' : ''}`}>
      <th className="cause-effect-wrapper" scope="row">
        <div className="cause-effect-cell">
          <span className="merged-id">{node}</span>
        </div>
      </th>
      <td>{definition}</td>
      <td />
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
};

ChildCauseEffect.defaultProps = {
  collapsed: false,
};
