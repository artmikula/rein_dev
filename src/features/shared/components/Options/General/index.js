import { TEST_CASE_METHOD } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import appConfig, { defaultOption } from 'features/shared/lib/appConfig';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

function General(props, ref) {
  const [data, setData] = useState(appConfig.general);
  const { testCaseMethod, viewOmitted } = data;

  const _handleOptionChange = (key, value) => {
    setData({ ...data, [key]: value });
  };

  const getData = () => ({
    key: 'general',
    value: JSON.parse(JSON.stringify(data)),
  });

  // public for OptionManager reset button call
  const reset = () => {
    setData(defaultOption.general);
    return {
      key: 'general',
      value: JSON.parse(JSON.stringify(defaultOption.general)),
    };
  };

  useImperativeHandle(ref, () => ({ getData, reset }));

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
            checked={viewOmitted}
            onChange={(e) => _handleOptionChange('viewOmitted', e.target.checked)}
          />
          {Language.get('viewommitedscenariosandtestcases')}
        </Label>
      </FormGroup>
    </>
  );
}

export default forwardRef(General);
