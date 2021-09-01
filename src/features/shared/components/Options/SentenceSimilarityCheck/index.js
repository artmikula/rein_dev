import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Button, FormGroup, FormText, Input, Label } from 'reactstrap';
import Language from 'features/shared/languages/Language';
import similarityCosine from 'features/shared/lib/similarityCosine';
import optionService from 'features/shared/services/optionService';
import appConfig from 'features/shared/lib/appConfig';
import InputNumber from '../../InputNumber';
import Slider from './components/Slider';

function SentenceSimilarityCheck(props, ref) {
  const [data, setData] = useState(appConfig.similarity);
  const [test, setTest] = useState({ test1: '', test2: '', similarRate: null });
  const { enable, rate } = data;
  const { test1, test2, similarRate } = test;
  const _handleCheck = () => setData({ ...data, enable: !enable });
  const _handleRateChange = (value) => setData({ ...data, rate: parseFloat(value) });
  const _handleSliderRateChange = (e) => setData({ ...data, rate: parseFloat(e.target.value) });
  const _handleTest = () => {
    const distance = similarityCosine.distanceTwoString(test1, test2);
    const _similarRate = (1 - distance / Math.PI) * 100;
    setTest({ ...test, similarRate: parseFloat(_similarRate) });
  };

  // public for OptionManager save button call
  const save = () => {
    const result = optionService.update(JSON.stringify({ key: 'similarity', value: JSON.stringify(data) }));
    if (result.error) {
      alert(result.error.detail, { title: result.error.title, error: true });
    } else {
      Object.assign(appConfig, { similarity: data });
    }
  };

  // public for OptionManager reset button call
  const reset = () => {
    setData(appConfig.similarity);
  };

  useImperativeHandle(ref, () => ({ save, reset }));

  useEffect(() => {
    if (appConfig.similarity) {
      setData(appConfig.similarity);
    }
  }, []);

  const similarCheckResultText = Language.get(
    similarRate >= rate ? 'twosentencearesimilar' : 'twosentencearenotsimilar'
  );

  return (
    <>
      <FormGroup check>
        <Label check className="d-inline small text-muted font-weight-lighter">
          <Input type="checkbox" color="primary" checked={enable} onChange={_handleCheck} />
          {Language.get('usesentencesimilaritycheck')}
        </Label>
      </FormGroup>
      <p className="mt-3 mb-0">{Language.get('sentencesimilaritycheck')}:</p>
      <div className="d-flex mt-2 mb-2 align-items-center">
        <Slider className="flex-grow-1" disabled={!enable} value={rate} onChange={_handleSliderRateChange} />
        <InputNumber
          min={0}
          max={100}
          step={10}
          affix="%"
          value={rate}
          onChange={_handleRateChange}
          disabled={!enable}
          className="ml-3"
        />
      </div>
      <p className="mb-2 mt-3">{Language.get('test')}</p>
      <div className="d-flex align-items-end">
        <div className="flex-grow-1">
          <Input
            id="test-similarity"
            value={test1}
            onChange={(e) => setTest({ ...test, test1: e.target.value })}
            disabled={!enable}
            className="mb-2"
            bsSize="sm"
          />
          <Input
            value={test2}
            onChange={(e) => setTest({ ...test, test2: e.target.value })}
            disabled={!enable}
            bsSize="sm"
          />
        </div>
        <Button size="sm" color="success" className="ml-2" outline onClick={_handleTest} disabled={!enable}>
          {Language.get('check')}
        </Button>
      </div>
      {(similarRate || similarRate === 0) && (
        <FormText color={similarRate >= rate ? 'success' : 'secondary'} className="mx-3">
          {similarCheckResultText}
          {`(${Language.get('similarity')} ${similarRate.toLocaleString('vi', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          })}%)`}
        </FormText>
      )}
    </>
  );
}

export default forwardRef(SentenceSimilarityCheck);
