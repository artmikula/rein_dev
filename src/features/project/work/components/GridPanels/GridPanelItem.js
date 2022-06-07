import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Language from 'features/shared/languages/Language';
import { Button, TabContent, TabPane, UncontrolledTooltip } from 'reactstrap';
import './style.scss';

export default function GridPanelItem(props) {
  const [activeTab, setActiveTab] = useState(0);
  const { isCollapse, isLockedPanel, title, tabs, index, children, onTogglePanel, renderTitle, raiseEvent } = props;

  const innerRenderTitle = () => {
    if (renderTitle) {
      return renderTitle(title);
    }
    return title;
  };

  const _handleGenerateTestCase = () => {
    setActiveTab(0);
    if (typeof raiseEvent === 'function') {
      raiseEvent();
    }
  };

  return (
    <>
      <div
        className={`draggable-tag collapse-title bg-light p-2 rounded-top ${
          isCollapse ? 'collapse-title-vertical h-100 pt-5' : ''
        } ${!isLockedPanel ? 'cursor-move' : ''}`}
      >
        {tabs && tabs.length > 0 ? (
          <div style={{ width: '95%', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {tabs.map((tab, index) => (
                <span
                  key={index}
                  role="button"
                  tabIndex={index}
                  onKeyPress={() => {}}
                  onClick={() => setActiveTab(index)}
                >
                  {index > 0 && <span style={{ borderRight: '2px solid #ccc', margin: '0 8px' }} />}
                  <span className={`collapse-title-tab ${activeTab === index ? 'active' : ''}`}>{tab}</span>
                </span>
              ))}
            </div>
            {activeTab === 1 && (
              <Button
                color="link"
                size="sm"
                style={{ padding: 0, fontSize: '0.8rem', border: 0 }}
                onClick={() => {
                  _handleGenerateTestCase();
                }}
              >
                {Language.get('generatetestcase')}
              </Button>
            )}
          </div>
        ) : (
          innerRenderTitle()
        )}
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
  renderTitle: undefined,
  raiseEvent: undefined,
  onTogglePanel: () => {},
};

GridPanelItem.propTypes = {
  isCollapse: PropTypes.bool.isRequired,
  isLockedPanel: PropTypes.bool,
  title: PropTypes.string,
  renderTitle: PropTypes.func,
  tabs: PropTypes.arrayOf(PropTypes.string),
  index: PropTypes.number.isRequired,
  onTogglePanel: PropTypes.func,
  raiseEvent: PropTypes.func,
};
