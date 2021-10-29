import Download from 'downloadjs';
import { SearchComponent, SubMenu } from 'features/shared/components';
import Language from 'features/shared/languages/Language';
import debounce from 'lodash.debounce';
import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Router, useHistory, useParams } from 'react-router';
import GlobalContext from '../../../../../../security/GlobalContext';
import CreateForm from '../../../../components/CreateForm';
import ImportForm from '../../../../components/ImportForm';
import projectService from '../../../../services/projectService';
import WorkList from '../../../WorkList';
import ProjectLink from './ProjectLink';

export default function ProjectMenu() {
  const [recentProjects, setRecentProjects] = useState([]);
  const [searchProjects, setSearchProjects] = useState([]);
  const [createFormOpen, toggleCreateForm] = useState(false);
  const [importFormOpen, toggleImportForm] = useState(false);
  const projectName = useSelector((state) => state.work.projectName);

  const history = useHistory();

  const context = useContext(GlobalContext);

  const params = useParams();
  const { projectId } = params;

  const _confirmDelete = () => {
    projectService.deleteAsync(projectId).then(() => {
      history.push('/projects');
    });
  };

  const actions = [
    {
      key: 1,
      text: Language.get('new'),
      action: () => {
        toggleCreateForm(true);
      },
    },
    {
      key: 2,
      text: Language.get('import'),
      action: () => {
        toggleImportForm(true);
      },
    },
    {
      key: 3,
      text: Language.get('export'),
      action: async () => {
        const { getToken } = context;
        const token = getToken();
        const response = await projectService.exportAsync(token, projectId);
        if (response.data) {
          const fileContentString = atob(response.data.body);
          Download(fileContentString, response.data.headers.fileDownloadName[0], response.data.headers.contentType[0]);
        }
      },
    },
    {
      key: 4,
      text: Language.get('delete'),
      action: () => {
        confirm(undefined, { yesAction: _confirmDelete });
      },
    },
    {
      key: 5,
      text: Language.get('explorer'),
      action: () => {
        const modaProps = {
          title: `Project: ${projectName}`,
          content: (
            <Router history={history}>
              <WorkList projectId={projectId} />
            </Router>
          ),
          actions: null,
        };
        window.modal(modaProps);
      },
    },
  ];

  const _searchProjects = (searchValue) => {
    projectService.listAsync(1, 10, searchValue).then((response) => {
      setSearchProjects(response.items);
    });
  };

  const _handleSearch = debounce((searchValue) => {
    _searchProjects(searchValue);
  }, 300);

  const _getRecentProjects = () => {
    projectService.listAsync(1, 5).then((response) => {
      setRecentProjects(response.items);
    });
  };

  useEffect(() => {
    _getRecentProjects();
  }, []);

  return (
    <>
      <SubMenu
        actions={actions}
        content={
          <SearchComponent
            ItemComponent={ProjectLink}
            recentTitle={Language.get('recentprojects')}
            recentData={recentProjects}
            searchData={searchProjects}
            onSearch={_handleSearch}
            renderItem={(item) => <ProjectLink {...item} />}
            getItemKey={(item) => item.id}
          />
        }
      />
      <CreateForm
        isOpenModel={createFormOpen}
        onToggleModal={() => toggleCreateForm(false)}
        onSuccess={() => toggleCreateForm(false)}
      />
      <ImportForm isOpenModel={importFormOpen} onToggleModal={() => toggleImportForm(false)} />
    </>
  );
}
