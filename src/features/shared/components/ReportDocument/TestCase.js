import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

export default function TestCase(props) {
  const { theme, name, expectedResults, definition } = props;
  const _styles = StyleSheet.create({
    inlineWrapper: {
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'center',
      marginTop: 10,
    },
    square: {
      width: 22,
      height: 22,
      marginRight: 5,
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: theme.primary,
    },
    expectedWrapper: {
      marginVertical: 20,
      paddingVertical: 4,
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5,
      borderStyle: 'solid',
      borderColor: theme.lighterGray,
    },
    name: {
      color: theme.primary,
      fontSize: theme.display3,
    },
    expectedResults: {
      marginRight: 7,
      color: theme.primary,
      fontSize: theme.display4,
    },
    definition: {
      width: '100%',
      marginLeft: 7,
    },
  });

  return (
    <View>
      <View style={_styles.inlineWrapper}>
        <View style={_styles.square} />
        <Text style={_styles.name}>{name}</Text>
      </View>
      <View style={[_styles.inlineWrapper, _styles.expectedWrapper]}>
        <Text style={[_styles.expectedResults, { minWidth: 54, width: 54 }]}>Expected Results</Text>
        <Text style={[_styles.expectedResults, { color: theme.blue }]}>{expectedResults}</Text>
        <Text style={_styles.definition}>{definition}</Text>
      </View>
    </View>
  );
}
TestCase.propTypes = {
  theme: PropTypes.objectOf(PropTypes.string).isRequired,
  name: PropTypes.string.isRequired,
  expectedResults: PropTypes.string.isRequired,
  definition: PropTypes.string,
};
TestCase.defaultProps = {
  definition: '',
};
