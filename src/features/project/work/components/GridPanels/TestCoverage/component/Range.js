import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import './style.scss';

export default function Range({ value, kiloValue, className, onChange, editable, ...props }) {
  const rangeUpRef = React.useRef(null);
  const rangeDownRef = React.useRef(null);
  const rangeInputRef = React.useRef(null);
  const numberInputRef = React.useRef(null);
  const labelRef = React.useRef(null);
  const containerRef = React.useRef(null);

  const _slider = (value) => {
    if (rangeInputRef.current) {
      rangeInputRef.current.style.background = `linear-gradient(to right, #0078d4 ${value}%, #eaeaea ${value}%`;
    }
    if (containerRef.current && numberInputRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const textbox = numberInputRef.current.getBoundingClientRect();
      if (rangeUpRef.current) {
        const upH = textbox.top - container.top;
        rangeUpRef.current.style.height = `${upH}px`;
      }
      if (rangeDownRef.current) {
        const downH = container.bottom - textbox.bottom;
        rangeDownRef.current.style.height = `${downH}px`;
      }
    }
  };

  const _setInputOrLabelBottom = (value) => {
    const ref = editable ? numberInputRef : labelRef;
    if (containerRef.current && ref.current) {
      let percent = value > 100 ? 100 : value;
      percent = percent < 0 ? 0 : percent;
      if (editable) {
        ref.current.value = value;
        if ((containerRef.current.clientHeight * percent) / 100 + 30 < containerRef.current.clientHeight) {
          if (percent === 0) {
            ref.current.style.bottom = `calc(${percent}%)`;
          } else {
            ref.current.style.bottom = `calc(${percent}% - 1px)`;
          }
        } else {
          ref.current.style.bottom = `calc(${percent}% - 22px)`;
        }
      } else if ((containerRef.current.clientHeight * percent) / 100 - 22 < 0) {
        ref.current.style.bottom = `${percent}%`;
        ref.current.style.color = '#0078d4';
      } else {
        ref.current.style.bottom = `calc(${percent}% - 22px)`;
        ref.current.style.color = 'white';
      }
    }
  };

  const _onChange = (e) => {
    const value = parseFloat(e.target.value);
    if (editable) {
      _slider(value);
      _setInputOrLabelBottom(value);
      onChange(value);
    }
  };

  const _setRangeWidth = () => {
    if (rangeInputRef.current) {
      rangeInputRef.current.style.width = `${containerRef.current.clientHeight}px`;
    }
  };

  const _handleFocus = (e) => {
    e.target.type = 'text';
    e.target.setSelectionRange(0, e.target.value.length);
    e.target.type = 'number';
  };

  const _handleBlur = (e) => {
    const { value } = e.target;
    let _value = parseFloat(value) > 100 ? 100 : parseFloat(value);
    _value = _value < 0 ? 0 : _value;

    if (editable) {
      _slider(_value);
      _setInputOrLabelBottom(_value);
      onChange(_value);
    }
  };

  const _handleKeyPress = (e) => {
    if (e.which === 13) {
      numberInputRef.current.blur();
    }
  };

  useEffect(() => {
    _slider(value);
    _setInputOrLabelBottom(value);
  }, [value, editable]);

  useEffect(() => {
    _setRangeWidth();
    const ro = new ResizeObserver(_setRangeWidth);
    ro.observe(containerRef.current);
  }, []);

  const defaultClasses = 'h-100 d-flex flex-column align-items-center range-container';

  return (
    <div className={`${defaultClasses} ${editable ? '' : 'disabled'} ${className}`} {...props}>
      <span className="small">{kiloValue}</span>
      <div
        className="d-flex flex-grow-1 justify-content-center align-items-center position-relative"
        ref={containerRef}
      >
        <span className="range-up" ref={rangeUpRef} />
        <span className="range-down" ref={rangeDownRef} />
        <input
          value={value}
          type="range"
          min={0}
          max={100}
          onChange={_onChange}
          ref={rangeInputRef}
          style={{ background: `linear-gradient(to right, #0078d4 ${value}%, #eaeaea ${value}%` }}
          onMouseEnter={(e) => {
            if (!editable) {
              return;
            }
            if (numberInputRef.current) {
              const textboxTop = numberInputRef.current.getBoundingClientRect()?.top;
              if (e.clientY < textboxTop) {
                // hover UP
                if (rangeUpRef.current) {
                  // eslint-disable-next-line max-len
                  rangeInputRef.current.style.background = `linear-gradient(to right, #0078d4 ${value}%, transparent ${value}%`;
                  rangeUpRef.current.style.display = 'block';
                }
              } else if (rangeDownRef.current) {
                // hover DOWN
                // eslint-disable-next-line max-len
                rangeInputRef.current.style.background = `linear-gradient(to right, transparent ${value}%, #eaeaea ${value}%`;
                rangeDownRef.current.style.display = 'block';
              }
            }
          }}
          onMouseLeave={() => {
            if (!editable) {
              return;
            }
            rangeInputRef.current.style.background = `linear-gradient(to right, #0078d4 ${value}%, #eaeaea ${value}%`;
            if (rangeUpRef.current) {
              rangeUpRef.current.style.display = 'none';
            }
            if (rangeDownRef.current) {
              rangeDownRef.current.style.display = 'none';
            }
          }}
        />
        {editable ? (
          <input
            type="number"
            ref={numberInputRef}
            min={0}
            max={100}
            defaultValue={value}
            className={`position-absolute number-input border text-center ${editable ? 'd-block' : 'd-none'}`}
            onFocus={_handleFocus}
            onKeyPress={_handleKeyPress}
            onBlur={_handleBlur}
          />
        ) : (
          <span ref={labelRef} className={`position-absolute value ${!editable ? 'd-block' : 'd-none'}`}>
            {value.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}

Range.defaultProps = {
  value: undefined,
  onChange: () => {},
  className: '',
  editable: true,
  kiloValue: '',
};

Range.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  className: PropTypes.string,
  editable: PropTypes.bool,
  kiloValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
