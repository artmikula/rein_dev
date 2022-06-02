import React from 'react';
import PropTypes from 'prop-types';
import Enumerable from 'linq';
import { FormGroup, Input } from 'reactstrap';
import { TESTDATA_TYPE } from 'features/shared/constants';
import appConfig from 'features/shared/lib/appConfig';

function TestDataRow(props) {
  const { testData, onUpdate, onBlur, onChangeTrueFalseData } = props;
  const orderedTestDatas = React.useMemo(
    () =>
      Enumerable.from(testData)
        .orderBy((x) => parseInt(x.nodeId.substr(1, x.nodeId.length), 10))
        .toArray(),
    [testData]
  );
  return (
    <tbody>
      {orderedTestDatas.map((data) => (
        <tr key={data.nodeId}>
          <td className="bg-light-gray">{data.nodeId}</td>
          <td className="position-relative p-0 test-data-type">
            <FormGroup className="test-data-input">
              <Input
                type="select"
                name="type"
                bsSize="sm"
                value={data.type}
                onChange={(e) => onUpdate(data.nodeId, e.target.value)}
              >
                {Object.keys(appConfig.testData).map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </Input>
            </FormGroup>
          </td>
          <td className="position-relative p-0">
            {appConfig.testData[data.type] && (
              <FormGroup className="test-data-input">
                <Input
                  type="select"
                  name="strength"
                  bsSize="sm"
                  value={data.strength}
                  onChange={(e) => onUpdate(data.nodeId, data.type, parseInt(e.target.value, 10))}
                >
                  {appConfig.testData[data.type].map((item, index) => (
                    <option key={index} value={item.intensity}>
                      {item.intensity}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            )}
          </td>
          <td className="position-relative p-0">
            <FormGroup className="test-data-input">
              <Input
                type="text"
                name="strength"
                bsSize="sm"
                value={data.trueDatas ?? ''}
                onChange={(e) => onChangeTrueFalseData(data.nodeId, TESTDATA_TYPE.TrueData, e.target.value)}
                onBlur={() => onBlur(data.nodeId)}
              />
            </FormGroup>
          </td>
          <td className="position-relative p-0">
            <FormGroup className="test-data-input">
              <Input
                type="text"
                name="strength"
                bsSize="sm"
                value={data.falseDatas ?? ''}
                onChange={(e) => onChangeTrueFalseData(data.nodeId, TESTDATA_TYPE.FalseData, e.target.value)}
                onBlur={() => onBlur(data.nodeId)}
              />
            </FormGroup>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

TestDataRow.propTypes = {
  testData: PropTypes.oneOfType([PropTypes.array]).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  onChangeTrueFalseData: PropTypes.func.isRequired,
};

export default TestDataRow;
