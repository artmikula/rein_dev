import templateService from 'features/project/work/services/templateService';
import Language from 'features/shared/languages/Language';
import React, { useEffect, useState } from 'react';
import { Button, FormGroup, Input, Label } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import { rules } from '../../constant';
import List from '../List';

export default function CreateUpdateInspectionTemplate({ projectId, workId, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [selectedRuleKeys, setSelectedRuleKeys] = useState({});
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const selectedTemplate = templates.find((x) => x.id === selectedTemplateId);

  const getTemplates = async () => {
    const result = await templateService.listAsync();
    if (result.data) {
      setTemplates(result.data);
    }
  };

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
    if (selectedTemplateId === id) {
      setSelectedTemplateId(null);
      setSelectedRuleKeys({});
    } else {
      setSelectedTemplateId(id);
      setSelectedRuleKeys(getSelectedRuleKeys([templates.find((x) => x.id === id)]));
    }
  };

  const handleSelectRuleSet = (code) => {
    if (selectedRuleKeys[code]) {
      delete selectedRuleKeys[code];
    } else {
      selectedRuleKeys[code] = true;
    }
    setSelectedRuleKeys({ ...selectedRuleKeys });
  };

  const handleChangeTemplateName = (e) => setTemplateName(e.target.value);

  const handleCreate = async () => {
    const template = { id: uuidv4(), name: templateName.trim(), ruleSet: Object.keys(selectedRuleKeys).join(',') };
    const result = await templateService.createAsync(template);
    if (result.data) {
      setTemplateName('');
      setSelectedRuleKeys({});
      setSelectedTemplateId(null);
      getTemplates();
    }
  };

  const getTemplateLabel = (item) => item.name;

  const getRuleLabel = (item) => item.name;

  const getTemplateValue = (item) => item.id;

  const getRuleValue = (item) => item.code;

  const getTemplateSelected = (item) => item.id === selectedTemplateId;

  const getRuleSelected = (item) => selectedRuleKeys[item.code];

  const deleteTemplate = async (id) => {
    await templateService.deleteAsync(id);

    if (selectedTemplateId === id) {
      setSelectedTemplateId(null);
      setSelectedRuleKeys({});
    }

    getTemplates();
  };

  const handleDeleteTemplate = (id) => {
    confirm(undefined, { title: 'Delete confirm', yesAction: () => deleteTemplate(id) });
  };

  const updateTemplate = async () => {
    const template = { ...selectedTemplate, ruleSet: Object.keys(selectedRuleKeys).join(',') };
    await templateService.updateAsync(template);
    getTemplates();
  };

  const handleUpdateTemplate = () => {
    confirm(undefined, { title: 'Update confirm', yesAction: () => updateTemplate() });
  };

  useEffect(() => {
    getTemplates();
  }, []);

  const canCreate = Object.keys(selectedRuleKeys).length > 0 && templateName.trim().length > 0;

  const templateRuleSet = selectedTemplate ? selectedTemplate.ruleSet.split(',') : [];

  const canUpdateTemplate =
    selectedTemplate &&
    (templateRuleSet.length !== Object.keys(selectedRuleKeys).length ||
      templateRuleSet.some((x) => !selectedRuleKeys[x]));

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
              selectedTemplateIds={selectedTemplateId}
              onSelect={handleSelectTemplate}
              getLabel={getTemplateLabel}
              getValue={getTemplateValue}
              getSelected={getTemplateSelected}
              getKey={getTemplateValue}
              onDelete={handleDeleteTemplate}
              selectable
              removable
            />
          </div>
        </div>
        <div className="list-border-color w-50 border-left d-flex flex-column border-3">
          <p className="list-border-color border-bottom p-2 mb-0" style={{ fontWeight: 500 }}>
            Inspection Rules
          </p>
          <div className="flex-grow-1 overflow-auto" style={{ height: '300px' }}>
            <List
              data={rules}
              selectedRuleKeys={selectedRuleKeys}
              onSelect={handleSelectRuleSet}
              getLabel={getRuleLabel}
              getValue={getRuleValue}
              getSelected={getRuleSelected}
              getKey={getRuleValue}
              selectable
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
                <Button
                  className="ml-2"
                  size="sm"
                  disabled={!canCreate}
                  onClick={handleCreate}
                  color={canCreate ? 'primary' : 'secondary'}
                  outline
                >
                  {Language.get('create')}
                </Button>
              </div>
            </FormGroup>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end m-2">
        {canUpdateTemplate && (
          <Button size="sm" onClick={handleUpdateTemplate} color="primary">
            {`${Language.get('Update')} ${selectedTemplate.name}`}
          </Button>
        )}
        <Button size="sm" onClick={onClose} className="ml-3">
          {Language.get('cancel')}
        </Button>
      </div>
    </div>
  );
}
