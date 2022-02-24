import projectService from 'features/project/services/projectService';
import ProjectList, { defaultSortObj } from 'features/shared/components/ProjectList';
import React, { useEffect, useState } from 'react';

const defaultSort = `${defaultSortObj.column},${defaultSortObj.direction}`;

function ProjectExplorer() {
  const [state, setState] = useState({ page: 1, totalPage: 1, filter: '', sort: defaultSort, data: [] });
  const { page, totalPage, filter, sort, data } = state;

  const getData = async () => {
    const data = await projectService.listAsync(page, 5, filter, `${sort.column},${sort.direction}`);
    let _page = page;

    if (_page > totalPage) {
      _page = totalPage;
    }

    if (_page === 0) {
      _page = 1;
    }

    setState({
      ...state,
      data: data.items,
      totalPage: parseInt((data.totalRow - 1) / data.pageSize + 1, 10),
      page: _page,
    });
  };

  useEffect(() => {
    getData();
  }, [page, filter, sort]);

  const handleChangePage = (page) => setState({ ...state, page });

  const handleSearch = (filter) => setState({ ...state, filter });

  const handleSort = (sort) => setState({ ...state, sort });

  return (
    <ProjectList
      totalPage={totalPage}
      page={page}
      sort={sort}
      filter={filter}
      data={data}
      onSort={handleSort}
      onSearch={handleSearch}
      onChangePage={handleChangePage}
      onEditName={getData}
      onDelete={getData}
    />
  );
}

export default ProjectExplorer;
