import Language from 'features/shared/languages/Language';
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Card, Container, Pagination, PaginationItem, PaginationLink, Table } from 'reactstrap';
import { ModalForm } from '../shared/components';
import Actions from '../shared/components/Actions/Actions';
import toLocalTime from '../shared/lib/utils';
import ProjectLayout from './components/ProjectLayout';
import projectService from './services/projectService';
import workService from './work/services/workService';

class ProjectList extends Component {
  columns = [
    {
      headerName: Language.get('projectname'),
      key: 'name',
    },
    {
      headerName: Language.get('createddate'),
      key: 'createdDate',
      format: (value) => (value ? toLocalTime(value) : null),
    },
    {
      headerName: Language.get('lastmodifieddate'),
      key: 'lastModifiedDate',
      format: (value) => (value ? toLocalTime(value) : null),
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
      isRefresh: false,
    };
  }

  async componentDidMount() {
    const { location } = this.props;
    const currentPage = this._getPage(location);
    const data = await projectService.listAsync(currentPage);
    this.setState({
      projects: data.items,
      totalPage: parseInt((data.totalRow - 1) / data.pageSize + 1, 10),
    });
  }

  async componentDidUpdate(prevProps) {
    const { isRefresh } = this.state;
    const preLocation = prevProps.location;
    const { location } = this.props;
    const prevPage = this._getPage(preLocation);
    const currentPage = this._getPage(location);

    if (prevPage !== currentPage || isRefresh) {
      const data = await projectService.listAsync(currentPage);
      this._updateState({
        projects: data.items,
        totalPage: parseInt((data.totalRow - 1) / data.pageSize + 1, 10),
        isRefresh: false,
      });
    }
  }

  _updateState = (data) => {
    this.setState(data);
  };

  _getPage = (location) => {
    const query = new URLSearchParams(location.search);
    return query.get('page') && !Number.isNaN(query.get('page')) ? parseInt(query.get('page'), 10) : 1;
  };

  _confirmDelete = async () => {
    const { selectedId } = this.state;
    const { history, location } = this.props;
    const currentPage = this._getPage(location);
    await projectService.deleteAsync(selectedId);
    history.push(`/projects?page=${currentPage}`);
    this.setState({
      isRefresh: true,
    });
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
    const { history, location } = this.props;
    const currentPage = this._getPage(location);
    const result = await projectService.updateAsync(selectedId, values);
    setSubmitting(false);
    if (result.error) {
      const { Name } = result.error.response.data;
      const errorMessage = Name.join(' ');
      setErrors({
        _summary_: errorMessage,
      });
    } else {
      history.push(`/projects?page=${currentPage}`);
      this.setState({
        openEditModal: false,
        isRefresh: true,
      });
    }
  };

  _closeEditModal = () => {
    this.setState({
      openEditModal: false,
    });
  };

  _goToPage = (page) => {
    const { history } = this.props;
    history.push(`/projects?page=${page}`);
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

  render() {
    const { projects, totalPage, selectedProjectName, openEditModal } = this.state;
    const { location } = this.props;
    const currentPage = this._getPage(location);

    let minDisplayedPageNum = currentPage - 2;
    if (minDisplayedPageNum < 1) {
      minDisplayedPageNum = 1;
    }

    const displayedPageNums = [];
    let pageCount = 5;

    while (pageCount > 0 && minDisplayedPageNum <= totalPage) {
      displayedPageNums.push(minDisplayedPageNum);
      pageCount--;
      minDisplayedPageNum++;
    }

    return (
      <ProjectLayout>
        <Container>
          <Card className="mt-5 box-shadow">
            <Table>
              <thead>
                <tr>
                  {this.columns.map((column, i) => (
                    <th key={i}>{column.headerName}</th>
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
            <Pagination>
              <PaginationItem disabled={currentPage === 1}>
                <PaginationLink first onClick={() => this._goToPage(1)} />
              </PaginationItem>
              <PaginationItem disabled={currentPage === 1}>
                <PaginationLink previous onClick={() => this._goToPage(currentPage - 1)} />
              </PaginationItem>
              {displayedPageNums.map((displayedPageNum) => {
                return (
                  <PaginationItem key={displayedPageNum} active={displayedPageNum === currentPage}>
                    <PaginationLink onClick={() => this._goToPage(displayedPageNum)}>{displayedPageNum}</PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem disabled={currentPage === totalPage}>
                <PaginationLink next onClick={() => this._goToPage(currentPage + 1)} />
              </PaginationItem>
              <PaginationItem disabled={currentPage === totalPage}>
                <PaginationLink last onClick={() => this._goToPage(totalPage)} />
              </PaginationItem>
            </Pagination>
          </div>
        </Container>
        <ModalForm
          isOpen={openEditModal}
          formData={this._getProjectSchema(selectedProjectName)}
          onToggle={() => this._closeEditModal()}
          onSubmit={this._handleSubmitEditProject}
        />
      </ProjectLayout>
    );
  }
}

export default withRouter(ProjectList);
