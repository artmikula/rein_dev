import React from 'react';
import PropTypes from 'prop-types';
import { CLASSIFY } from '../../../../../shared/constants';

export default function DecoratedText(props) {
  const { type, children } = props;
  return (
    <span className={`rounded text-white px-1 ${type === CLASSIFY.CAUSE ? 'bg-primary' : 'bg-success'}`}>
      {children}
    </span>
  );
}
DecoratedText.propTypes = {
  type: PropTypes.oneOf([CLASSIFY.CAUSE, CLASSIFY.EFFECT, undefined]),
  children: PropTypes.node.isRequired,
};
DecoratedText.defaultProps = {
  type: undefined,
};
