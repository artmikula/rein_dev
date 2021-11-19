import templateService from 'features/project/work/services/templateService';
import Language from 'features/shared/languages/Language';
import React, { useEffect, useState } from 'react';
import { Button } from 'reactstrap';
import { rules } from '../../constant';
import List from '../List';

export default function InspectionTemplate({
  projectId,
  workId,
  workInspectionTemplates,
  setInspectionTemplates,
  onClose,
}) {
  const [templates, setTemplates] = useState([]);
  const [ruleSet, setRuleSet] = useState([...rules]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState({});

  const getSelectedRuleKeys = (templates) => {
    const rules = {};
    templates.forEach((x) =>
      x.ruleSet.split(',').forEach((x) => {
        rules[x] = true;
      })
    );

    return rules;
  };

  const handleSelectTemplate = (id) => {
    if (selectedTemplateIds[id]) {
      delete selectedTemplateIds[id];
    } else {
      selectedTemplateIds[id] = true;
    }

    setSelectedTemplateIds({ ...selectedTemplateIds });
  };

  const handleSave = () => {
    setInspectionTemplates(templates.filter((x) => selectedTemplateIds[x.id]));
    onClose();
  };

  const getTemplateLabel = (item) => item.name;

  const getRuleLabel = (item) => item.name;

  const getTemplateValue = (item) => item.id;

  const getRuleValue = (item) => item.code;

  const getTemplateSelected = (item) => selectedTemplateIds[item.id];

  const getTemplates = async () => {
    const result = await templateService.listAsync();
    if (result.data) {
      setTemplates(result.data);
    }
  };

  useEffect(() => {
    getTemplates();
  }, []);

  useEffect(() => {
    const templateIds = {};
    workInspectionTemplates.forEach((x) => {
      templateIds[x.id] = true;
    });

    setSelectedTemplateIds(templateIds);
  }, workInspectionTemplates);

  const canSave =
    workInspectionTemplates.length !== Object.keys(selectedTemplateIds).length ||
    workInspectionTemplates.some((x) => !selectedTemplateIds[x.id]);

  const selectedRuleKeys = getSelectedRuleKeys(templates.filter((x) => selectedTemplateIds[x.id]));

  const getRuleSelected = () => true;

  const selectedRuleSet = ruleSet.filter((x) => selectedRuleKeys[x.code]);

  return (
    <div>
      <div className="list-border-color d-flex m-2 border">
        <div className="w-50 d-flex flex-column">
          <p className="list-border-color border-bottom p-2 mb-0" style={{ fontWeight: 500 }}>
            Inspection Templates
          </p>
          <div className="flex-grow-1" style={{ overflowY: 'auto', height: '300px' }}>
            <List
              data={templates}
              selectedTemplateIds={selectedTemplateIds}
              onSelect={handleSelectTemplate}
              getLabel={getTemplateLabel}
              getValue={getTemplateValue}
              getSelected={getTemplateSelected}
              getKey={getTemplateValue}
              selectable
            />
          </div>
        </div>
        <div className="list-border-color w-50 border-left d-flex flex-column border-3">
          <p className="list-border-color border-bottom p-2 mb-0" style={{ fontWeight: 500 }}>
            Inspection Rules
          </p>
          <div className="flex-grow-1 overflow-auto" style={{ height: '300px' }}>
            <List
              data={selectedRuleSet}
              selectedTemplateIds={selectedTemplateIds}
              getLabel={getRuleLabel}
              getValue={getRuleValue}
              getSelected={getRuleSelected}
              getKey={getRuleValue}
            />
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end m-2">
        <Button size="sm" color="primary" onClick={handleSave} disabled={!canSave}>
          {Language.get('save')}
        </Button>
        <Button size="sm" onClick={onClose} className="ml-3">
          {Language.get('cancel')}
        </Button>
      </div>
    </div>
  );
}
