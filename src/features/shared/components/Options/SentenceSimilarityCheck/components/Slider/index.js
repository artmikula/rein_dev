import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { Input } from 'reactstrap';
import './style.scss';

export default function Slider({ className, ...props }) {
  const ref = useRef(null);
  const arr = [];
  for (let i = 0; i < 11; i++) {
    arr.push(i);
  }
  useEffect(() => {
    if (ref.current) {
      const DOM = ref.current.childNodes[1];
      if (DOM) {
        const background = `linear-gradient(to right, rgb(0, 120, 212) ${props.value}%, #e5e5e5 ${props.value}%);`;
        DOM.setAttribute('style', `background:${background}`);
      }
    }
  });
  return (
    <div className={`similarity-slider-container ${className}`} ref={ref}>
      <div className="d-flex w-100 justify-content-between">
        {arr.map((value, index) => {
          return <div className="similarity-slider-step" key={index} />;
        })}
      </div>
      <Input type="range" className="similarity-slider" {...props} min={0} max={100} step={1} />
    </div>
  );
}

Slider.defaultProps = {
  className: '',
  value: 0,
};

Slider.propTypes = {
  className: PropTypes.string,
  value: PropTypes.number,
};
