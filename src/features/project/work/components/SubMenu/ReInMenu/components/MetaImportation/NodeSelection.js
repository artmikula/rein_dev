import React from 'react';
import PropTypes from 'prop-types';
import Language from 'features/shared/languages/Language';
import { Button } from 'reactstrap';
import NodeItem from './NodeItem';

export default function NodeSelection({ data, onSubmit, onChange }) {
  const selectedNodes = data.filter((x) => x.selected);
  const unselectedNodes = data.filter((x) => !x.selected);

  const handleDragOver = (e) => {
    e.preventDefault();

    if (e.target.classList.drop) {
      e.target.style.border = '1px solid #0078d4';
    } else {
      e.target.parentNode.style.border = '1px solid #0078d4';
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();

    if (e.target.classList.drop) {
      e.target.style.border = '';
    } else {
      e.target.parentNode.style.border = '';
    }
  };

  const handleSelectedDrop = (e) => {
    e.stopPropagation();

    const name = e.dataTransfer.getData('text');
    const item = data.find((x) => x.name === name);

    if (e.target.classList.drop) {
      e.target.style.border = '';
    } else {
      e.target.parentNode.style.border = '';
    }

    if (!item.selected) {
      onChange(item);
    }
  };

  const handleUnselectedDrop = (e) => {
    e.stopPropagation();

    const name = e.dataTransfer.getData('text');
    const item = data.find((x) => x.name === name);

    if (e.target.classList.drop) {
      e.target.style.border = '';
    } else {
      e.target.parentNode.style.border = '';
    }

    if (item.selected) {
      onChange(item);
    }
  };

  return (
    <div>
      <div className="p-2">
        <div className="container border">
          <div className="row border-bottom font-weight-bold">
            <div className="col py-1">{Language.get('Nodes')}</div>
            <div className="col py-1 border-left">{Language.get('Selected nodes')}</div>
          </div>
          <div className="row">
            <div className="col px-0">
              <div
                className="drop"
                style={{ overflowY: 'auto', height: '500px' }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleUnselectedDrop}
              >
                {unselectedNodes.map((x) => (
                  <NodeItem key={x.name} data={x} onDoubleClick={onChange} />
                ))}
              </div>
            </div>
            <div className="col px-0 border-left">
              <div
                className="drop"
                style={{ overflowY: 'auto', height: '500px' }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleSelectedDrop}
              >
                {selectedNodes.map((x) => (
                  <NodeItem key={x.name} data={x} onDoubleClick={onChange} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-3 py-2 border-top d-flex justify-content-end">
        <Button size="sm" color="primary" onClick={onSubmit} disabled={!data.some((x) => x.selected)}>
          {Language.get('Import')}
        </Button>
      </div>
    </div>
  );
}

NodeSelection.propTypes = {
  data: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]),
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

NodeSelection.defaultProps = {
  data: [],
};
