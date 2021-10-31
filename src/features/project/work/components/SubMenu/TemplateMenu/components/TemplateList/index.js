import templateService from 'features/project/work/services/templateService';
import PropTypes from 'prop-types';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Table } from 'reactstrap';
import TemplateItem from '../TemplateItem';
import './style.scss';

function TemplateList({ onSelectRow, selectedItemId, onSuccessDelete }, ref) {
  const [selectedId, setSelectedId] = useState(null);
  const [data, setData] = useState([]);

  const getTemplateList = async () => {
    const result = await templateService.listAsync();
    if (result.data) {
      setData(result.data.items);
    }
  };

  const confirmDelete = async (item) => {
    const result = await templateService.deleteAsync(item.id);
    if (result.error) {
      alert(result.error);
    } else {
      getTemplateList();
      onSuccessDelete(item);
    }
  };

  const handleDelete = (item) => {
    confirm('areyousureyouwanttocontinue', { yesAction: () => confirmDelete(item) });
  };

  const handleClick = (item) => {
    setSelectedId(item.id);
    onSelectRow(item);
  };

  useImperativeHandle(ref, () => ({ reload: getTemplateList }));

  useEffect(() => {
    setSelectedId(selectedItemId);
  }, [selectedItemId]);

  useEffect(() => {
    getTemplateList();
  }, []);

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
  onSuccessDelete: () => {},
  selectedItemId: null,
};

TemplateList.propTypes = {
  onSelectRow: PropTypes.func,
  onSuccessDelete: PropTypes.func,
  selectedItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default forwardRef(TemplateList);
