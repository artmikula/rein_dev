import templateService from 'features/project/work/services/templateService';
import Language from 'features/shared/languages/Language';
import React, { useEffect, useState } from 'react';
import { Button, FormGroup, Input, Label } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import List from '../List';

const rules = [
  { code: '1', name: 'Rule A' },
  { code: '2', name: 'Rule B' },
  { code: '3', name: 'Rule C' },
  { code: '4', name: 'Rule D' },
  { code: '5', name: 'Rule E' },
  { code: '6', name: 'Rule F' },
  { code: '7', name: 'Rule G' },
  { code: '8', name: 'Rule H' },
  { code: '9', name: 'Rule F' },
  { code: '10', name: 'Rule J' },
];

export default function InspectionTemplate({
  projectId,
  workId,
  workInspectionTemplates,
  setInspectionTemplates,
  modalProps,
}) {
  const [templates, setTemplates] = useState([]);
  const [ruleSet, setRuleSet] = useState([...rules]);
  const [selectedRuleKeys, setSelectedRuleKeys] = useState({});
  const [selectedTemplateIds, setSelectedTemplateIds] = useState({});
  const [templateName, setTemplateName] = useState('');

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
    setSelectedRuleKeys(getSelectedRuleKeys(templates.filter((x) => selectedTemplateIds[x.id])));
  };

  const handleSelectRuleSet = (code) => {
    if (selectedRuleKeys[code]) {
      delete selectedRuleKeys[code];
    } else {
      selectedRuleKeys[code] = true;
    }
    setSelectedRuleKeys({ ...selectedRuleKeys });
  };

  const handleSave = () => {
    setInspectionTemplates(templates.filter((x) => selectedTemplateIds[x.id]));
  };

  const handleChangeTemplateName = (e) => setTemplateName(e.target.value);

  const handleCreate = async () => {
    const template = { id: uuidv4(), name: templateName.trim(), ruleSet: Object.keys(selectedRuleKeys).join(',') };
    const result = await templateService.createAsync(template);
    if (result.data) {
      setTemplateName('');
      setTemplates([...templates, template]);
    }
  };

  const getTemplateLabel = (item) => item.name;

  const getRuleLabel = (item) => item.name;

  const getTemplateValue = (item) => item.id;

  const getRuleValue = (item) => item.code;

  const getTemplateSelected = (item) => selectedTemplateIds[item.id];

  const getRuleSelected = (item) => selectedRuleKeys[item.code];

  const getTemplates = async () => {
    const result = await templateService.listAsync();
    if (result.data) {
      setTemplates(result.data);
    }
  };

  const deleteTemplate = (id) => {
    delete selectedTemplateIds[id];
    const newTemplates = templates.filter((x) => x.id !== id);

    setTemplates(newTemplates);
    setInspectionTemplates(newTemplates);
    setSelectedRuleKeys(getSelectedRuleKeys(templates.filter((x) => selectedTemplateIds[x.id])));
  };

  const handleDeleteTemplate = (id) => {
    confirm(undefined, { title: 'Delete confirm', yesAction: () => deleteTemplate(id) });
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
    setSelectedRuleKeys(getSelectedRuleKeys(workInspectionTemplates));
  }, workInspectionTemplates);

  const canCreate = Object.keys(selectedRuleKeys).length > 0 && templateName.trim().length > 0;
  const canSave =
    workInspectionTemplates.length !== Object.keys(selectedTemplateIds).length ||
    workInspectionTemplates.some((x) => !selectedTemplateIds[x.id]);

  return (
    <div>
      <div className="list-border-color d-flex m-2 border">
        <div className="w-50 d-flex flex-column">
          <p className="list-border-color border-bottom p-2 mb-0" style={{ fontWeight: 500 }}>
            Inspection Templates
          </p>
          <div className="flex-grow-1" style={{ overflowY: 'auto', height: '372px' }}>
            <List
              data={templates}
              selectedTemplateIds={selectedTemplateIds}
              onSelect={handleSelectTemplate}
              getLabel={getTemplateLabel}
              getValue={getTemplateValue}
              getSelected={getTemplateSelected}
              getKey={getTemplateValue}
              onDelete={handleDeleteTemplate}
              removable
            />
          </div>
        </div>
        <div className="list-border-color w-50 border-left d-flex flex-column">
          <p className="list-border-color border-bottom p-2 mb-0" style={{ fontWeight: 500 }}>
            Inspection Rules
          </p>
          <div className="flex-grow-1 overflow-auto" style={{ height: '300px' }}>
            <List
              data={ruleSet}
              selectedRuleKeys={selectedRuleKeys}
              onSelect={handleSelectRuleSet}
              getLabel={getRuleLabel}
              getValue={getRuleValue}
              getSelected={getRuleSelected}
              getKey={getRuleValue}
            />
          </div>
          <div className="border-top mt-2 p-2">
            <FormGroup className="mb-0">
              <Label check htmlFor="template-name">
                {Language.get('createnewtemplate')}
              </Label>
              <div className="d-flex">
                <Input
                  type="text"
                  id="template-name"
                  placeholder={Language.get('newtemplatename')}
                  bsSize="sm"
                  value={templateName}
                  onChange={handleChangeTemplateName}
                />
                <Button className="ml-2" size="sm" disabled={!canCreate} onClick={handleCreate}>
                  {Language.get('create')}
                </Button>
              </div>
            </FormGroup>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end m-2">
        <Button size="sm" color="primary" onClick={handleSave} disabled={!canSave}>
          {Language.get('save')}
        </Button>
        <Button size="sm" onClick={modalProps.onClose} className="ml-3">
          {Language.get('cancel')}
        </Button>
      </div>
    </div>
  );
}
