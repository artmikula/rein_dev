import React from 'react';
import PropTypes from 'prop-types';

function GraphNode({ text, size, color, stroked, strokeWidth }) {
  return (
    <svg height={size} width={size}>
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} />
      {stroked && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 3 * strokeWidth) / 2}
          strokeWidth={strokeWidth}
          stroke="#fff"
          fill="none"
        />
      )}
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#fff">
        {text}
      </text>
    </svg>
  );
}

GraphNode.defaultProps = {
  stroked: false,
  strokeWidth: 1,
};

GraphNode.propTypes = {
  text: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  stroked: PropTypes.bool,
  strokeWidth: PropTypes.number,
};

export default GraphNode;
