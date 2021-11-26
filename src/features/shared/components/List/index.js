import PropTypes from 'prop-types';
import React from 'react';
import ListItem from '../ListItem';

function List({ data, getValue, getLabel, getSelected, getChecked, getKey, ...props }) {
  return (
    <div>
      {data.map((item) => {
        return (
          <ListItem
            key={getKey(item)}
            value={getValue(item)}
            label={getLabel(item)}
            selected={getSelected(item)}
            checked={getChecked(item)}
            {...props}
          />
        );
      })}
    </div>
  );
}

List.defaultProps = {
  getSelected: () => false,
  getChecked: () => false,
};

List.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  getValue: PropTypes.func.isRequired,
  getLabel: PropTypes.func.isRequired,
  getKey: PropTypes.func.isRequired,
  getSelected: PropTypes.func,
  getChecked: PropTypes.func,
};

export default List;
