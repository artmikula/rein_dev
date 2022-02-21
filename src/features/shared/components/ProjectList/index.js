import projectService from 'features/project/services/projectService';
import workService from 'features/project/work/services/workService';
import { ModalForm } from 'features/shared/components';
import Actions from 'features/shared/components/Actions/Actions';
import Language from 'features/shared/languages/Language';
import toLocalTime from 'features/shared/lib/utils';
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Button, Card, Input, InputGroup, Table } from 'reactstrap';
import CustomPagination from '../CustomPagination';

const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
};

const defaultSortObj = {
  column: 'lastmodifieddate',
  direction: SORT_DIRECTION.DESC,
};

const defaultSort = `${defaultSortObj.column},${defaultSortObj.direction}`;

class ProjectList extends Component {
  columns = [
    {
      headerName: Language.get('projectname'),
      key: 'name',
      sortable: true,
    },
    {
      headerName: Language.get('createddate'),
      key: 'createdDate',
      format: (value) => (value ? toLocalTime(value) : null),
      sortable: true,
    },
    {
      headerName: Language.get('lastmodifieddate'),
      key: 'lastModifiedDate',
      format: (value) => (value ? toLocalTime(value) : null),
      sortable: true,
    },
    {
      headerName: '',
      key: 'action',
    },
  ];

  constructor(props) {
    super(props);

    this.state = {
      projects: [],
      totalPage: 1,
      openEditModal: false,
      selectedId: 0,
    };
  }

  async componentDidMount() {
    this._getData();
  }

  async componentDidUpdate(prevProps) {
    const preLocation = prevProps.location;
    const { location } = this.props;
    const prevPage = this._getPage(preLocation);
    const currentPage = this._getPage(location);
    const prevFilter = this._getFilter(preLocation);
    const currentFilter = this._getFilter(location);
    const prevSort = this._getSort(preLocation);
    const currentSort = this._getSort(location);

    if (prevPage !== currentPage || prevFilter !== currentFilter || prevSort !== currentSort) {
      this._getData();
    }
  }

  _getData = async () => {
    const { location } = this.props;
    const page = this._getPage(location);
    const filter = this._getFilter(location);
    const sort = this._getSort(location);

    const data = await projectService.listAsync(page, 5, filter, sort);

    this.setState({
      projects: data.items,
      totalPage: parseInt((data.totalRow - 1) / data.pageSize + 1, 10),
    });
  };

  _getPage = (location) => {
    const query = new URLSearchParams(location.search);
    return query.get('page') && !Number.isNaN(query.get('page')) ? parseInt(query.get('page'), 10) : 1;
  };

  _getFilter = (location) => {
    const query = new URLSearchParams(location.search);
    return query.get('filter') ?? '';
  };

  _getSort = (location) => {
    const query = new URLSearchParams(location.search);
    return query.get('sort') ?? defaultSort;
  };

  _confirmDelete = async () => {
    const { selectedId } = this.state;
    await projectService.deleteAsync(selectedId);

    this._getData();
  };

  _deleteProject = (id) => {
    confirm(undefined, { yesAction: this._confirmDelete });
    this.setState({ selectedId: id });
  };

  _editProject = (id, name) => {
    this.setState({
      openEditModal: true,
      selectedId: id,
      selectedProjectName: name,
    });
  };

  _handleSubmitEditProject = async (values, { setErrors, setSubmitting }) => {
    const { selectedId } = this.state;
    const result = await projectService.updateAsync(selectedId, values);

    setSubmitting(false);
    if (result.error) {
      const { Name } = result.error.response.data;
      const errorMessage = Name.join(' ');
      setErrors({
        _summary_: errorMessage,
      });
    } else {
      this.setState({ openEditModal: false }, this._getData);
    }
  };

  _closeEditModal = () => {
    this.setState({
      openEditModal: false,
    });
  };

  _goToPage = (page) => {
    const { history, location } = this.props;
    const filter = this._getFilter(location);
    const sort = this._getSort(location);

    history.push(`/projects?page=${page}&filter=${filter}&sort=${sort}`);
  };

  _goToWorkPage = async (projectId) => {
    const { history } = this.props;
    const data = await workService.listAsync(projectId, 1, 1);
    if (data.items.length > 0) {
      history.push(`/project/${projectId}/work/${data.items[0].id}`);
    }
  };

  _getProjectSchema = (name) => {
    return {
      formTitle: Language.get('renameproject'),
      submitBtnName: Language.get('save'),
      cancelBtnName: Language.get('cancel'),
      formSchema: [
        {
          inputProps: {
            label: Language.get('name'),
            id: 'name',
            name: 'name',
            placeholder: '',
            type: 'text',
            required: true,
            maxLength: 256,
          },
          initialValue: name,
          fieldError: false,
          helperText: '',
        },
      ],
    };
  };

