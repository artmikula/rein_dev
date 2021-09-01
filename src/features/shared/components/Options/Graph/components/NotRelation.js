import React from 'react';
import PropTypes from 'prop-types';

function NotRelation({ size, color, width }) {
  const svgHeight = size + 40;
  const arrowHeight = size + 8;
  const arrowWidth = (arrowHeight * 3) / 2;
  return (
    <svg height={svgHeight} width={width}>
      <line
        x1="0"
        y1={svgHeight / 2}
        x2={width - arrowWidth}
        y2={svgHeight / 2}
        stroke={color}
        strokeWidth={size}
        strokeDasharray={`${size * 3 + 2},${size + 2}`}
      />
      <polygon
        points={`${width - arrowWidth},${(svgHeight - arrowHeight) / 2}
                  ${width - arrowWidth},${svgHeight - (svgHeight - arrowHeight) / 2}
                  ${width},${svgHeight / 2}`}
        style={{ fill: color }}
      />
      <path
        d={`M${width / 2 - 40},${svgHeight / 2} a1,1 1 1,1 40,0`}
        stroke={color}
        strokeWidth={size}
        fill="none"
        strokeDasharray={`${size * 3 + 2},${size + 2}`}
      />
      <path
        d={`M${width / 2},${svgHeight / 2} a1,1 1 0,0 40,0`}
        // d={`M${width / 2},${svgHeight / 2} a1,0 1 0,0 40,0`}
        stroke={color}
        strokeWidth={size}
        fill="none"
        strokeDasharray={`${size * 3 + 2},${size + 2}`}
      />
    </svg>
  );
}

NotRelation.propTypes = {
  color: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
};

export default NotRelation;
