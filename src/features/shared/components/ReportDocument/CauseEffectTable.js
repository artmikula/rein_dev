import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

export default function CauseEffectTable(props) {
  const { theme, header, bodySections } = props;
  const _styles = StyleSheet.create({
    table: {
      width: '100%',
    },
    header: {
      color: theme.primary,
      alignItems: 'center',
      paddingBottom: 6,
    },
    row: {
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      borderBottomWidth: 0.5,
      borderBottomStyle: 'solid',
      borderBottomColor: theme.lighterGray,
    },
    cell: {
      paddingVertical: 3,
      paddingHorizontal: 6,
      overflow: 'hidden',
    },
    idCell: {
      color: 'black',
      textAlign: 'center',
    },
    borderLeft: {
      borderLeftWidth: 3,
      borderLeftStyle: 'solid',
    },
  });

  return (
    <View style={_styles.table} break>
      <View style={[_styles.row, _styles.header]}>
        {header.map((cell, index) => (
          <Text style={[_styles.cell, { ...cell.styles }]} key={index}>
            {cell.name}
          </Text>
        ))}
      </View>
      {bodySections.map((body, index) => (
        <View
          style={body.borderLeftColor && [_styles.borderLeft, { borderLeftColor: body.borderLeftColor }]}
          key={index}
        >
          {body.rows.map((item, index) => (
            <View style={_styles.row} key={index}>
              {header.map((cell, index) => (
                <Text style={[_styles.cell, { ...cell.styles }, index === 0 && body.firstColStyles]} key={index}>
                  {item[header[index].key]}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
CauseEffectTable.propTypes = {
  theme: PropTypes.objectOf(PropTypes.string).isRequired,
  header: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      key: PropTypes.string,
      styles: PropTypes.objectOf(PropTypes.string),
    })
  ).isRequired,
  bodySections: PropTypes.arrayOf(
    PropTypes.shape({
      rows: PropTypes.arrayOf(PropTypes.shape()),
      borderLeftColor: PropTypes.string,
      firstColStyles: PropTypes.objectOf(PropTypes.string),
    })
  ).isRequired,
};
