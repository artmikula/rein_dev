import { inspectionPalettes, inspectionRules } from 'features/shared/inspection-palettes';
import Language from 'features/shared/languages/Language';
import React, { useState } from 'react';
import { Button } from 'reactstrap';
import List from '../List';

export default function InspectionPalette({ projectId, workId, onClose }) {
  const [selectedPaltteId, setSelectedPaltteId] = useState(inspectionPalettes[0].id);

  const handleSelectTemplate = (id) => setSelectedPaltteId(id);

  const selectedPalette = inspectionPalettes.find((x) => x.id === selectedPaltteId);

  const rules = inspectionRules.filter((x) => selectedPalette.rules.has(x.code));

  return (
    <div>
      <div className="list-border-color d-flex m-2 border">
        <div className="d-flex flex-column" style={{ width: '40%' }}>
          <p className="list-border-color border-bottom p-2 mb-0" style={{ fontWeight: 500 }}>
            {Language.get('palettes')}
          </p>
          <div className="flex-grow-1" style={{ overflowY: 'auto', height: '300px' }}>
            <List
              selectable
              data={inspectionPalettes}
              selectedPaltteId={selectedPaltteId}
              onSelect={handleSelectTemplate}
              getSelected={(item) => item.id === selectedPaltteId}
              getLabel={(item) => item.name}
              getValue={(item) => item.id}
              getKey={(item) => item.id}
            />
          </div>
        </div>
        <div className="list-border-color border-left d-flex flex-column border-3" style={{ width: '60%' }}>
          <p className="list-border-color border-bottom p-2 mb-0" style={{ fontWeight: 500 }}>
            {Language.get('ruleset')}
          </p>
          <div className="flex-grow-1 overflow-auto" style={{ height: '300px' }}>
            <List
              data={rules}
              selectedPaltteId={selectedPaltteId}
              getLabel={(item) => item.name}
              getKey={(item) => item.code}
              getValue={(item) => item.code}
            />
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end m-2">
        <Button size="sm" onClick={onClose} className="ml-3 px-4" color="primary">
          {Language.get('Ok')}
        </Button>
      </div>
    </div>
  );
}
