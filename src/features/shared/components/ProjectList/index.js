import projectService from 'features/project/services/projectService';
import workService from 'features/project/work/services/workService';
import { ModalForm } from 'features/shared/components';
import Actions from 'features/shared/components/Actions/Actions';
import { SORT_DIRECTION } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import toLocalTime from 'features/shared/lib/utils';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Button, Card, Input, InputGroup, Table } from 'reactstrap';
import CustomPagination from '../CustomPagination';

export const defaultSortObj = {
  column: 'lastmodifieddate',
  direction: SORT_DIRECTION.DESC,
};

const getProjectSchema = (name) => {
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

function ProjectList({ totalPage, page, sort, filter, data, onSort, onSearch, onChangePage, onEditName, onDelete }) {
  const history = useHistory();
  const [state, setState] = useState({ openEditModal: false, selectedId: 0 });
  const { selectedId, selectedProjectName, openEditModal } = state;

  const confirmDelete = async (id) => {
    await projectService.deleteAsync(id);

    onDelete(id);
  };

  const deleteProject = (id) => {
    confirm(undefined, { yesAction: () => confirmDelete(id) });
  };

  const editProject = (id, name) =>
    setState({ ...state, openEditModal: true, selectedId: id, selectedProjectName: name });

  const handleSubmitEditProject = async (values, { setErrors, setSubmitting }) => {
    const result = await projectService.updateAsync(selectedId, values);

    setSubmitting(false);
    if (result.error) {
      const { Name } = result.error.response.data;
      const errorMessage = Name.join(' ');
      setErrors({
        _summary_: errorMessage,
      });
    } else {
      setState({ ...state, openEditModal: false });
      onEditName(selectedId);
    }
  };

  const closeEditModal = () => setState({ ...state, openEditModal: false });

  const goToWorkPage = async (projectId) => {
    const data = await workService.listAsync(projectId, 1, 1);

    if (data.items.length > 0) {
      history.push(`/project/${projectId}/work/${data.items[0].id}`);
    }
  };

  const handleClickSearch = async () => {
    const filter = document.getElementById('search-project-box').value;

    onSearch(filter);
  };

  const handlePressEnter = (e) => {
    if (e.which === 13) {
      handleClickSearch();
    }
  };

  const handleSort = (item) => {
    if (!item.sortable) {
      return;
    }

    const sortObject = { ...defaultSortObj };

    if (item.key === sort.column) {
      sortObject.column = item.key;
      sortObject.direction = sort.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;
    } else {
      sortObject.column = item.key;
      sortObject.direction = SORT_DIRECTION.ASC;
    }

    onSort(sortObject);
  };

  const getSortIcon = (item, sort) => {
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

  const columns = [
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

  return (
    <div>
      <div className="d-flex justify-content-end">
        <InputGroup style={{ width: '100%', maxWidth: '350px', margin: '10px' }}>
          <Input
            id="search-project-box"
            defaultValue={filter}
            placeholder={Language.get('projectsearchplaceholder')}
            onKeyPress={handlePressEnter}
          />
          <Button style={{ height: '36.39px', marginLeft: '8px' }} color="primary" onClick={handleClickSearch}>
            <i className="bi bi-search" />
          </Button>
        </InputGroup>
      </div>
      <Card className="mt-1 box-shadow">
        <Table>
          <thead>
            <tr>
              {columns.map((column, i) => (
                <th key={i} className={column.sortable && 'sortable'} onClick={() => handleSort(column)}>
                  {column.headerName}
                  {getSortIcon(column, sort)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((project, index) => {
              return (
                <tr key={project.id}>
                  {columns.map((column) => {
                    const value = project[column.key];
                    if (column.key !== 'action') {
                      if (column.key === 'name') {
                        return (
                          <td className="align-middle text-primary" key={column.key}>
                            <Link onClick={() => goToWorkPage(project.id)} to="#">
                              {value}
                            </Link>
                          </td>
                        );
                      }
                      return (
                        <td className="align-middle" key={column.key}>
                          {column.format ? column.format(value) : value}
                        </td>
                      );
                    }
                    return (
                      <td className="align-middle" title="Actions" key={column.key}>
                        <Actions
                          actions={[
                            {
                              icon: <i className="bi bi-trash-fill text-danger" />,
                              title: Language.get('delete'),
                              action: () => deleteProject(project.id),
                            },
                            {
                              icon: <i className="bi bi-pencil text-success" />,
                              title: Language.get('rename'),
                              action: () => editProject(project.id, project.name),
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
        <CustomPagination page={page} totalPage={totalPage} onChangePage={onChangePage} />
      </div>

      <ModalForm
        isOpen={openEditModal}
        formData={getProjectSchema(selectedProjectName)}
        onToggle={closeEditModal}
        onSubmit={handleSubmitEditProject}
      />
    </div>
  );
}

ProjectList.propTypes = {
  totalPage: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  sort: PropTypes.shape({
    column: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(Object.values(SORT_DIRECTION)).isRequired,
  }).isRequired,
  filter: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSort: PropTypes.func,
  onSearch: PropTypes.func,
  onChangePage: PropTypes.func,
  onEditName: PropTypes.func,
  onDelete: PropTypes.func,
};

ProjectList.defaultProps = {
  onSort: () => {},
  onSearch: () => {},
  onChangePage: () => {},
  onEditName: () => {},
  onDelete: () => {},
};

export default ProjectList;
