import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { Table } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import TemplateItem from '../TemplateItem';
import './style.scss';

export default function TemplateList({ onSelectRow, selectedItemId }) {
  const [data, setData] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const getData = async () => {
    const data = [
      { id: uuidv4(), name: 'Template 1', createdDate: new Date(), lastModifiedDate: null },
      { id: uuidv4(), name: 'Template 2', createdDate: new Date(), lastModifiedDate: null },
      { id: uuidv4(), name: 'Template 3', createdDate: new Date(), lastModifiedDate: null },
      { id: uuidv4(), name: 'Template 4', createdDate: new Date(), lastModifiedDate: null },
      { id: uuidv4(), name: 'Template 5', createdDate: new Date(), lastModifiedDate: null },
      { id: uuidv4(), name: 'Template 6', createdDate: new Date(), lastModifiedDate: null },
      { id: uuidv4(), name: 'Template 7', createdDate: new Date(), lastModifiedDate: null },
      { id: uuidv4(), name: 'Template 8', createdDate: new Date(), lastModifiedDate: null },
      { id: uuidv4(), name: 'Template 9', createdDate: new Date(), lastModifiedDate: null },
    ];

    setData(data);
  };

  const confirmDelete = (item) => {
    setData(data.filter((x) => x.id !== item.id));
  };

  const handleDelete = (item) => {
    confirm('areyousureyouwanttocontinue', { yesAction: () => confirmDelete(item) });
  };

  const handleClick = (item) => {
    setSelectedId(item.id);
    onSelectRow(item);
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    setSelectedId(selectedItemId);
  }, [selectedItemId]);

  return (
    <div className="template-list">
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Created date</th>
            <th>Last modified date</th>
            <th className="text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            return (
              <TemplateItem
                item={item}
                onDelete={handleDelete}
                onClick={handleClick}
                selected={item.id === selectedId}
              />
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

TemplateList.defaultProps = {
  onSelectRow: () => {},
  selectedItemId: null,
};

TemplateList.propTypes = {
  onSelectRow: PropTypes.func,
  selectedItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
