import List from 'features/shared/components/List';
import { INSPECTION_PALETTES } from 'features/shared/inspection-palettes';
import Language from 'features/shared/languages/Language';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import './style.scss';

export default function NodePaletteView({ nodes, onClose, onSave }) {
  const [selectedPaltteIds, setSelectedPaltteIds] = useState(new Set());

  const handleCheckPalette = (id) => {
    if (selectedPaltteIds.has(id)) {
      selectedPaltteIds.delete(id);
    } else {
      selectedPaltteIds.add(id);
    }
    setSelectedPaltteIds(new Set(selectedPaltteIds));
  };

  const handleSave = () => {
    onSave([...selectedPaltteIds].join(','));
    onClose();
  };

  const isSingleNode = nodes.length === 1;

  useEffect(() => {
    if (isSingleNode && nodes[0].inspectionPalettes) {
      setSelectedPaltteIds(new Set(nodes[0].inspectionPalettes.split(',')));
    }
  }, [nodes]);

  return (
    <div>
      <div className="list-border-color d-flex m-2 border">
        <div className="d-flex flex-column" style={{ width: '40%' }}>
          <p className="list-border-color border-bottom p-2 mb-0" style={{ fontWeight: 500 }}>
            {isSingleNode ? Language.get('Definition') : Language.get('Nodes')}
          </p>
          <div className="flex-grow-1" style={{ overflowY: 'auto', height: '300px' }}>
            <List
              data={nodes}
              getLabel={(item) => (
                <>
                  <span className="cause-effect-node cause-id mr-2">{item.nodeId}</span>
                  <span>{item.definition}</span>
                </>
              )}
              getValue={(item) => item.id}
              getKey={(item) => item.id}
            />
          </div>
        </div>
        <div className="list-border-color border-left d-flex flex-column border-3" style={{ width: '60%' }}>
          <p className="list-border-color border-bottom p-2 mb-0" style={{ fontWeight: 500 }}>
            {Language.get('palettes')}
          </p>
          <div className="flex-grow-1 overflow-auto" style={{ height: '300px' }}>
            <List
              data={Object.values(INSPECTION_PALETTES)}
              selectedPaltteIds={selectedPaltteIds}
              getLabel={(item) => item.name}
              getKey={(item) => item.code}
              getValue={(item) => item.code}
              getChecked={(item) => selectedPaltteIds.has(item.code)}
              onCheck={handleCheckPalette}
              checkable
            />
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end m-2">
        <Button size="sm" onClick={handleSave} className="ml-3 px-4" color="primary">
          {Language.get('Save')}
        </Button>
        <Button size="sm" onClick={onClose} className="ml-3 px-1">
          {Language.get('Cancel')}
        </Button>
      </div>
    </div>
  );
}

NodePaletteView.propTypes = {
  nodes: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]),
  onClose: PropTypes.func,
  onSave: PropTypes.func,
};

NodePaletteView.defaultProps = {
  nodes: [],
  onClose: undefined,
  onSave: undefined,
};
