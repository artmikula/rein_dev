import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import './style.scss';

const { REACT_APP_RE_IN_CLOUD_URL } = process.env;

export default function ReInLinkButton() {
  const match = useRouteMatch();
  const { workId } = match.params;
  const cloudUrl = REACT_APP_RE_IN_CLOUD_URL ?? 'https://dev.userinsight.co.kr/rein-cloud';
  const url = workId ? `${cloudUrl}/project/work/${workId}` : `${cloudUrl}/dashboard`;

  return (
    <div className="dropdown mr-1 rein-button">
      <a target="_self" href={url} className="rein-link">
        <img src="/img/rein_icon.ico" alt="rein" className="rein-icon" />
        Re:In
      </a>
    </div>
  );
}
