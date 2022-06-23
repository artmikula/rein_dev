import Download from 'downloadjs';
import TestData from 'features/project/work/biz/TestData';
import { setTestDatas } from 'features/project/work/slices/workSlice';
import {
  CLASSIFY,
  FILE_NAME,
  OPTION_TYPE,
  TESTDATA_TYPE,
  TEST_DATA_SHORTCUT,
  TEST_DATA_SHORTCUT_CODE,
} from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import eventBus from 'features/shared/lib/eventBus';
import { arrayToCsv } from 'features/shared/lib/utils';
import Mousetrap from 'mousetrap';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Table } from 'reactstrap';
import ImportForm from './components/ImportForm';
import TestDataRow from './components/TestDataRow';
import './style.scss';

class TestDataTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      importFormOpen: false,
      removedTestDatas: [],
    };
  }

  async componentDidMount() {
    eventBus.subscribe(this, domainEvents.CAUSEEFFECT_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleCauseEffectEvents(message);
    });

    eventBus.subscribe(this, domainEvents.TEST_DATA_MENU_DOMAINEVENT, (event) => {
      const { code } = event.message;
      this._handleShortCutEvents(code);
    });

    eventBus.subscribe(this, domainEvents.WORK_MENU_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleWorkMenuEvents(message);
    });

    TEST_DATA_SHORTCUT.forEach(({ code, shortcutKeys }) => {
      Mousetrap.bind(shortcutKeys.join('+'), (e) => {
        e.preventDefault();
        this._handleShortCutEvents(code);
      });
    });
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
    Mousetrap.reset();
  }

  _setTestDatas = (testDatas, raiseEvent = true) => {
    const { setTestDatas } = this.props;

    setTestDatas(testDatas);

    if (raiseEvent) {
      this._raiseEvent({
        action: domainEvents.ACTION.UPDATE,
        value: { ...testDatas },
        receivers: [domainEvents.DES.TESTSCENARIOS],
      });
    }
  };

  _raiseEvent = (message) => {
    eventBus.publish(domainEvents.TEST_DATA_DOMAINEVENT, message);
  };

  _addData = (data) => {
    let { testDatas } = this.props;

    data.forEach((value) => {
      if (value.type !== CLASSIFY.CAUSE || value.isMerged) {
        return;
      }

      const item = TestData.createTest(value.node);
      testDatas = TestData.add(testDatas, item);
    });

    this._setTestDatas(testDatas, false);
  };

  _reCreateData = () => {
    const { testDatas } = this.props;
    const { removedTestDatas } = this.state;
    const result = testDatas.slice();
    const newTestDatas = removedTestDatas.filter((removedTestData) =>
      testDatas.some((testData) => testData.nodeId !== removedTestData.nodeId)
    );
    if (newTestDatas.length > 0) {
      newTestDatas.forEach((testData) => {
        result.push(testData);
      });
      this._setTestDatas(result, false);
    }
  };

  _removeData = (item) => {
    const { testDatas } = this.props;
    const { removedTestDatas, currentTestDatas } = TestData.remove(testDatas, item);
    if (removedTestDatas.length > 0) {
      this.setState({ removedTestDatas });
    }
    this._setTestDatas(currentTestDatas, false);
  };

  _updateData = (nodeId, type, strength = 1) => {
    const { testDatas, onChangeData } = this.props;
    const index = testDatas.findIndex((x) => x.nodeId === nodeId);
    const item = { ...testDatas[index] };
    const strengthCase = appConfig.testData[type].find((x) => x.intensity === strength);

    item.type = type;
    item.strength = strength;
    item.trueDatas = strengthCase?.trueData;
    item.falseDatas = strengthCase?.falseData;
    item.isChanged = true;
    onChangeData(item.isChanged);

    const newTestDatas = TestData.update(testDatas, item, index);

    this._setTestDatas(newTestDatas);
  };

  _onTrueFalseDataChange = (nodeId, valueType, value) => {
    const { testDatas, onChangeData } = this.props;
    const index = testDatas.findIndex((x) => x.nodeId === nodeId);
    const item = { ...testDatas[index] };

    item.isChanged = true;
    onChangeData(item.isChanged);

    switch (valueType) {
      case TESTDATA_TYPE.TrueData:
        item.trueDatas = value;
        break;
      case TESTDATA_TYPE.FalseData:
        item.falseDatas = value;
        break;
      default:
        break;
    }

    const newTestDatas = TestData.update(testDatas, item, index);
    this._setTestDatas(newTestDatas, false);
  };

  _handleCauseEffectEvents = (message) => {
    const { action, value } = message;
    if (action === domainEvents.ACTION.ADD) {
      this._addData(value);
    }
    if (action === domainEvents.ACTION.RECREATE) {
      this._reCreateData();
    }
    if (action === domainEvents.ACTION.ACCEPTDELETE) {
      this._removeData(value);
    }
    if (action === domainEvents.ACTION.CHANGE_NODE_ID) {
      this._changeNodeId(value);
    }
  };

  _changeNodeId = ({ oldNode, newNode }) => {
    const { testDatas } = this.props;
    const index = testDatas.findIndex((x) => x.nodeId === oldNode);

    if (index !== -1) {
      const newItem = { ...testDatas[index], nodeId: newNode };
      const newList = [...testDatas];

      newList[index] = newItem;

      this._setTestDatas(newList, false);
    }
  };

  _exportData = () => {
    const { testDatas, workName } = this.props;
    const dataToConvert = testDatas.map((data) => ({
      Cause: data.nodeId,
      Type: data.type,
      Intensity: data.strength,
      'True Data': data.trueDatas,
      'False Data': data.falseDatas,
    }));
    const csvFile = arrayToCsv(dataToConvert);
    Download(csvFile, FILE_NAME.EXPORT_TEST_DATA.replace('workname', workName), 'text/csv');
  };

  _openImportForm = () => this.setState({ importFormOpen: true });

  _closeImportForm = () => this.setState({ importFormOpen: false });

  _handleShortCutEvents = (code) => {
    switch (code) {
      case TEST_DATA_SHORTCUT_CODE.EXPORT:
        this._exportData();
        break;
      case TEST_DATA_SHORTCUT_CODE.IMPORT:
        this._openImportForm();
        break;
      case TEST_DATA_SHORTCUT_CODE.DEFAULT_SETUP:
        this._setDefaultData();
        break;
      default:
        break;
    }
  };

  _setDefaultData = () => {
    window.option({ optionType: OPTION_TYPE.TEST_DATA });
  };

  _handleWorkMenuEvents = (message) => {
    const { action } = message;
    const { testDatas } = this.props;

    if (action === domainEvents.ACTION.REPORTWORK) {
      this._raiseEvent({
        action: domainEvents.ACTION.REPORTWORK,
        value: { testData: testDatas },
        receivers: [domainEvents.DES.WORKMENU],
      });
    }
  };

  _onBlurInputData = (nodeId) => {
    const { testDatas } = this.props;
    const testDataIndex = testDatas.findIndex((testData) => testData.nodeId === nodeId);
    if (testDataIndex > -1) {
      const testData = { ...testDatas[testDataIndex] };
      if (testData.isChanged) {
        testData.isChanged = false;
        const newTestDatas = TestData.update(testDatas, testData, testDataIndex);
        this._setTestDatas(newTestDatas, false);
      }
    }
  };

  render() {
    const { importFormOpen } = this.state;
    const { testDatas, match } = this.props;
    const { projectId, workId } = match.params;

    return (
      <>
        <Table size="sm" bordered className="test-data-table">
          <thead className="bg-transparent">
            <tr className="text-primary">
              <td className="bg-light-gray">{Language.get('cause')}</td>
              <td>{Language.get('type')}</td>
              <td>{Language.get('intensity')}</td>
              <td>{Language.get('truedata')}</td>
              <td>{Language.get('falsedata')}</td>
            </tr>
          </thead>
          <TestDataRow
            testData={testDatas}
            onUpdate={this._updateData}
            onBlur={this._onBlurInputData}
            onChangeTrueFalseData={this._onTrueFalseDataChange}
          />
        </Table>

        <ImportForm
          isOpenModel={importFormOpen}
          projectId={projectId}
          workId={workId}
          onToggleModal={this._closeImportForm}
        />
      </>
    );
  }
}

TestDataTable.propTypes = {
  workName: PropTypes.string.isRequired,
  testDatas: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  setTestDatas: PropTypes.func.isRequired,
  onChangeData: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  workName: state.work.name,
  testDatas: state.work.testDatas,
});

const mapDispatchToProps = { setTestDatas };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TestDataTable));
