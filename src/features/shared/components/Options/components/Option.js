import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

export default function Option({ text, onClick, className, selected }) {
  const _className = clsx('option px-3 py-2 item-hover mb-1', selected && 'selected', className);
  return (
    <button onClick={onClick} type="button" className={_className}>
      {text}
    </button>
  );
}

Option.defaultProps = {
  onClick: () => {},
  className: '',
  selected: false,
};

Option.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  selected: PropTypes.bool,
};
