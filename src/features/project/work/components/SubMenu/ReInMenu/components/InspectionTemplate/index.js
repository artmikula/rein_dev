import Language from 'features/shared/languages/Language';
import React, { useState } from 'react';
import { Button, FormGroup, Input, Label } from 'reactstrap';
import List from '../List';

const templates = [
  { id: '1', name: 'Template 1' },
  { id: '2', name: 'Template 2' },
  { id: '3', name: 'Template 3' },
  { id: '4', name: 'Template 4' },
  { id: '5', name: 'Template 5' },
  { id: '6', name: 'Template 6' },
  { id: '7', name: 'Template 7' },
  { id: '8', name: 'Template 8' },
  { id: '9', name: 'Template 9' },
  { id: '10', name: 'Template 10' },
];

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

export default function InspectionTemplate({ projectId, workId }) {
  const [state, setState] = useState({
    inspectionTemplates: [...templates],
    ruleSet: [...rules],
    selectedRuleKeys: {},
    selectedTemplateIds: {},
  });

  const { inspectionTemplates, ruleSet, selectedRuleKeys, selectedTemplateIds } = state;

  const onSelectTemplate = (id) => {
    if (selectedTemplateIds[id]) {
      delete selectedTemplateIds[id];
    } else {
      selectedTemplateIds[id] = true;
    }
    setState({ ...state });
  };

  const onSelectRuleSet = (code) => {
    if (selectedRuleKeys[code]) {
      delete selectedRuleKeys[code];
    } else {
      selectedRuleKeys[code] = true;
    }
    setState({ ...state });
  };

  const handleSave = () => {};

  const getTemplateLabel = (item) => item.name;

  const getRuleLabel = (item) => item.name;

  const getTemplateValue = (item) => item.id;

  const getRuleValue = (item) => item.code;

  const getTemplateSelected = (item) => selectedTemplateIds[item.id];

  const getRuleSelected = (item) => selectedRuleKeys[item.code];

  return (
    <div>
      <div className="list-border-color d-flex m-2 border">
        <div className="w-50">
          <p className="list-border-color border-bottom p-2 mb-0">Inspection Templates</p>
          <div className="p-2">
            <List
              data={inspectionTemplates}
              selectedTemplateIds={selectedTemplateIds}
              onSelect={onSelectTemplate}
              getLabel={getTemplateLabel}
              getValue={getTemplateValue}
              getSelected={getTemplateSelected}
              getKey={getTemplateValue}
            />
          </div>
        </div>
        <div className="list-border-color w-50 border-left d-flex flex-column">
          <p className="list-border-color border-bottom p-2 mb-0">Inspection Rules</p>
          <div className="p-2 flex-grow-1">
            <List
              data={ruleSet}
              selectedRuleKeys={selectedRuleKeys}
              onSelect={onSelectRuleSet}
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
                <Input type="text" id="template-name" placeholder={Language.get('newtemplatname')} bsSize="sm" />
                <Button className="ml-2" size="sm">
                  {Language.get('create')}
                </Button>
              </div>
            </FormGroup>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end m-2">
        <Button size="sm" color="primary" onClick={handleSave}>
          {Language.get('save')}
        </Button>
        <Button size="sm" onClick={handleSave} className="ml-3">
          {Language.get('cancel')}
        </Button>
      </div>
    </div>
  );
}
