import PropTypes from 'prop-types';
import React, { Fragment, useState } from 'react';
import { Button, TabContent, TabPane, UncontrolledTooltip } from 'reactstrap';
import './style.scss';

export default function GridPanelItem(props) {
  const [activeTab, setActiveTab] = useState(0);
  const { isCollapse, isLockedPanel, title, tabs, index, children, onTogglePanel, renderTitle } = props;

  const innerRenderTitle = () => {
    if (renderTitle) {
      return renderTitle(title);
    }
    return title;
  };

  return (
    <>
      <div
        className={`draggable-tag collapse-title bg-light p-2 rounded-top ${
          isCollapse ? 'collapse-title-vertical h-100 pt-5' : ''
        } ${!isLockedPanel ? 'cursor-move' : ''}`}
      >
        {tabs && tabs.length > 0
          ? tabs.map((tab, index) => (
              <Fragment key={index}>
                {index > 0 && <span className="mx-2 text-muted">|</span>}
                <span
                  className={`collapse-title-tab ${activeTab === index ? 'active' : ''}`}
                  role="button"
                  tabIndex={index}
                  onKeyPress={() => {}}
                  onClick={() => setActiveTab(index)}
                >
                  {tab}
                </span>
              </Fragment>
            ))
          : innerRenderTitle()}
      </div>
      {!isLockedPanel && (
        <>
          <Button
            color="link"
            size="sm"
            id={`panel${index}`}
            className="icon-btn py-1 px-2 collapse-btn-position text-orange"
            onClick={onTogglePanel}
          >
            {isCollapse ? <i className="bi bi-chevron-double-right" /> : <i className="bi bi-chevron-double-left" />}
          </Button>
          <UncontrolledTooltip target={`panel${index}`}>
            <small>{title}</small>
          </UncontrolledTooltip>
        </>
      )}
      {!isCollapse && (
        <div className={`h-100 scrollbar-sm ${isCollapse ? 'overflow-hidden' : 'overflow-auto'}`}>
          {children.length && children.length > 0 ? (
            <TabContent activeTab={activeTab}>
              {children.map((child, index) => (
                <TabPane tabId={index} key={index}>
                  {child}
                </TabPane>
              ))}
            </TabContent>
          ) : (
            children
          )}
        </div>
      )}
    </>
  );
}

GridPanelItem.defaultProps = {
  title: '',
  isLockedPanel: false,
  tabs: [],
  onTogglePanel: () => {},
};

GridPanelItem.propTypes = {
  isCollapse: PropTypes.bool.isRequired,
  isLockedPanel: PropTypes.bool,
  title: PropTypes.string,
  tabs: PropTypes.arrayOf(PropTypes.string),
  index: PropTypes.number.isRequired,
  onTogglePanel: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)]).isRequired,
};
