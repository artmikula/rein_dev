import PropTypes from 'prop-types';
import React from 'react';
import ListItem from '../ListItem';

function List({ data, getValue, getLabel, getSelected, onSelect, getKey, onDelete, ...props }) {
  return (
    <div>
      {data.map((item) => {
        return (
          <ListItem
            key={getKey(item)}
            value={getValue(item)}
            label={getLabel(item)}
            selected={getSelected(item)}
            onSelect={onSelect}
            onDelete={onDelete}
            {...props}
          />
        );
      })}
    </div>
  );
}

List.defaultProps = {
  onSelect: () => {},
  onDelete: () => {},
  getSelected: () => false,
};

List.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  getValue: PropTypes.func.isRequired,
  getLabel: PropTypes.func.isRequired,
  getKey: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  onDelete: PropTypes.func,
  getSelected: PropTypes.func,
};

export default List;
