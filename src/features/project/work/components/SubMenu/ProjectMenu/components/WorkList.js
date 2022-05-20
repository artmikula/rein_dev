/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';
import Language from 'features/shared/languages/Language';
import toLocalTime from 'features/shared/lib/utils';
import Actions from 'features/shared/components/Actions/Actions';
import workService from 'features/project/work/services/workService';

function WorkList(props) {
  const { project, reload, openModal, getSelectedItem } = props;

  const _onDelete = async (projectId, workId) => {
    await workService.deleteAsync(projectId, workId);
    reload();
  };

  const _confirmDeleteProject = (project, work) => {
    if (typeof getSelectedItem === 'function') {
      getSelectedItem(project.id, project.name, work.id, work.name);
    }
    window.confirm(undefined, { yesAction: () => _onDelete(project.id, work.id) });
  };

  const workColumns = (projectId) => [
    {
      headerName: '',
      key: 'expand',
      onRender: () => null,
    },
    {
      headerName: Language.get('workname'),
      key: 'name',
      sortable: true,
      // eslint-disable-next-line react/prop-types
      onRender: ({ id, name }) => (
        <Container className="ml-2">
          <Link to={`/project/${projectId}/work/${id}`}>{name}</Link>
        </Container>
      ),
    },
    {
      headerName: '',
      key: 'createdDate',
      onRender: ({ createdDate }) => toLocalTime(createdDate) || null,
      sortable: true,
    },
    {
      headerName: '',
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
              action: () => _confirmDeleteProject(project, item),
            },
            {
              icon: <i className="bi bi-pencil text-success" />,
              title: Language.get('rename'),
              action: () => openModal(project, item),
            },
          ]}
          index={index}
        />
      ),
    },
  ];

  return (
    <>
      <tr>
        {workColumns(project.id).map((workColumn, index) => (
          <td className="work-cell work-row project-cell" key={`${workColumn.key} - ${index}`}>
            <Container className="ml-2 py-2">{workColumn.headerName}</Container>
          </td>
        ))}
      </tr>
      {project.works.map((work, workIndex) => (
        <tr key={work.id}>
          {workColumns(project.id).map((workColumn) => (
            <td key={workColumn.key} className="align-middle work-cell">
              {workColumn.onRender(work, workIndex)}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

WorkList.propTypes = {
  project: PropTypes.oneOfType([PropTypes.object]).isRequired,
  openModal: PropTypes.func.isRequired,
  getSelectedItem: PropTypes.func.isRequired,
  reload: PropTypes.func,
};

WorkList.defaultProps = {
  reload: undefined,
};

export default WorkList;
