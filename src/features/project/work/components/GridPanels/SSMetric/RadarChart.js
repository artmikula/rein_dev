import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ResponsiveRadar } from '@nivo/radar';

class RadarChart extends Component {
  _renderCustomLabel = ({ id }) => (
    <g transform="translate(-3,5)">
      <text
        style={{
          fontSize: 10,
          fontWeight: 'bold',
          fill: '#1f77b4',
        }}
      >
        {id}
      </text>
    </g>
  );

  render() {
    const { data } = this.props;
    return (
      <ResponsiveRadar
        data={data}
        keys={['value']}
        indexBy="label"
        maxValue="auto"
        margin={{ top: 15, right: 15, bottom: 15, left: 15 }}
        curve="linearClosed"
        borderWidth={1}
        borderColor={{ theme: 'background' }}
        gridLevels={4}
        gridShape="linear"
        gridLabelOffset={12}
        gridLabel={this._renderCustomLabel}
        enableDots
        dotSize={2}
        dotColor={{ theme: 'background' }}
        dotBorderWidth={2}
        dotBorderColor={{ from: 'color', modifiers: [] }}
        enableDotLabel={false}
        dotLabel="value"
        dotLabelYOffset={-14}
        colors={{ scheme: 'category10' }}
        fillOpacity={0.25}
        blendMode="normal"
        animate
        motionConfig="wobbly"
        isInteractive
      />
    );
  }
}

RadarChart.defaultProps = {
  data: [],
};

RadarChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object])),
};

export default RadarChart;
