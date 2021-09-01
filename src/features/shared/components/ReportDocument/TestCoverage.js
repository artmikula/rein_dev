import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

export default function TestCoverage(props) {
  const { theme, rows } = props;
  const _styles = StyleSheet.create({
    processWrapper: {
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 30,
    },
    processBar: {
      height: 5,
      backgroundColor: theme.primary,
    },
    processPercent: {
      minWidth: 50,
      marginLeft: 20,
      fontSize: theme.display4,
      color: theme.primary,
    },
  });

  return (
    <View style={{ color: theme.lightGray }}>
      {rows.map((test, index) => (
        <React.Fragment key={index}>
          <Text>
            {test.name} ({test.numerator}/{test.denominator})
          </Text>
          <View style={_styles.processWrapper}>
            <View style={[_styles.processBar, { width: `${test.percent}%` }]} />
            <View style={[_styles.processBar, { width: `${100 - test.percent}%`, backgroundColor: '#f0f0f0' }]} />
            <Text style={_styles.processPercent}>{test.percent}%</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}
TestCoverage.propTypes = {
  theme: PropTypes.objectOf(PropTypes.string).isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      numerator: PropTypes.number,
      denominator: PropTypes.number,
      percent: PropTypes.number,
    })
  ).isRequired,
};
