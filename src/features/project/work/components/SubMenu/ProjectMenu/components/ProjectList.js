/* eslint-disable no-param-reassign */
/* eslint-disable react/no-multi-comp */
/* eslint-disable max-lines */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { Card, Table, Button } from 'reactstrap';
import projectService from 'features/project/services/projectService';
import workService from 'features/project/work/services/workService';
import restService from 'features/shared/services/restService';
import restServiceHelper from 'features/shared/lib/restServiceHelper';
import Language from 'features/shared/languages/Language';
import toLocalTime from 'features/shared/lib/utils';
import { ModalForm, CustomPagination } from 'features/shared/components';
import Actions from 'features/shared/components/Actions/Actions';
import { SORT_DIRECTION, SORT_DEFAULT } from 'features/shared/constants';
import WorkList from './WorkList';

const getProjectSchema = (selectedItem, formTitle) => {
  const { project, work } = selectedItem;
  return {
    formTitle: Language.get(formTitle),
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
        initialValue: work.name !== '' ? work.name : project.name,
        fieldError: false,
        helperText: '',
      },
    ],
  };
};

function ProjectList(props) {
  const { data, sort, pagingOptions, onSort, reload } = props;

  const prevProjects = React.useRef();
  const history = useHistory();

  const [projects, setProjects] = useState([]);
  const [formTitle, setFormTitle] = useState('');
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState({
    project: {
      id: '',
      name: '',
    },
    work: {
      id: '',
      name: '',
    },
  });

  useEffect(() => {
    const cloneData = data.slice();
    cloneData.forEach((item) => {
      if (prevProjects?.current?.length > 0) {
        const isExists = prevProjects.current.find((project) => project.id === item.id);
        if (isExists) {
          item.ixExpand = isExists.isExpand;
        } else {
          item.isExpand = false;
        }
      } else {
        item.isExpand = false;
      }
    });
    setProjects(cloneData);
  }, [data]);

  useEffect(() => {
    prevProjects.current = projects;
  }, [projects]);

  const _goToWorkPage = async (projectId) => {
    const response = await workService.listAsync(projectId, 1, 1);

    if (response?.items?.length > 0) {
      history.push(`/project/${projectId}/work/${response.items[0].id}`);
    }
  };

  const _toggleExpandButton = (idSelected) => {
    if (idSelected) {
      const indexSelected = projects.findIndex(({ id }) => id === idSelected);
      const projectsTemp = projects.slice();
      if (indexSelected > -1) {
        projectsTemp[indexSelected].isExpand = !projects[indexSelected]?.isExpand;
        setProjects(projectsTemp);
      }
    }
  };

  const _renderExpandButton = React.useCallback(
    (project) => {
      const { id } = project;
      const iconName = project?.isExpand ? 'bi-dash-lg' : 'bi-plus-lg';

      return (
        <Button color="transparent" className="expand-btn" onClick={() => _toggleExpandButton(id)}>
          <i className={`bi ${iconName} expand-icon`} />
        </Button>
      );
    },
    [projects]
  );

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

  const _getSelectedItem = (projectId, projectName, workId = '', workName = '') => {
    const { project } = selectedItem;
    if (projectId !== project.id) {
      setSelectedItem({
        project: { id: projectId, name: projectName },
        work: { id: workId, name: workName },
      });
    } else {
      setSelectedItem({ ...selectedItem, work: { id: workId, name: workName } });
    }
  };

  const _onDeleteProject = async (projectId) => {
    try {
      const response = await restService.deleteAsync(`/project/${projectId}`);
      if (response) {
        const { status } = response;
        if (status >= 200 && status < 300) {
          const selectedIndex = projects.findIndex((project) => project.id === projectId);
          const projectsTemp = projects.slice();
          if (selectedIndex > -1) {
            projectsTemp.splice(selectedIndex, 1);
            setProjects(projectsTemp);
          }
        }
      }
    } catch (error) {
      restServiceHelper.handleError(error);
    }
  };

  const _confirmDeleteProject = (project) => {
    _getSelectedItem(project.id, project.name);
    window.confirm(undefined, { yesAction: () => _onDeleteProject(project.id) });
  };

  const _onOpenModal = (project, work = undefined) => {
    setOpenEditModal(true);
    _getSelectedItem(project.id, project.name, work?.id, work?.name);
    if (!work) {
      setFormTitle('renameproject');
    } else {
      setFormTitle('renamework');
    }
  };

  const _onEdit = async (formValues, { setErrors, setSubmitting }) => {
    const { project, work } = selectedItem;
    let response;
    if (work.id !== '' && work.name !== '') {
      response = await workService.updateAsync(project.id, work.id, formValues);
    } else {
      response = await projectService.updateAsync(project.id, formValues);
    }

    setSubmitting(false);
    if (response.error) {
      const { Name } = response.error.response.data;
      if (Name) {
        const errorMessage = Name.join(' ');
        setErrors({
          _summary_: errorMessage,
        });
      }
    } else {
      setOpenEditModal(false);
      setSelectedItem({ ...selectedItem, work: { id: '', work: '' } });
      reload();
    }
  };

  const _onCloseModal = () => {
    setOpenEditModal(false);
    _getSelectedItem('', '');
  };

  const columns = [
    {
      headerName: '',
      key: 'expand',
      sortable: false,
      onRender: (item) => _renderExpandButton(item),
    },
    {
      headerName: Language.get('projectname'),
      key: 'name',
      sortable: true,
      // eslint-disable-next-line react/prop-types
      onRender: ({ id, name }) => (
        <Button color="link" style={{ border: 'none' }} onClick={() => _goToWorkPage(id)}>
          {name}
        </Button>
      ),
    },
    {
      headerName: Language.get('createddate'),
      key: 'createdDate',
      onRender: ({ createdDate }) => toLocalTime(createdDate) || null,
      sortable: true,
    },
    {
      headerName: Language.get('lastmodifieddate'),
      key: 'lastModifiedDate',
      onRender: ({ lastModifiedDate }) => toLocalTime(lastModifiedDate) || null,
      sortable: true,
    },
    {
      headerName: '',
      key: 'action',
      onRender: (item, index) => (
        <Actions
          actions={[
            {
              icon: <i className="bi bi-trash-fill text-danger" />,
              title: Language.get('delete'),
              action: () => _confirmDeleteProject(item),
            },
            {
              icon: <i className="bi bi-pencil text-success" />,
              title: Language.get('rename'),
              action: () => _onOpenModal(item),
            },
          ]}
          index={index}
        />
      ),
    },
  ];

  return (
    <div>
      <Card className="mt-1 box-shadow card-container">
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
            {projects.map((project, index) => (
              <React.Fragment key={project.id}>
                <tr>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`align-middle project-cell ${project.isExpand ? 'is-expand' : undefined}`}
                    >
                      {column.onRender(project, index)}
                    </td>
                  ))}
                </tr>
                {project?.isExpand && (
                  <WorkList project={project} openModal={_onOpenModal} getSelectedItem={_getSelectedItem} />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="d-flex justify-content-end mt-3">
        <CustomPagination {...pagingOptions} />
      </div>

      <ModalForm
        isOpen={openEditModal}
        formData={getProjectSchema(selectedItem, formTitle)}
        onToggle={_onCloseModal}
        onSubmit={(values, { setErrors, setSubmitting }) => _onEdit(values, { setErrors, setSubmitting })}
      />
    </div>
  );
}

ProjectList.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  sort: PropTypes.oneOfType([PropTypes.object]),
  pagingOptions: PropTypes.shape({
    page: PropTypes.number.isRequired,
    totalPage: PropTypes.number.isRequired,
    onChangePage: PropTypes.func,
  }),
  onSort: PropTypes.func,
  reload: PropTypes.func,
};

ProjectList.defaultProps = {
  sort: {},
  pagingOptions: {},
  onSort: undefined,
  reload: undefined,
};

export default ProjectList;
