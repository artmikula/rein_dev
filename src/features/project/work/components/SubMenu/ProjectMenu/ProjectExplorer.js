/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';
import { Button, InputGroup, Input } from 'reactstrap';
import { Link, useHistory } from 'react-router-dom';
import projectService from 'features/project/services/projectService';
import workService from 'features/project/work/services/workService';
import ProjectList from 'features/shared/components/ProjectList';
import { SORT_DEFAULT } from 'features/shared/constants';
import toLocalTime from 'features/shared/lib/utils';
import Language from 'features/shared/languages/Language';

function ProjectExplorer() {
  const [state, setState] = useState({
    page: 1,
    totalPage: 1,
    filter: '',
    sort: { ...SORT_DEFAULT },
    data: [],
    projectSelected: undefined,
  });
  const { page, totalPage, filter, sort, data, projectSelected } = state;

  const _getData = async () => {
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
    _getData();
  }, [page, filter, sort]);

  const _onChangePage = (page) => setState({ ...state, page });

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

  const _goToWorkPage = async (projectId) => {
    const history = useHistory();
    const data = await workService.listAsync(projectId, 1, 1);

    if (data.items.length > 0) {
      history.push(`/project/${projectId}/work/${data.items[0].id}`);
    }
  };

  const _toggleExpandButton = (projectIndex) =>
    setState((state) => {
      if (typeof state.projectSelected === 'undefined' && projectIndex) {
        return { ...state, projectSelected: projectIndex };
      }
      return { ...state, projectSelected: undefined };
    });

  const _renderExpandButton = (project, projectIndex) => {
    const { works } = project;
    const iconName = projectSelected ? 'bi-dash-lg' : 'bi-plus-lg';

    if (works && works.length > 0) {
      return (
        <Button color="transparent" className="expand-btn" onClick={() => _toggleExpandButton(projectIndex)}>
          <i className={`bi ${iconName} expand-icon`} />
        </Button>
      );
    }
    return null;
  };

  const columns = [
    {
      headerName: '',
      key: 'expand',
      sortable: false,
      onRender: (item, index) => _renderExpandButton(item, index),
    },
    {
      headerName: Language.get('projectname'),
      key: 'name',
      sortable: true,
      // eslint-disable-next-line react/prop-types
      onRender: ({ id, name }) => (
        <Link onClick={() => _goToWorkPage(id)} to="#">
          {name}
        </Link>
      ),
    },
    {
      headerName: Language.get('createddate'),
      key: 'createdDate',
      format: (value) => toLocalTime(value) || null,
      sortable: true,
    },
    {
      headerName: Language.get('lastmodifieddate'),
      key: 'lastModifiedDate',
      format: (value) => toLocalTime(value) || null,
      sortable: true,
    },
    {
      headerName: '',
      key: 'action',
    },
  ];

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
        columns={columns}
        pagingOptions={{ page, totalPage, onChangePage: _onChangePage }}
        sort={sort}
        data={data}
        onSort={_onSort}
        reloadData={_getData}
      />
    </>
  );
}

export default ProjectExplorer;
