/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';
import { Button, InputGroup, Input } from 'reactstrap';
import projectService from 'features/project/services/projectService';
import { SORT_DEFAULT } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import ProjectList from './ProjectList';

function ProjectExplorer() {
  const [state, setState] = useState({
    filter: '',
    sort: { ...SORT_DEFAULT },
    data: [],
    pagingOptions: {
      page: 1,
      totalPage: 1,
    },
  });
  const { filter, sort, data, pagingOptions } = state;

  const _getData = async () => {
    const { page, totalPage } = pagingOptions;
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
      pagingOptions: {
        page: _page,
        totalPage: parseInt((data.totalRow - 1) / data.pageSize + 1, 10),
      },
    });
  };

  useEffect(() => {
    _getData();
  }, [pagingOptions.page, filter, sort]);

  const _onChangePage = (page) => setState({ ...state, pagingOptions: { ...pagingOptions, page } });

  const _onSearch = async () => {
    const filter = document.getElementById('search-project-box').value;

    setState({ ...state, filter });
  };

  const _onPressEnter = (e) => {
    if (e.which === 13) {
      _onSearch();
    }
  };

  const _onSort = (sort) => setState({ ...state, sort });

  const _onEdit = async (selectedId, formValues, { setErrors, setSubmitting }) => {
    const result = await projectService.updateAsync(selectedId, formValues);

    setSubmitting(false);
    if (result.error) {
      const { Name } = result.error.response.data;
      const errorMessage = Name.join(' ');
      setErrors({
        _summary_: errorMessage,
      });
      return false;
    }
    _getData();
    return true;
  };

  const _onDelete = async (projectId) => {
    await projectService.deleteAsync(projectId);
    _getData();
  };

  return (
    <>
      <div className="d-flex justify-content-end">
        <InputGroup style={{ width: '100%', maxWidth: '350px', margin: '10px' }}>
          <Input
            id="search-project-box"
            defaultValue={filter}
            placeholder={Language.get('projectsearchplaceholder')}
            onKeyPress={_onPressEnter}
          />
          <Button style={{ height: '36.39px', marginLeft: '8px' }} color="primary" onClick={_onSearch}>
            <i className="bi bi-search" />
          </Button>
        </InputGroup>
      </div>
      <ProjectList
        data={data}
        sort={sort}
        pagingOptions={pagingOptions}
        onChangePage={_onChangePage}
        onSort={_onSort}
        onEdit={_onEdit}
        onDelete={_onDelete}
      />
    </>
  );
}

export default ProjectExplorer;
