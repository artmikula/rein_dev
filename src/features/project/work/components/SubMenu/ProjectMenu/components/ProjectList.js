/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useHistory } from 'react-router-dom';
import { Button } from 'reactstrap';
import { CustomList } from 'features/shared/components';
import projectService from 'features/project/services/projectService';
import Language from 'features/shared/languages/Language';
import toLocalTime from 'features/shared/lib/utils';

function ProjectList(props) {
  const { data, sort, pagingOptions, onChangePage, onSort, onEdit, onDelete } = props;

  const [projects, setProjects] = useState([]);

  React.useEffect(() => {
    if (data) {
      setProjects(data.slice());
    }
  }, [data]);

  React.useEffect(() => {
    if (projects.length > 0) {
      projects.forEach((project) => {
        // eslint-disable-next-line no-param-reassign
        project.isExpand = false;
      });
    }
    console.log('projects', projects);
  }, [projects]);

  const _goToWorkPage = async (projectId) => {
    const history = useHistory();
    const project = await projectService.listAsync(projectId, 1, 1);

    if (project.items.length > 0) {
      history.push(`/project/${projectId}/work/${project.items[0].id}`);
    }
  };

  const _toggleExpandButton = (idSelected) => {
    if (idSelected) {
      const indexSelected = projects.findIndex(({ id }) => id === idSelected);
      const projectsTemp = projects.slice();
      console.log('indexSelected', indexSelected);
      if (indexSelected > -1) {
        console.log('before', projectsTemp[indexSelected]);
        projectsTemp[indexSelected].isExpand = !projects[indexSelected].isExpand;
        console.log('after', projectsTemp[indexSelected]);
        setProjects(projectsTemp);
      }
    }
  };

  const _renderExpandButton = React.useCallback(
    (project) => {
      const { id } = project;
      const iconName = project.isExpand ? 'bi-dash-lg' : 'bi-plus-lg';
      console.log('render', project);

      return (
        <Button color="transparent" className="expand-btn" onClick={() => _toggleExpandButton(id)}>
          <i className={`bi ${iconName} expand-icon`} />
        </Button>
      );
    },
    [projects]
  );

  // const _renderWorkRow = () => {
  //   if (projectSelected?.works?.length > 0) {
  //     return projectSelected.works.map((work) => (
  //       <tr key={work.id}>
  //         <td>Work</td>
  //         <td />
  //         <td>
  //           <Link to={`/project/${projectSelected?.id}/work/${work.id}`}>{work.name}</Link>
  //         </td>
  //         <td>{toLocalTime(work.createdDate)}</td>
  //         <td>{toLocalTime(work.lastModifiedDate)}</td>
  //       </tr>
  //     ));
  //   }
  //   return null;
  // };

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
    <CustomList
      columns={columns}
      pagingOptions={{ ...pagingOptions, onChangePage }}
      sort={sort}
      data={projects}
      onSort={onSort}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {/* {_renderWorkRow()} */}
    </CustomList>
  );
}

ProjectList.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  sort: PropTypes.oneOfType([PropTypes.object]),
  pagingOptions: PropTypes.shape({
    page: PropTypes.number.isRequired,
    totalPage: PropTypes.number.isRequired,
  }),
  onChangePage: PropTypes.func,
  onSort: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

ProjectList.defaultProps = {
  sort: {},
  pagingOptions: {},
  onChangePage: undefined,
  onSort: undefined,
  onEdit: undefined,
  onDelete: undefined,
};

export default ProjectList;
