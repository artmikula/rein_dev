import React from 'react';
import { useRouteMatch } from 'react-router-dom';

const { REACT_APP_RE_IN_CLOUD_URL } = process.env;

export default function ReInLinkButton() {
  const match = useRouteMatch();
  const { workId } = match.params;
  const cloudUrl = REACT_APP_RE_IN_CLOUD_URL ?? 'https://dev.userinsight.co.kr/rein-cloud';
  const url = workId ? `${cloudUrl}/project/work/${workId}` : `${cloudUrl}/dashboard`;

  return (
    <div className="dropdown mr-1 mt-2">
      <a
        target="_self"
        href={url}
        style={{
          color: '#fff',
          fontSize: 16,
          padding: 8,
        }}
      >
        <img
          src="/img/rein_icon.ico"
          alt="rein"
          width="20"
          height="20"
          style={{
            filter: 'brightness(0) invert(1)',
            marginTop: -4,
            marginRight: 4,
          }}
        />
        Re:In
      </a>
    </div>
  );
}
