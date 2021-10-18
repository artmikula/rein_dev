import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { CLASSIFY } from '../../../../../shared/constants';
import IconButton from './components/IconButton';

export default function CauseEffectRow({ rows, onDelete, onMerge, onOpenMerging, mergeItem }) {
  const [collapseId, setCollapseId] = useState({});

  const _handleCollapseRow = (e, id) => {
    e.preventDefault();
    setCollapseId((state) => ({ ...state, [id]: !state[id] }));
  };

  const _canMergeCause = rows.filter((x) => x.type === CLASSIFY.CAUSE && !x.isMerge).length > 1;

  const _canMergeEffect = rows.filter((x) => x.type === CLASSIFY.EFFECT && !x.isMerge).length > 1;

  return rows.map((row) => {
    const rowId = row.node;
    const rowIdClassName = row.type === CLASSIFY.CAUSE ? 'cause-id' : 'effect-id';
    const canMerge = row.type === CLASSIFY.CAUSE ? _canMergeCause : _canMergeEffect;

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
            {!mergeItem && (
              <IconButton
                id={`delete${rowId}`}
                tooltip={`Delete ${row.node}`}
                onClick={() => onDelete(row)}
                iconClassName="bi bi-trash delete-icon"
              />
            )}

            {!mergeItem && canMerge && (
              <IconButton
                id={`merge${rowId}`}
                tooltip={`Abridge ${row.node}`}
                onClick={() => onOpenMerging(row)}
                iconClassName=" bi bi-subtract merge-icon"
              />
            )}

            {mergeItem && row.type === mergeItem.type && row.node !== mergeItem.node && (
              <IconButton
                id={`check${rowId}`}
                tooltip={`Abridge ${mergeItem.node} to ${row.node}`}
                onClick={() => onMerge(row)}
                iconClassName="bi bi-clipboard-check check-icon"
              />
            )}
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
      </React.Fragment>
    );
  });
}
CauseEffectRow.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
};
