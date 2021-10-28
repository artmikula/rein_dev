import PropTypes from 'prop-types';
import React from 'react';
import './style.scss';
import SubMenuAction from './SubMenuAction';

export default function SubMenu({ actions, content, className }) {
  const renderActions = () => {
    if (actions.length > 0) {
      return actions.map((action, index) => (
        <SubMenuAction
          key={index}
          onClick={action.action}
          icon={action.icon}
          shortcutKeys={action.shortcutKeys}
          disabled={action.disabled}
        >
          {action.text}
        </SubMenuAction>
      ));
    }
    return null;
  };
  const renderContent = () => {
    return Boolean(content) && <div className="sub-menu-content border-left">{content}</div>;
  };
  return (
    <div className={`d-flex shadow sub-menu ${className} ${!content ? 'only-actions' : null}`}>
      <div className="py-2 flex-grow-1 sub-menu-actions">{renderActions()}</div>
      {renderContent()}
    </div>
  );
}

SubMenu.defaultProps = {
  content: '',
  className: '',
};

SubMenu.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string,
      action: PropTypes.func,
      icon: PropTypes.element,
      shortCut: PropTypes.string,
    })
  ).isRequired,
  content: PropTypes.node,
  className: PropTypes.string,
};
