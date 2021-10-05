import InputNumber from 'features/shared/components/InputNumber';
import { COMPLEX_LOGICAL } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { CustomInput, Form, FormGroup } from 'reactstrap';

function TestCoverage(props, ref) {
  const [data, setData] = useState(appConfig.testCoverage);
  const { complexLogical, threshold } = data;

  const _handleOptionChange = (key, value) => {
    setData({ ...data, [key]: value });
  };

  const getData = () => ({
    key: 'testCoverage',
    value: JSON.parse(JSON.stringify(data)),
  });

  // public for OptionManager reset button call
  const reset = () => {
    setData(appConfig.testCoverage);
  };

  useImperativeHandle(ref, () => ({ getData, reset }));

  useEffect(() => {
    if (appConfig.testCoverage) {
      setData(appConfig.testCoverage);
    }
  }, []);

  return (
    <>
      <p>{Language.get('complexlogicalrelationtestcoverage')}</p>
      <Form className="ml-3 small">
        <FormGroup>
          <CustomInput
            type="radio"
            label={Language.get('average')}
            id={COMPLEX_LOGICAL.Average}
            checked={complexLogical === COMPLEX_LOGICAL.Average}
            onChange={() => _handleOptionChange('complexLogical', COMPLEX_LOGICAL.Average)}
          />
          <CustomInput
            type="radio"
            label={Language.get('weightedaverage')}
            id={COMPLEX_LOGICAL.WeightedAverage}
            checked={complexLogical === COMPLEX_LOGICAL.WeightedAverage}
            onChange={() => _handleOptionChange('complexLogical', COMPLEX_LOGICAL.WeightedAverage)}
          />
          <CustomInput
            type="radio"
            label={Language.get('userdefined')}
            id={COMPLEX_LOGICAL.UserDefined}
            checked={complexLogical === COMPLEX_LOGICAL.UserDefined}
            onChange={() => _handleOptionChange('complexLogical', COMPLEX_LOGICAL.UserDefined)}
          />
        </FormGroup>
        <span>{Language.get('threshold')}: </span>
        <span className="d-inline-block ml-2">
          <InputNumber
            value={threshold}
            min={1}
            onChange={(value) => _handleOptionChange('threshold', value)}
            disabled={complexLogical !== COMPLEX_LOGICAL.UserDefined}
          />
        </span>
      </Form>
    </>
  );
}

export default forwardRef(TestCoverage);
