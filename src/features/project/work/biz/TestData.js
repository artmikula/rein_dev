import appConfig from 'features/shared/lib/appConfig';

class TestData {
  constructor() {
    this._list = [];
  }

  set(list) {
    this._list = list;
  }

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

  add(item, id) {
    this._list.push({ ...item, id });
    return this._list;
  }

  remove(item) {
    const index = this._list.findIndex((e) => e.nodeId === item.node);
    if (index >= 0) {
      this._list.splice(index, 1);
    }
    return this._list;
  }

  update(index, item) {
    this._list[index] = item;
    return this._list;
  }

  getTestData(nodeId) {
    return this._list.find((x) => x.nodeId === nodeId);
  }
}
export default new TestData();
