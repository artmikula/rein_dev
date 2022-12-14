import Download from 'downloadjs';
import TestData from 'features/project/work/biz/TestData';
import { setTestDatas } from 'features/project/work/slices/workSlice';
import { subscribeUndoHandlers, unSubscribeUndoHandlers } from 'features/project/work/slices/undoSlice';
import {
  ACTIONS_STATE_NAME,
  CLASSIFY,
  FILE_NAME,
  OPTION_TYPE,
  PANELS_NAME,
  TESTDATA_TYPE,
  TEST_DATA_SHORTCUT,
  TEST_DATA_SHORTCUT_CODE,
} from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import eventBus from 'features/shared/lib/eventBus';
import { arrayToCsv } from 'features/shared/lib/utils';
import ActionsHelper from 'features/shared/lib/actionsHelper';
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
      cutData: [],
    };
  }

  async componentDidMount() {
    const { subscribeUndoHandlers } = this.props;
    eventBus.subscribe(this, domainEvents.CAUSEEFFECT_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleCauseEffectEvents(message);
    });

    eventBus.subscribe(this, domainEvents.TEST_DATA_MENU_DOMAINEVENT, (event) => {
      const { code } = event.message;
      this._handleShortCutEvents(code);
    });

    TEST_DATA_SHORTCUT.forEach(({ code, shortcutKeys }) => {
      Mousetrap.bind(shortcutKeys.join('+'), (e) => {
        e.preventDefault();
        this._handleShortCutEvents(code);
      });
    });
    subscribeUndoHandlers({
      component: PANELS_NAME.TEST_DATA,
      update: this._updateUndoState,
      undo: this._handleUpdateActions,
    });
  }

  componentWillUnmount() {
    const { unSubscribeUndoHandlers } = this.props;
    eventBus.unsubscribe(this);
    Mousetrap.reset();
    unSubscribeUndoHandlers({ component: PANELS_NAME.TEST_DATA });
  }

  _setTestDatas = (testDatas, raiseEvent = false) => {
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

    this._setTestDatas(testDatas);
  };

  _removeData = (item) => {
    const { testDatas } = this.props;
    this._setTestDatas(TestData.remove(testDatas, item));
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
    this._setTestDatas(newTestDatas);
  };

  _handleCutEvent = (eventData) => {
    const { testDatas } = this.props;
    const cutData = testDatas.filter((testData) => eventData.some((data) => data === testData.nodeId));
    this.setState({ cutData });
  };

  _handlePasteEvent = () => {
    const { testDatas } = this.props;
    const { cutData } = this.state;
    const newTestDatas = testDatas.slice();
    cutData.forEach((data) => {
      const isExists = newTestDatas.find((testData) => testData.nodeId === data.nodeId);
      if (!isExists) {
        newTestDatas.push(data);
      }
    });
    this._setTestDatas(newTestDatas);
    this.setState({ cutData: [] });
  };

  _handleCauseEffectEvents = (message) => {
    const { action, value } = message;
    if (action === domainEvents.ACTION.ADD) {
      this._addData(value);
    }
    if (action === domainEvents.ACTION.CUT) {
      this._handleCutEvent(value);
    }
    if (action === domainEvents.ACTION.PASTE) {
      this._handlePasteEvent();
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

      this._setTestDatas(newList);
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

  _onBlurInputData = (nodeId) => {
    const { testDatas } = this.props;
    const testDataIndex = testDatas.findIndex((testData) => testData.nodeId === nodeId);
    if (testDataIndex > -1) {
      const testData = { ...testDatas[testDataIndex] };
      if (testData.isChanged) {
        testData.isChanged = false;
        const newTestDatas = TestData.update(testDatas, testData, testDataIndex);
        this._setTestDatas(newTestDatas);
      }
    }
  };

  /* Undo/Redo Actions */
  _updateUndoState = (newState) => {
    const { testDatas } = this.props;
    return ActionsHelper.updateUndoState(newState, ACTIONS_STATE_NAME.TEST_DATAS, testDatas);
  };

  _handleUpdateActions = (currentState) => {
    const currentTestDatas = currentState.testDatas;
    this._setTestDatas(currentTestDatas);
  };
  /* End Undo/Redo Actions */

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
  subscribeUndoHandlers: PropTypes.func.isRequired,
  unSubscribeUndoHandlers: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  workName: state.work.name,
  testDatas: state.work.testDatas,
});

const mapDispatchToProps = { setTestDatas, subscribeUndoHandlers, unSubscribeUndoHandlers };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TestDataTable));
