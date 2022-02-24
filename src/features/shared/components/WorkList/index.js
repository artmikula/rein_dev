import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link, Router, withRouter } from 'react-router-dom';
import { Button, Card, Input, InputGroup, Table } from 'reactstrap';
import { ModalForm } from '..';
import workService from '../../../project/work/services/workService';
import Language from '../../languages/Language';
import toLocalTime from '../../lib/utils';
import Actions from '../Actions/Actions';
import CustomPagination from '../CustomPagination';

class WorkList extends Component {
  columns = [
    {
      headerName: Language.get('work'),
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
      works: [],
      totalPage: 1,
      openEditModal: false,
      selectedId: 0,
      currentPage: 1,
      searchText: '',
    };
  }

  async componentDidMount() {
    const { currentPage } = this.state;
    this._getWorkList(currentPage);
  }

  _confirmDelete = async () => {
    const { projectId } = this.props;
    const { selectedId, currentPage } = this.state;

    await workService.deleteAsync(projectId, selectedId);
    await this._getWorkList(currentPage);
  };

  _getWorkList = async (page) => {
    const { projectId } = this.props;
    const { searchText } = this.state;

    const data = await workService.listAsync(projectId, page, 5, searchText);
    const totalPage = parseInt((data.totalRow - 1) / data.pageSize + 1, 10);
    let _page = page;

    if (_page > totalPage) {
      _page = totalPage;
    }

    this.setState({
      works: data.items,
      totalPage,
      currentPage: page,
    });
  };

  _deleteWork = (id) => {
    confirm(undefined, { yesAction: this._confirmDelete });
    this.setState({ selectedId: id });
  };

  _editWork = (id, name) => {
    this.setState({
      openEditModal: true,
      selectedId: id,
      selectedWorkName: name,
    });
  };

  _handleSubmit = async (values, { setErrors, setSubmitting }) => {
    const { projectId } = this.props;
    const { selectedId, currentPage } = this.state;

    const result = await workService.updateAsync(projectId, selectedId, values);
    setSubmitting(false);
    if (result.error) {
      const { Name } = result.error;
      const errorMessage = Name.join(' ');
      setErrors({
        _summary_: errorMessage,
      });
    } else {
      this._getWorkList(currentPage);
      this._closeEditModal();
    }
  };

  _closeEditModal = () => {
    this.setState({
      openEditModal: false,
    });
  };

  _goToPage = (page) => {
    this.setState({
      currentPage: page,
    });

    this._getWorkList(page);
  };

  _getWorkSchema = (name) => {
    return {
      formTitle: Language.get('renamework'),
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

  handleChangeSearchText = (e) => this.setState({ searchText: e.target.value });

  handleClickSearch = async () => this._getWorkList(1);

  handlePressEnter = (e) => {
    if (e.which === 13) {
      this.handleClickSearch();
    }
  };

  render() {
    const { works, totalPage, openEditModal, selectedWorkName, currentPage } = this.state;
    const { projectId, history } = this.props;
    return (
      <div>
        <div className="d-flex justify-content-end">
          <InputGroup style={{ width: '100%', maxWidth: '350px', margin: '10px' }}>
            <Input
              placeholder={Language.get('worksearchplaceholder')}
              onChange={this.handleChangeSearchText}
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
                  <th key={i}>{column.headerName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {works.map((work, index) => {
                return (
                  <tr key={index}>
                    {this.columns.map((column, i) => {
                      const value = work[column.key];
                      if (column.key !== 'action') {
                        if (column.key === 'name') {
                          return (
                            <td className="align-middle text-primary" key={i}>
                              <Router history={history}>
                                <Link to={`/project/${projectId}/work/${work.id}`}>{value}</Link>
                              </Router>
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
                                action: () => this._deleteWork(work.id),
                              },
                              {
                                icon: <i className="bi bi-pencil text-success" />,
                                title: Language.get('rename'),
                                action: () => this._editWork(work.id, work.name),
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
          formData={this._getWorkSchema(selectedWorkName)}
          onToggle={() => this._closeEditModal()}
          onSubmit={this._handleSubmit}
        />
      </div>
    );
  }
}

WorkList.propTypes = {
  projectId: PropTypes.string.isRequired,
};

export default withRouter(WorkList);
