import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

export default function TestScenariosTable(props) {
  const { theme, rows } = props;
  const _styles = StyleSheet.create({
    tableSection: {
      marginVertical: 18,
      fontSize: theme.display4,
    },
    header: {
      color: theme.primary,
      fontSize: theme.display4,
      paddingLeft: 6,
    },
    body: {
      borderLeftWidth: 3,
      borderLeftStyle: 'solid',
      borderLeftColor: theme.lighterGray,
    },
    row: {
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'stretch',
      paddingVertical: 3,
      paddingHorizontal: 3,
      borderBottomWidth: 0.7,
      borderBottomStyle: 'solid',
      borderBottomColor: theme.lighterGray,
    },
    cell: {
      width: '8%',
      textAlign: 'center',
    },
    firstCell: {
      width: '20%',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'space-between',
    },
  });

  return rows.map((row, index) => (
    <View style={_styles.tableSection} key={index}>
      <View style={[_styles.row, _styles.header]}>
        <View style={_styles.firstCell}>
          <Text>{row.name}</Text>
          <Text />
        </View>
        {row?.bools.map((value, index) => (
          <Text style={_styles.cell} key={index}>
            {index + 1}
          </Text>
        ))}
      </View>
      <View style={_styles.body}>
        <View style={_styles.row}>
          <View style={_styles.firstCell}>
            <Text>Cause</Text>
            <Text>{row?.cause}</Text>
          </View>
          {row?.bools.map((value, index) => (
            <Text style={_styles.cell} key={index}>
              {value.cause}
            </Text>
          ))}
        </View>
        <View style={_styles.row}>
          <View style={_styles.firstCell}>
            <Text>Group</Text>
            <Text>{row?.group}</Text>
          </View>
          {row?.bools.map((value, index) => (
            <Text style={_styles.cell} key={index}>
              {value.group}
            </Text>
          ))}
        </View>
        <View style={_styles.row}>
          <Text>
            Expected Results | <Text style={{ color: theme.blue }}>{row.expectedResults}</Text>
          </Text>
          <Text />
        </View>
      </View>
    </View>
  ));
}
TestScenariosTable.propTypes = {
  theme: PropTypes.objectOf(PropTypes.string).isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      cause: PropTypes.number,
      group: PropTypes.number,
      bools: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)),
      expectedResults: PropTypes.string,
    })
  ).isRequired,
};
