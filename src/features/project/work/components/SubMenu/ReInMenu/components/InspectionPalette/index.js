import { INSPECTION_PALETTES, INSPECTION_RULES } from 'features/shared/inspection-palettes';
import Language from 'features/shared/languages/Language';
import React, { useState } from 'react';
import { Button } from 'reactstrap';
import List from '../../../../../../../shared/components/List';

export default function InspectionPalette({ projectId, workId, onClose }) {
  const [selectedPaltteCode, setSelectedPaletteCode] = useState(Object.values(INSPECTION_PALETTES)[0].code);

  const handleSelectTemplate = (code) => setSelectedPaletteCode(code);

  const selectedPalette = INSPECTION_PALETTES[selectedPaltteCode];

  const rules = [];

  selectedPalette.rules.forEach((x) => {
    rules.push(INSPECTION_RULES[x]);
  });

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
              data={Object.values(INSPECTION_PALETTES)}
              selectedPaltteCode={selectedPaltteCode}
              onSelect={handleSelectTemplate}
              getSelected={(item) => item.code === selectedPaltteCode}
              getLabel={(item) => item.name}
              getValue={(item) => item.code}
              getKey={(item) => item.code}
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
              selectedPaltteCode={selectedPaltteCode}
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
