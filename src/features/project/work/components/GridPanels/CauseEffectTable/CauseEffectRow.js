import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';
import { CLASSIFY } from '../../../../../shared/constants';

export default function CauseEffectRow(props) {
  const { rows } = props;
  const [collapseId, setCollapseId] = useState({});

  const _handleCollapseRow = (e, id) => {
    e.preventDefault();
    setCollapseId((state) => ({ ...state, [id]: !state[id] }));
  };
  return rows.map((row) => {
    const rowId = row.node;
    const rowIdClassName = row.type === CLASSIFY.CAUSE ? 'cause-id' : 'effect-id';
    return (
      <React.Fragment key={rowId}>
        <tr key={rowId + rowIdClassName}>
          <th className="cause-effect-wrapper" scope="row">
            <div className="cause-effect-cell">
              {row.mergedChildren.length > 0 && (
                <a href="#toggler" onClick={(e) => _handleCollapseRow(e, rowId)}>
                  {collapseId[rowId] ? (
                    <i className="bi bi-chevron-contract mr-2" />
                  ) : (
                    <i className="bi bi-chevron-expand mr-2" />
                  )}
                </a>
              )}
              <span className={rowIdClassName}>{row.node}</span>
            </div>
          </th>
          <td>{row.definition}</td>
          <td>
            {row.mergedNodes.join(', ')}
            <button
              className="border-0 outline-0 float-right bg-transparent"
              type="button"
              onClick={() => props.onDelete(row)}
            >
              <i className="icon-btn bi bi-trash delete-icon" id={`tooltip${rowId}`} />
            </button>
          </td>
        </tr>
        {row.mergedChildren.map((mergedRow) => {
          return (
            <tr key={mergedRow.id} className={`collapse merged-row ${collapseId[rowId] ? 'show' : ''}`} id={rowId}>
              <th className="cause-effect-wrapper" scope="row">
                <div className="cause-effect-cell">
                  <span className="merged-id">{mergedRow.node}</span>
                </div>
              </th>
              <td>{mergedRow.definition}</td>
              <td />
            </tr>
          );
        })}
        <UncontrolledTooltip placement="left" target={`tooltip${rowId}`}>
          <small>Delete {row.node}</small>
        </UncontrolledTooltip>
      </React.Fragment>
    );
  });
}
CauseEffectRow.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
};
