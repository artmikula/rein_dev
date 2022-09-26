import React, { forwardRef, useImperativeHandle } from 'react';
import { FormGroup, Label } from 'reactstrap';
import Language from 'features/shared/languages/Language';
import appConfig, { defaultOption } from 'features/shared/lib/appConfig';
import InputNumber from '../../InputNumber';

function TestScenarioAndCase(_props, ref) {
  const [data, setData] = React.useState(appConfig.general);
  const { testCasePageSize } = data;

  const _handleOptionChange = (key, value) => {
    setData({ ...data, [key]: value });
  };

  const getData = () => ({
    key: 'testScenarioAndCase',
    value: JSON.parse(JSON.stringify(data)),
  });

  const reset = () => {
    setData(defaultOption.graph);
    return {
      key: 'testScenarioAndCase',
      value: JSON.parse(JSON.stringify(defaultOption.testScenarioAndCase)),
    };
  };

  React.useEffect(() => {
    if (appConfig.testScenarioAndCase) {
      setData(appConfig.testScenarioAndCase);
    }
  }, []);

  useImperativeHandle(ref, () => ({ getData, reset }));
  return (
    <FormGroup>
      <Label className="d-flex flex-wrap flex-md-nowrap align-items-center">
        <span className="text-nowrap mr-2">{Language.get('testcasepagesize')}</span>
        <InputNumber
          min={5}
          value={testCasePageSize}
          onChange={(value) => {
            _handleOptionChange('testCasePageSize', value);
          }}
        />
      </Label>
    </FormGroup>
  );
}

export default forwardRef(TestScenarioAndCase);
