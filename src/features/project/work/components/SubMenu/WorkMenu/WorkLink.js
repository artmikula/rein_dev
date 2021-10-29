import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import './style.scss';

export default function WorkLink({ projectId, id, name }) {
  return (
    <Link to={`/project/${projectId}/work/${id}`} className="work-link d-flex align-items-center small">
      <div className="thumb">{name[0].toUpperCase()}</div>
      <div className="pl-2 work-name">{name}</div>
    </Link>
  );
}

WorkLink.propTypes = {
  id: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  name: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
};
