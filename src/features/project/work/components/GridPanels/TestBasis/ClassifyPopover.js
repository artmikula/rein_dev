import Language from 'features/shared/languages/Language';
import PropTypes from 'prop-types';
import React from 'react';
import { Popover } from 'react-tiny-popover';
import { ListGroup, ListGroupItem } from 'reactstrap';
import { CLASSIFY } from '../../../../../shared/constants';

export default function ClassifyPopover(props) {
  const { isOpen, visibleSelectionRect, onClickItem } = props;

  const handleMouseDown = (e) => {
    e.stopPropagation();
    const type = e.target.getAttribute('classifytype');
    onClickItem(type);
  };

  return (
    <Popover
      containerClassName="bg-white"
      isOpen={isOpen}
      content={
        <ListGroup>
          <ListGroupItem
            className="small p-2 text-primary"
            tag="button"
            action
            classifytype={CLASSIFY.CAUSE}
            onMouseDown={handleMouseDown}
          >
            {Language.get('classifyascause')}
          </ListGroupItem>
          <ListGroupItem
            className="small p-2 text-success"
            tag="button"
            action
            classifytype={CLASSIFY.EFFECT}
            onMouseDown={handleMouseDown}
          >
            {Language.get('classifyaseffect')}
          </ListGroupItem>
        </ListGroup>
      }
      contentLocation={{
        top: visibleSelectionRect?.top - 5,
        left: visibleSelectionRect?.left + visibleSelectionRect?.width + 5,
      }}
    >
      <span id="cause-effect-popover" />
    </Popover>
  );
}
ClassifyPopover.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  visibleSelectionRect: PropTypes.shape({
    bottom: PropTypes.number,
    height: PropTypes.number,
    left: PropTypes.number,
    right: PropTypes.number,
    top: PropTypes.number,
    width: PropTypes.number,
  }),
  onClickItem: PropTypes.func.isRequired,
};
ClassifyPopover.defaultProps = {
  visibleSelectionRect: {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
  },
};
