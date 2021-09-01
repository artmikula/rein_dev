import React from 'react';
import PropTypes from 'prop-types';

function IsRelation({ size, color, width }) {
  const svgHeight = size + 8;
  const arrowHeight = size + 8;
  const arrowWidth = (arrowHeight * 3) / 2;
  return (
    <svg height={svgHeight} width={width}>
      <line x1="0" y1={svgHeight / 2} x2={width - arrowWidth} y2={svgHeight / 2} stroke={color} strokeWidth={size} />
      <polygon
        points={`${width - arrowWidth},${(svgHeight - arrowHeight) / 2}
                  ${width - arrowWidth},${svgHeight - (svgHeight - arrowHeight) / 2}
                  ${width},${svgHeight / 2}`}
        style={{ fill: color }}
      />
    </svg>
  );
}

IsRelation.propTypes = {
  color: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
};

export default IsRelation;
