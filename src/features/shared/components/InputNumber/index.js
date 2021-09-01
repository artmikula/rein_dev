import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './style.scss';

export default function InputNumber({ onChange, affix, className, min, max, step, value, disabled, ...props }) {
  const _handleUp = () => {
    let _value = value + step;
    _value = (max || max === 0) && _value > max ? max : _value;
    onChange(_value);
  };

  const _handleDown = () => {
    let _value = value - step;
    _value = (min || min === 0) && _value < min ? min : _value;
    onChange(_value);
  };

  const _handleFocus = (e) => {
    e.target.type = 'text';
    e.target.setSelectionRange(0, e.target.value.length);
    e.target.type = 'number';
  };

  const _handleBlur = (e) => {
    let number = parseInt(e.target.value, 10);
    number = number || 0;
    number = number > max ? max : number;
    number = number < min ? min : number;
    e.target.value = number;
    onChange(number);
  };

  const ref = useRef();
  useEffect(() => {
    if (ref.current.value !== value) {
      ref.current.value = value;
    }
  });

  return (
    <div className={`input-number border ${className}`}>
      <input
        ref={ref}
        className="border-0 flex-grow-1 pr-1 text-right"
        disabled={disabled}
        defaultValue={value}
        {...props}
        type="number"
        onFocus={_handleFocus}
        onBlur={_handleBlur}
      />
      {affix && <span>{affix}</span>}
      <div className="d-flex flex-column ml-1">
        <button
          onClick={_handleUp}
          type="button"
          className="up border-0 d-flex align-items-center"
          disabled={disabled || ((max || max === 0) && value === max)}
        >
          <i className="bi bi-chevron-up" />
        </button>
        <button
          onClick={_handleDown}
          type="button"
          className="down border-0 d-flex align-items-center"
          disabled={disabled || ((min || min === 0) && value === min)}
        >
          <i className="bi bi-chevron-down" />
        </button>
      </div>
    </div>
  );
}

InputNumber.defaultProps = {
  affix: undefined,
  className: '',
  min: undefined,
  max: undefined,
  step: 1,
  onChange: () => {},
  value: 0,
  disabled: false,
};

InputNumber.propTypes = {
  affix: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  className: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  onChange: PropTypes.func,
  value: PropTypes.number,
  disabled: PropTypes.bool,
};
