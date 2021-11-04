import templateService from 'features/project/work/services/templateService';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Pagination, PaginationItem, PaginationLink, Table } from 'reactstrap';
import TemplateItem from '../TemplateItem';
import './style.scss';

function TemplateList({ onSelectRow = () => {}, selectedItemId = null, onSuccessDelete = () => {} }, ref) {
  const [selectedId, setSelectedId] = useState(null);
  const [data, setData] = useState({ items: [], page: 1, pageSize: 5, totalRow: 0 });

  const getTemplateList = async (page) => {
    const result = await templateService.listAsync(page);
    if (result.data) {
      setData(result.data);
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

  const { page, pageSize, totalRow, items } = data;
  const totalPage = Math.ceil((totalRow * 1.0) / pageSize);

  const handleChangePage = (page) => {
    setData({ ...data, page });
    getTemplateList(page);
  };

  return (
    <div className="template-list-wrapper">
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
            {items.map((item) => {
              return (
                <TemplateItem
                  key={item.id}
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
      <div className="d-flex justify-content-end mt-2">
        <Pagination>
          <PaginationItem disabled={page === 1}>
            <PaginationLink previous onClick={() => handleChangePage(page - 1)} />
          </PaginationItem>
          {[...Array(totalPage)].map((x, index) => {
            return (
              <PaginationItem key={index} active={index + 1 === page}>
                <PaginationLink onClick={() => handleChangePage(index + 1)}>{index + 1}</PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem disabled={page === totalPage}>
            <PaginationLink next onClick={() => handleChangePage(page + 1)} />
          </PaginationItem>
        </Pagination>
      </div>
    </div>
  );
}

export default forwardRef(TemplateList);
