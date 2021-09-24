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
    const _testDatas = [...testDatas];
    const index = _testDatas.findIndex((e) => e.nodeId === item.node);

    if (index >= 0) {
      _testDatas.splice(index, 1);
    }

    return _testDatas;
  }

  update(testDatas, item, index) {
    const _testDatas = [...testDatas];
    _testDatas[index] = item;

    return _testDatas;
  }

  getTestData(testDatas, nodeId) {
    return testDatas.find((x) => x.nodeId === nodeId);
  }
}
export default new TestData();
