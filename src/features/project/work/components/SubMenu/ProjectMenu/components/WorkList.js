/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';
import Language from 'features/shared/languages/Language';
import toLocalTime from 'features/shared/lib/utils';
import Actions from 'features/shared/components/Actions/Actions';
import restService from 'features/shared/services/restService';
import restServiceHelper from 'features/shared/lib/restServiceHelper';

function WorkList(props) {
  const { project, openModal, getSelectedItem } = props;

  const [works, setWorks] = React.useState([]);

  React.useEffect(() => {
    if (project?.works?.length > 0) {
      setWorks(project.works);
    }
  }, [project]);

  const _onDelete = async (projectId, workId) => {
    try {
      const response = await restService.deleteAsync(`/project/${projectId}/work/${workId}`);
      if (response) {
        const { status } = response;
        if (status >= 200 && status < 300) {
          const selectedIndex = works.findIndex((work) => work.id === workId);
          const worksTemp = works.slice();
          if (selectedIndex > -1) {
            worksTemp.splice(selectedIndex, 1);
            setWorks(worksTemp);
          }
        }
      }
    } catch (error) {
      restServiceHelper.handleError(error);
    }
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

  return works.map((work, index) => (
    <tr key={work.id} className={`${index === works.length - 1 ? 'last-cell' : undefined}`}>
      {workColumns(project.id).map((workColumn, columnIndex) => (
        <td key={workColumn.key} className={`align-middle work-cell ${columnIndex !== 0 ? 'work-row' : undefined}`}>
          {workColumn.onRender(work, index)}
        </td>
      ))}
    </tr>
  ));
}

WorkList.propTypes = {
  project: PropTypes.oneOfType([PropTypes.object]).isRequired,
  openModal: PropTypes.func.isRequired,
  getSelectedItem: PropTypes.func.isRequired,
};

export default WorkList;
