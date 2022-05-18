import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Table } from 'reactstrap';
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

function CustomList(props) {
  const { columns, data, pagingOptions, sort, onSort, onEdit, onDelete, formSchema, children } = props;

  const [state, setState] = useState({ openEditModal: false, selectedId: 0 });
  const { selectedId, selectedProjectName, openEditModal } = state;

  const _getFormSchema =
    typeof formSchema === 'function' ? formSchema(selectedProjectName) : getProjectSchema(selectedProjectName);

  const _onDelete = (id) => {
    window.confirm(undefined, { yesAction: () => typeof onDelete === 'function' && onDelete(id) });
  };

  const _onOpenModal = (id, name) =>
    setState({ ...state, openEditModal: true, selectedId: id, selectedProjectName: name });

  const _onSubmitEdit = (values, { setErrors, setSubmitting }) => {
    const result = onEdit(selectedId, values, { setErrors, setSubmitting });
    if (result) {
      setState({ ...state, openEditModal: false });
    }
  };

  const _onCloseModal = () => setState({ ...state, openEditModal: false });

  const _onSort = (item) => {
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
            action: () => _onDelete(id),
          },
          {
            icon: <i className="bi bi-pencil text-success" />,
            title: Language.get('rename'),
            action: () => _onOpenModal(id, name),
          },
        ]}
        index={index}
      />
    );
  };

  const _onRenderRow = (column, item, index) => {
    const { key, format } = column;
    const dateFormat = typeof format === 'function' ? format(item[key]) : '';
    if (!item) {
      return null;
    }
    if (key === 'action') {
      return _onRenderActionButton(item, index);
    }
    return dateFormat || item[key];
  };

  return (
    <div>
      <Card className="mt-1 box-shadow">
        <Table>
          <thead>
            <tr>
              {columns.map((column, i) => (
                <th key={i} className={column.sortable ? 'sortable' : undefined} onClick={() => _onSort(column)}>
                  {column.headerName}
                  {getSortIcon(column, sort)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((project, index) => (
              <React.Fragment key={project.id}>
                <tr>
                  {columns.map((column) => (
                    <td key={column.key} className="align-middle">
                      {column?.onRender ? column.onRender(project, index) : _onRenderRow(column, project, index)}
                    </td>
                  ))}
                </tr>
                {children}
              </React.Fragment>
            ))}
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
        formData={_getFormSchema}
        onToggle={_onCloseModal}
        onSubmit={(values, { setErrors, setSubmitting }) => _onSubmitEdit(values, { setErrors, setSubmitting })}
      />
    </div>
  );
}

CustomList.propTypes = {
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
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  formSchema: PropTypes.func,
  children: PropTypes.node,
};

CustomList.defaultProps = {
  sort: {},
  pagingOptions: undefined,
  onSort: undefined,
  onEdit: undefined,
  onDelete: undefined,
  formSchema: undefined,
  children: undefined,
};

export default CustomList;
