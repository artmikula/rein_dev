/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';
import { Button, Table } from 'reactstrap';
import { Link, useHistory } from 'react-router-dom';
import projectService from 'features/project/services/projectService';
import workService from 'features/project/work/services/workService';
import ProjectList, { defaultSortObj } from 'features/shared/components/ProjectList';
import toLocalTime from 'features/shared/lib/utils';
import Language from 'features/shared/languages/Language';
// import WorkExplorer from './WorkExplorer';

const defaultSort = { ...defaultSortObj };

function ProjectExplorer() {
  const [state, setState] = useState({
    page: 1,
    totalPage: 1,
    filter: '',
    sort: defaultSort,
    data: [],
    projectSelected: undefined,
  });
  const { page, totalPage, filter, sort, data, projectSelected } = state;

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

  const onChangePage = (page) => setState({ ...state, page });

  const handleSearch = (filter) => setState({ ...state, filter });

  const handleSort = (sort) => setState({ ...state, sort });

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

  const workColumns = [
    {
      headerName: Language.get('workname'),
      key: 'name',
      sortable: true,
      // eslint-disable-next-line react/prop-types
      onRender: ({ name }) => <Link to="#">{name}</Link>,
    },
    {
      headerName: Language.get('createdDate'),
      key: 'createdDate',
      format: (value) => toLocalTime(value) || null,
      sortable: true,
    },
    {
      headerName: Language.get('lastModifiedDate'),
      key: 'lastModifiedDate',
      format: (value) => toLocalTime(value) || null,
      sortable: true,
    },
    {
      headerName: '',
      key: 'action',
    },
  ];

  const _renderExpandButton = (project, projectIndex) => {
    const iconName = projectSelected ? 'bi-dash-lg' : 'bi-plus-lg';

    if (project?.works?.length === 0) {
      return null;
    }
    return (
      <>
        <Button color="transparent" className="expand-btn" onClick={() => _toggleExpandButton(projectIndex)}>
          <i className={`bi ${iconName} expand-icon`} />
        </Button>
        {projectSelected && (
          <Table>
            <thead>
              <tr>
                {workColumns.map((column, i) => (
                  <th key={i} className={column.sortable ? 'sortable' : undefined} onClick={() => handleSort(column)}>
                    {column.headerName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data[projectSelected].works.map((work) => {
                return (
                  <tr key={project.id}>
                    {workColumns.map((column) => (
                      <td key={column.key} className="align-middle">
                        {work[column.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </>
    );
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
    <ProjectList
      columnSchema={columns}
      pagingOptions={{ page, totalPage, onChangePage }}
      sort={sort}
      filter={filter}
      data={data}
      onSort={handleSort}
      onSearch={handleSearch}
      onEditName={getData}
      onDelete={getData}
    />
  );
}

export default ProjectExplorer;
