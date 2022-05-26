import PropTypes from 'prop-types';
import React from 'react';
import { useHistory } from 'react-router-dom';
import workService from '../../../../services/workService';

export default function ProjectLink({ id, name }) {
  const history = useHistory();
  const _goToWorkPage = (e) => {
    e.preventDefault();
    workService
      .listAsync(id, 1, 1)
      .then((data) => {
        if (data.items.length > 0) {
          history.push(`/project/${id}/work/${data.items[0].id}`);
        } else {
          alert('Not found work item.', { title: 'Record not found', error: true });
        }
      })
      .catch(() => {
        alert('Network or Api error.', { error: true });
      });
  };
  return (
    <>
      <a className="project-link d-flex align-items-center small" onClick={_goToWorkPage} href="#projectLink">
        <div className="thumb">{name[0].toUpperCase()}</div>
        <div className="pl-2 project-name">{name}</div>
      </a>
    </>
  );
}

ProjectLink.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
};
