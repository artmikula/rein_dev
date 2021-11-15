import PropTypes from 'prop-types';
import React from 'react';
import ListItem from '../ListItem';

function List({ data, getValue, getLabel, getSelected, onSelect, getKey }) {
  return (
    <div style={{ height: '300px' }} className="overflow-auto">
      {data.map((item) => {
        return (
          <ListItem
            key={getKey(item)}
            value={getValue(item)}
            label={getLabel(item)}
            selected={getSelected(item)}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}

List.defaultProps = {
  onSelect: () => {},
  getSelected: () => false,
};

List.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  getValue: PropTypes.func.isRequired,
  getLabel: PropTypes.func.isRequired,
  getKey: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  getSelected: PropTypes.func,
};

export default List;
