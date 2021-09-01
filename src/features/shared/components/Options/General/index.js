import { TEST_CASE_METHOD } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import optionService from 'features/shared/services/optionService';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

function General(props, ref) {
  const [data, setData] = useState(appConfig.general);
  const { testCaseMethod, viewOmmited } = data;

  const _handleOptionChange = (key, value) => {
    setData({ ...data, [key]: value });
  };

  // public for OptionManager save button call
  const save = async () => {
    const result = await optionService.update(JSON.stringify({ key: 'general', value: JSON.stringify(data) }));
    if (result.error) {
      if (result.error.detail) {
        alert(result.error.detail, { title: result.error.title, error: true });
      } else {
        alert(result.error, { title: Language.get('error'), error: true });
      }
      return false;
    }
    Object.assign(appConfig, { general: data });
    return true;
  };

  // public for OptionManager reset button call
  const reset = () => {
    setData(appConfig.general);
  };

  useImperativeHandle(ref, () => ({ save, reset }));

  useEffect(() => {
    if (appConfig.general) {
      setData(appConfig.general);
    }
  }, []);

  return (
    <>
      <FormGroup>
        <Label className="d-flex flex-wrap flex-md-nowrap align-items-center">
          <span className="text-nowrap mr-2">{Language.get('testcaseelicitationmethod')}</span>
          <Input
            type="select"
            bsSize="sm"
            value={testCaseMethod}
            onChange={(e) => _handleOptionChange('testCaseMethod', e.target.value)}
          >
            <option value={TEST_CASE_METHOD.MyersTechnique}>Myers` Technique</option>
            <option value={TEST_CASE_METHOD.MUMCUT}>MUMCUT</option>
          </Input>
        </Label>
      </FormGroup>
      <FormGroup check>
        <Label check className="d-inline font-weight-lighter small text-muted">
          <Input
            type="checkbox"
            color="primary"
            checked={viewOmmited}
            onChange={(e) => _handleOptionChange('viewOmmited', e.target.checked)}
          />
          {Language.get('viewommitedscenariosandtestcases')}
        </Label>
      </FormGroup>
    </>
  );
}

export default forwardRef(General);
