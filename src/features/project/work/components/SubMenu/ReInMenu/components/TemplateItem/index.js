import toLocalTime from 'features/shared/lib/utils';
import PropTypes from 'prop-types';
import React from 'react';
import { Button } from 'reactstrap';
import './style.scss';

export default function TemplateItem({ item, onClick, onDelete, selected }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(item);
  };

  const handleClick = () => {
    onClick(item);
  };

  return (
    <tr key={item.id} onClick={handleClick} className={selected ? 'template-item-selected' : null}>
      <td className="text-primary">{item.name}</td>
      <td>{toLocalTime(item.createdDate)}</td>
      <td>{item.lastModifiedDate && toLocalTime(item.lastModifiedDate)}</td>
      <td className="text-center">
        <Button color="link" size="sm" className="icon-btn mx-2 my-1" id="create-new-work" onClick={handleDelete}>
          <i className="bi bi-trash-fill text-danger" />
        </Button>
      </td>
    </tr>
  );
}

TemplateItem.defaultProps = {
  onClick: () => {},
  onDelete: () => {},
  selected: false,
};

TemplateItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    createdDate: PropTypes.oneOfType([PropTypes.string, PropTypes.objectOf(Date)]),
    lastModifiedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.objectOf(Date)]),
  }).isRequired,
  onClick: PropTypes.func,
  onDelete: PropTypes.func,
  selected: PropTypes.bool,
};
