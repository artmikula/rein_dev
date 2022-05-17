import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Table } from 'reactstrap';
import projectService from 'features/project/services/projectService';
import { ModalForm } from 'features/shared/components';
import Actions from 'features/shared/components/Actions/Actions';
import { SORT_DIRECTION, SORT_DEFAULT } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import CustomPagination from '../CustomPagination';

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

function ProjectList(props) {
  const { columns, data, pagingOptions, sort, onSort, reloadData } = props;

  const [state, setState] = useState({ openEditModal: false, selectedId: 0 });
  const { selectedId, selectedProjectName, openEditModal } = state;

  const confirmDelete = async (id) => {
    await projectService.deleteAsync(id);

    reloadData();
  };

  const deleteProject = (id) => {
    window.confirm(undefined, { yesAction: () => confirmDelete(id) });
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
      reloadData();
    }
  };

  const closeEditModal = () => setState({ ...state, openEditModal: false });

  const handleSort = (item) => {
    if (!item.sortable) {
      return;
    }

    const sortObject = { ...SORT_DEFAULT };

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

  // eslint-disable-next-line react/no-multi-comp
  const _onRenderActionButton = (item, index) => {
    const { id, name } = item;
    return (
      <Actions
        actions={[
          {
            icon: <i className="bi bi-trash-fill text-danger" />,
            title: Language.get('delete'),
            action: () => deleteProject(id),
          },
          {
            icon: <i className="bi bi-pencil text-success" />,
            title: Language.get('rename'),
            action: () => editProject(id, name),
          },
        ]}
        index={index}
      />
    );
  };

  const _onRenderRow = (column, item, index) => {
    const { key } = column;
    if (!item) {
      return null;
    }
    if (key === 'action') {
      return _onRenderActionButton(item, index);
    }
    return item[key] || '';
  };

  return (
    <div>
      <Card className="mt-1 box-shadow">
        <Table>
          <thead>
            <tr>
              {columns.map((column, i) => (
                <th key={i} className={column.sortable ? 'sortable' : undefined} onClick={() => handleSort(column)}>
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
                  {columns.map((column) => (
                    <td key={column.key} className="align-middle">
                      {column?.onRender ? column.onRender(project, index) : _onRenderRow(column, project, index)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {Boolean(pagingOptions) && (
        <div className="d-flex justify-content-end mt-3">
          <CustomPagination {...pagingOptions} />
        </div>
      )}

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
  columns: PropTypes.oneOfType([PropTypes.array]).isRequired,
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  sort: PropTypes.shape({
    column: PropTypes.string,
    direction: PropTypes.oneOf(Object.values(SORT_DIRECTION)),
  }),
  pagingOptions: PropTypes.shape({
    page: PropTypes.number,
    totalPage: PropTypes.number,
    onChangePage: PropTypes.func,
  }),
  onSort: PropTypes.func,
  reloadData: PropTypes.func,
};

ProjectList.defaultProps = {
  sort: {},
  pagingOptions: undefined,
  onSort: undefined,
  reloadData: undefined,
};

export default ProjectList;
