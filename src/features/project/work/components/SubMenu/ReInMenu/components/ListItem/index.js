import PropTypes from 'prop-types';
import React from 'react';
import './style.scss';

export default function ListItem({ value, label, selected, onSelect, onDelete, removable, selectable }) {
  const handleCheck = (e) => selectable && onSelect(value, e.target.checked);
  const handleDelete = (e) => removable && onDelete(value);

  return (
    <div className="d-flex px-2 list-item align-items-center">
      <input type="checkbox" checked={selected} onChange={handleCheck} id={value} disabled={!selectable} />
      <label htmlFor={value} className="flex-grow-1 mb-0 ml-2">
        {label}
      </label>
      {removable && (
        <button type="button" className="border-0 outline-0 icon-btn bg" onClick={handleDelete}>
          <i className="bi bi-trash-fill text-danger" />
        </button>
      )}
    </div>
  );
}

ListItem.defaultProps = {
  onSelect: () => {},
  onDelete: () => {},
  selected: false,
  removable: false,
  selectable: false,
};

ListItem.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  removable: PropTypes.bool,
  onSelect: PropTypes.func,
  onDelete: PropTypes.func,
  selectable: PropTypes.bool,
};
