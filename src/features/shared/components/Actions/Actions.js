import PropTypes from 'prop-types';
import React from 'react';
import { Card, List, PopoverBody, UncontrolledPopover } from 'reactstrap';
import './style.scss';

const Actions = ({ index, actions }) => {
  return (
    <>
      <span className="btn" id={`ActionButton${index}`}>
        <i className="bi bi-three-dots" />
      </span>
      <UncontrolledPopover trigger="legacy" placement="bottom" target={`ActionButton${index}`} className="popover">
        <PopoverBody className="actions">
          <Card className="box-shadow">
            <List type="unstyled" style={{ margin: 5 }}>
              {actions.map((x, index) => {
                return (
                  <summary key={index} onClick={x.action}>
                    <li className="item-hover px-2 py-1 z-">
                      <span>{x.icon}</span> <span className="ml-3"> {x.title}</span>
                    </li>
                  </summary>
                );
              })}
            </List>
          </Card>
        </PopoverBody>
      </UncontrolledPopover>
    </>
  );
};

Actions.propTypes = {
  index: PropTypes.number.isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      action: PropTypes.func,
      icon: PropTypes.node,
    })
  ).isRequired,
};

export default Actions;
