/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import { Link, useHistory } from 'react-router-dom';
import ProjectList from 'features/shared/components/ProjectList';
import Language from 'features/shared/languages/Language';
import toLocalTime from 'features/shared/lib/utils';

function WorkExplorer(props) {
  const { item } = props;

  const _goToWorkPage = async (workId, projectId) => {
    const history = useHistory();

    if (workId && projectId) {
      history.push(`/project/${projectId}/work/${workId}`);
    }
  };

  const columnSchema = [
    {
      headerName: Language.get('workname'),
      key: 'name',
      sortable: true,
      // eslint-disable-next-line react/prop-types
      onRender: ({ id, projectId, name }) => (
        <Link onClick={() => _goToWorkPage(id, projectId)} to="#">
          {name}
        </Link>
      ),
    },
    {
      headerName: Language.get('createdDate'),
      key: 'createdDate',
      format: (value) => toLocalTime(value) || null,
      sortable: true,
    },
    {
      headerName: Language.get('lastModifiedDate'),
      key: 'lastModifiedDate',
      format: (value) => toLocalTime(value) || null,
      sortable: true,
    },
    {
      headerName: '',
      key: 'action',
    },
  ];

  if (item?.length > 0) {
    return <ProjectList columns={columnSchema} data={item} />;
  }
  return null;
}

WorkExplorer.propTypes = {
  item: PropTypes.oneOfType([PropTypes.array]),
};

WorkExplorer.defaultProps = {
  item: undefined,
};

export default WorkExplorer;
