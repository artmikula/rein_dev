import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, TabContent, TabPane, UncontrolledTooltip } from 'reactstrap';
import Language from 'features/shared/languages/Language';
import './style.scss';

export default function GridPanelItem(props) {
  const {
    isCollapse,
    isLockedPanel,
    title,
    tabs,
    index,
    children,
    onTogglePanel,
    renderTitle,
    generateTestCase,
    isShowGenerateButton,
  } = props;
  const [activeTab, setActiveTab] = useState(0);

  const innerRenderTitle = () => {
    if (renderTitle) {
      return renderTitle(title);
    }
    return title;
  };

  const _handleGenerateTestCase = () => {
    if (activeTab !== 0) {
      setActiveTab(0);
    }
    if (typeof generateTestCase === 'function') {
      generateTestCase();
    }
  };

  const _onChangeTab = (tabIndex) => {
    if (tabIndex !== activeTab) {
      setActiveTab(tabIndex);
      if (tabIndex === 0) {
        if (typeof generateTestCase === 'function') {
          generateTestCase();
        }
      }
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
                  onClick={() => _onChangeTab(index)}
                >
                  {index > 0 && <span style={{ borderRight: '2px solid #ccc', margin: '0 8px' }} />}
                  <span className={`collapse-title-tab ${activeTab === index ? 'active' : ''}`}>{tab}</span>
                </span>
              ))}
            </div>
            {isShowGenerateButton && (
              <Button
                color="transparent"
                size="sm"
                style={{ padding: '0 5px', fontSize: '0.8rem', border: '1px solid #ccc' }}
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
  generateTestCase: undefined,
  isShowGenerateButton: false,
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
  generateTestCase: PropTypes.func,
  isShowGenerateButton: PropTypes.bool,
};
