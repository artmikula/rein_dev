import appConfig from 'features/shared/lib/appConfig';
import { v4 as uuidv4 } from 'uuid';

class TestData {
  createTest(nodeId) {
    const defaultType = 'String';
    return {
      nodeId,
      type: defaultType,
      strength: appConfig.testData[defaultType][0].intensity,
      trueDatas: appConfig.testData[defaultType][0].trueData,
      falseDatas: appConfig.testData[defaultType][0].falseData,
    };
  }

  add(testDatas, item) {
    const id = uuidv4();
    const _testDatas = [...testDatas];
    const newItem = { ...item, id };

    _testDatas.push(newItem);

    return _testDatas;
  }

  remove(testDatas, item) {
    return testDatas.filter((x) => x.nodeId !== item.node);
  }

  update(testDatas, item, index) {
    const _testDatas = [...testDatas];
    _testDatas[index] = item;

    return _testDatas;
  }

  getTestData(testDatas, assertion) {
    const testData = testDatas.find((x) => x.nodeId === assertion.graphNode.nodeId);
    if (testData) {
      return { testDatas: assertion.result ? testData.trueDatas : testData.falseDatas, type: testData.type };
    }

    return { testDatas: '', type: 'String' };
  }
}
export default new TestData();
