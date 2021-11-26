/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import PropTypes from 'prop-types';
import React from 'react';
import './style.scss';

export default function ListItem({
  value,
  label,
  selected,
  selectable,
  onSelect,
  onRemove,
  removable,
  checked,
  checkable,
  onCheck,
}) {
  const handleCheck = (e) => {
    e.stopPropagation();
    if (checkable) {
      onCheck(value, e.target.checked);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (removable) {
      onRemove(value);
    }
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (selectable) {
      onSelect(value);
    }
  };

  return (
    <div className={`d-flex px-2 list-item align-items-center ${selected && 'selected'}`} onClick={handleSelect}>
      {checkable && <input type="checkbox" checked={checked} onChange={handleCheck} />}
      <label className="flex-grow-1 mb-0 ml-2" htmlFor="">
        {label}
      </label>
      {removable && (
        <button type="button" className="border-0 outline-0 icon-btn bg" onClick={handleRemove}>
          <i className="bi bi-trash-fill text-danger" />
        </button>
      )}
    </div>
  );
}

ListItem.defaultProps = {
  onSelect: () => {},
  onRemove: () => {},
  onCheck: () => {},
  removable: false,
  selected: false,
  selectable: false,
  checkable: false,
  checked: false,
};

ListItem.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  selected: PropTypes.bool,
  removable: PropTypes.bool,
  onSelect: PropTypes.func,
  onRemove: PropTypes.func,
  selectable: PropTypes.bool,
  checkable: PropTypes.bool,
  checked: PropTypes.bool,
  onCheck: PropTypes.func,
};