  handleClickSearch = async () => {
    const { history, location } = this.props;
    const sort = this._getSort(location);
    const filter = document.getElementById('search-project-box').value;

    history.push(`/projects?page=${1}&filter=${filter}&sort=${sort}`);
  };

  handlePressEnter = (e) => {
    if (e.which === 13) {
      this.handleClickSearch();
    }
  };

  handleSort = (item) => {
    if (!item.sortable) {
      return;
    }

    const { history, location } = this.props;
    const page = this._getPage(location);
    const filter = this._getFilter(location);
    const sort = this.getSortObject(this._getSort(location));
    const sortObject = { ...defaultSortObj };

    if (item.key === sort.column) {
      sortObject.column = item.key;
      sortObject.direction = sort.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;
    } else {
      sortObject.column = item.key;
      sortObject.direction = SORT_DIRECTION.ASC;
    }

    history.push(`/projects?page=${page}&filter=${filter}&sort=${sortObject.column},${sortObject.direction}`);
  };

  getSortIcon = (item, sort) => {
    if (!item.sortable) {
      return null;
    }

    if (sort.direction === SORT_DIRECTION.ASC) {
      return <i className={`bi bi-arrow-up sort-icon ${item.key === sort.column && 'sorted'}`} />;
    }

    if (sort.direction === SORT_DIRECTION.DESC) {
      return <i className={`bi bi-arrow-down sort-icon ${item.key === sort.column && 'sorted'}`} />;
    }

    return <i className="bi bi-arrow-up sort-icon" />;
  };

  getSortObject = (sort) => {
    let [column, direction] = sort.split(',');

    if (column !== 'name' && column !== 'createdDate' && column !== 'lastModifiedDate') {
      column = 'lastModifiedDate';
    }

    if (direction !== SORT_DIRECTION.ASC && direction !== SORT_DIRECTION.DESC) {
      direction = SORT_DIRECTION.DESC;
    }

    return { column, direction };
  };

  render() {
    const { projects, totalPage, selectedProjectName, openEditModal } = this.state;
    const { location } = this.props;
    const currentPage = this._getPage(location);
    const sort = this.getSortObject(this._getSort(location));
    const searchText = this._getFilter(location);

    return (
      <div>
        <div className="d-flex justify-content-end">
          <InputGroup style={{ width: '100%', maxWidth: '350px', margin: '10px' }}>
            <Input
              id="search-project-box"
              defaultValue={searchText}
              placeholder={Language.get('projectsearchplaceholder')}
              onKeyPress={this.handlePressEnter}
            />
            <Button style={{ height: '36.39px', marginLeft: '8px' }} color="primary" onClick={this.handleClickSearch}>
              <i className="bi bi-search" />
            </Button>
          </InputGroup>
        </div>
        <Card className="mt-1 box-shadow">
          <Table>
            <thead>
              <tr>
                {this.columns.map((column, i) => (
                  <th key={i} className={column.sortable && 'sortable'} onClick={() => this.handleSort(column)}>
                    {column.headerName}
                    {this.getSortIcon(column, sort)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => {
                return (
                  <tr key={index}>
                    {this.columns.map((column, i) => {
                      const value = project[column.key];
                      if (column.key !== 'action') {
                        if (column.key === 'name') {
                          return (
                            <td className="align-middle text-primary" key={i}>
                              <Link onClick={() => this._goToWorkPage(project.id)} to="#">
                                {value}
                              </Link>
                            </td>
                          );
                        }
                        return (
                          <td className="align-middle" key={i}>
                            {column.format ? column.format(value) : value}
                          </td>
                        );
                      }
                      return (
                        <td className="align-middle" title="Actions" key={i}>
                          <Actions
                            actions={[
                              {
                                icon: <i className="bi bi-trash-fill text-danger" />,
                                title: Language.get('delete'),
                                action: () => this._deleteProject(project.id),
                              },
                              {
                                icon: <i className="bi bi-pencil text-success" />,
                                title: Language.get('rename'),
                                action: () => this._editProject(project.id, project.name),
                              },
                            ]}
                            index={index}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>

        <div className="d-flex justify-content-end mt-3">
          <CustomPagination page={currentPage} totalPage={totalPage} onChangePage={this._goToPage} />
        </div>

        <ModalForm
          isOpen={openEditModal}
          formData={this._getProjectSchema(selectedProjectName)}
          onToggle={() => this._closeEditModal()}
          onSubmit={this._handleSubmitEditProject}
        />
      </div>
    );
  }
}

export default withRouter(ProjectList);
