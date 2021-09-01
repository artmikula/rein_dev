import InputNumber from 'features/shared/components/InputNumber';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import optionService from 'features/shared/services/optionService';
import cloneDeep from 'lodash.clonedeep';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Input } from 'reactstrap';

function TestData(props, ref) {
  const [data, setData] = useState(appConfig.testData);
  const [selectedType, setSelectedType] = useState('String');

  const _handleOptionChange = (item, field, value) => {
    const _item = item;
    _item[field] = value;
    setData(cloneDeep(data));
  };

  // public for OptionManager save button call
  const save = async () => {
    const result = await optionService.update(JSON.stringify({ key: 'testData', value: JSON.stringify(data) }));
    if (result.error) {
      if (result.error.detail) {
        alert(result.error.detail, { title: result.error.title, error: true });
      } else {
        alert(result.error, { title: Language.get('error'), error: true });
      }
      return false;
    }
    Object.assign(appConfig, { testData: data });
    return true;
  };

  // public for OptionManager reset button call
  const reset = () => {
    setData(appConfig.testData);
  };

  useImperativeHandle(ref, () => ({ save, reset }));

  useEffect(() => {
    if (appConfig.testData) {
      setData(appConfig.testData);
    }
  }, []);

  return (
    <>
      <div className="d-flex">
        <span className="w-25 text-muted">{Language.get('testdatatype')}</span>
        <div className="d-flex flex-column flex-grow-1 border small">
          {Object.keys(data).map((key) => (
            <button
              key={key}
              className={`pl-2 border-0 outline-0 text-left ${selectedType === key ? 'bg-gray' : 'bg-white'}`}
              onClick={() => setSelectedType(key)}
              type="button"
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      <div className="d-flex mt-4">
        <span className="w-25 text-muted">{Language.get('testdata')}</span>
        <table className="ml-3 small">
          <thead className="font-weight-500">
            <tr>
              <td>{Language.get('intensity')}</td>
              <td>{Language.get('truedata')}</td>
              <td>{Language.get('falsedata')}</td>
            </tr>
          </thead>
          <tbody>
            {data[selectedType].map((item, index) => (
              <tr key={index}>
                <td>
                  <InputNumber
                    min={0}
                    value={item.intensity}
                    onChange={(value) => _handleOptionChange(item, 'intensity', value)}
                  />
                </td>
                <td>
                  <Input
                    bsSize="sm"
                    value={item.trueData}
                    onChange={(e) => _handleOptionChange(item, 'trueData', e.target.value)}
                  />
                </td>
                <td>
                  <Input
                    bsSize="sm"
                    value={item.falseData}
                    onChange={(e) => _handleOptionChange(item, 'falseData', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default forwardRef(TestData);
