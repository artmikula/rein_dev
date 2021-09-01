import React from 'react';
import PropTypes from 'prop-types';
import './style.scss';

export default function CircleProgress(props) {
  const { percent, valueDisplay, lineColor, label, lineDot, size } = props;
  return (
    <div className="progress-chart" style={{ width: size }}>
      {lineDot ? (
        <svg viewBox="0 0 36 36">
          <path
            className="circle-bg-dot"
            strokeDasharray="0 5"
            d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="circle"
            strokeDasharray={`0 ${
              100 - percent
            } 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5 0 5`}
            stroke={lineColor}
            d="M18 2.0845
          a 15.9155 15.9155 0 0 0 0 31.831
          a 15.9155 15.9155 0 0 0 0 -31.831"
          />
          <text x="18" y="21.4" fill={lineColor} className="percentage">
            {valueDisplay}
          </text>
        </svg>
      ) : (
        <svg viewBox="0 0 36 36">
          <path
            className="circle-bg"
            d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="circle"
            strokeDasharray={`${percent}, 100`}
            stroke={lineColor}
            d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <text x="18" y="21.4" fill={lineColor} className="percentage">
            {valueDisplay}
          </text>
        </svg>
      )}
      <span className="label">{label}</span>
    </div>
  );
}
CircleProgress.propTypes = {
  percent: PropTypes.number.isRequired,
  valueDisplay: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  lineColor: PropTypes.string,
  label: PropTypes.string,
  lineDot: PropTypes.bool,
  size: PropTypes.number,
};
CircleProgress.defaultProps = {
  lineColor: '#0078d4',
  label: '',
  lineDot: false,
  size: 37,
};
