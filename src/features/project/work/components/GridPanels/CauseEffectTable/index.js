/* eslint-disable max-lines */
import CauseEffect from 'features/project/work/biz/CauseEffect';
import { setCauseEffects } from 'features/project/work/slices/workSlice';
import { subscribeUndoHandlers, unSubscribeUndoHandlers } from 'features/project/work/slices/undoSlice';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import eventBus from 'features/shared/lib/eventBus';
import ActionsHelper from 'features/shared/lib/actionsHelper';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Table } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import { ACTIONS_STATE_NAME, GENERATE_STATUS, PANELS_NAME } from 'features/shared/constants';
import AbbreviateConfirmContent from './components/AbbreviateConfirmContent';
import CauseEffectRow from './components/CauseEffectRow';
import './style.scss';

class CauseEffectTable extends Component {
  state = {
    cutData: [],
  };

  mergeItem = null;

  componentDidMount() {
    const { subscribeUndoHandlers } = this.props;
    eventBus.subscribe(this, domainEvents.TESTBASIC_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEvent(message);
    });
    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEvent(message);
    });
    eventBus.subscribe(this, domainEvents.WORK_MENU_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEvent(message);
    });
    subscribeUndoHandlers({
      component: PANELS_NAME.CAUSE_EFFECT_TABLE,
      update: this._updateUndoState,
      undo: this._handleUpdateActions,
    });
  }

  componentWillUnmount() {
    const { unSubscribeUndoHandlers } = this.props;
    eventBus.unsubscribe(this);
    unSubscribeUndoHandlers({ component: PANELS_NAME.CAUSE_EFFECT_TABLE });
  }

  _raiseEvent = (message) => eventBus.publish(domainEvents.CAUSEEFFECT_DOMAINEVENT, message);

  _confirmAbbreviate = (value, similarItem) => {
    const { definition, type } = value;
    const { listData } = this.props;
    const newNode = CauseEffect.createNode(listData, type);

    const confirmModal = window.confirm(
      <AbbreviateConfirmContent
        addDefination={definition}
        addNode={newNode}
        similarDefination={similarItem.definition}
        similarNode={similarItem.node}
      />,
      {
        title: 'Automatic abridged',
        icon: <i className="bi bi-list-stars" />,
        yesAction: () => {
          this._handleAddEvent([value], true);
        },
        noAction: () => {
          this._handleAddEvent([value], false);
        },
      }
    );

    return confirmModal;
  };

  /* Handle events */
  _handleAddEvent = (data, confirmedAbbreviate = undefined) => {
    const { setCauseEffects, listData, generating } = this.props;
    if (generating === GENERATE_STATUS.START || generating === GENERATE_STATUS.SUCCESS) {
      return;
    }
    const result = [];
    let causeEffects = listData.slice();
    this.needConfirm = false;

    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      let parent = null;
      if (data.length === 1) {
        const checkResult = CauseEffect.checkExistOrSimilarity(value, listData, appConfig);
        // if existed
        if (checkResult.similarItem && checkResult.rate > 100) {
          CauseEffect.alertExistItem();
          this._raiseEvent({ action: domainEvents.ACTION.NOTACCEPT, value });
          return;
        }
        // if found similar
        if (checkResult.similarItem) {
          if (confirmedAbbreviate === undefined) {
            this._confirmAbbreviate(value, checkResult.similarItem);
            return;
          }
          parent = confirmedAbbreviate ? checkResult.similarItem : null;
        }
      }
      // create cause/effect item and set id
      const newItem = CauseEffect.generateCauseEffectItem(listData, value, parent);
      newItem.id = uuidv4();
      result.push(newItem);
      causeEffects = causeEffects.concat(newItem);
    }

    this._raiseEvent({ action: domainEvents.ACTION.ADD, value: result });
    setCauseEffects(causeEffects);
  };

  _handleDeleteAction = (item) => {
    const { generating } = this.props;
    if (generating === GENERATE_STATUS.START || generating === GENERATE_STATUS.SUCCESS) {
      return;
    }
    const removeList = this._delete(item);

    if (removeList) {
      removeList.forEach((e) => {
        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: e,
          receivers: [domainEvents.DES.GRAPH, domainEvents.DES.TESTBASIS, domainEvents.DES.TESTDATA],
        });
      });
    }
  };

  _delete = (item) => {
    const { listData, setCauseEffects } = this.props;
    const { definitionId } = item;
    const data = listData.find((x) => x.definitionId === definitionId);
    if (!data) {
      return false;
    }
    // does not remove merged item
    if (data?.isMerged) {
      window.alert(Language.get('cannotremovemergedefinition'));
      return false;
    }

    const { id } = data;
    const newList = [];
    const removeList = [];

    listData.forEach((data) => {
      if (data.id === id || data.parent === id) {
        removeList.push(data);
      } else {
        newList.push(data);
      }
    });

    setCauseEffects(newList);

    return removeList;
  };

  _handleRemoveEvent = (item, storeActions = false) => {
    const removeList = this._delete(item);
    if (removeList) {
      removeList.forEach((e) => {
        const receivers = [domainEvents.DES.GRAPH, domainEvents.DES.TESTDATA];
        if (e.isMerged) {
          receivers.push(domainEvents.DES.TESTBASIS);
        }
        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: e,
          receivers,
          storeActions,
        });
      });
    }
  };

  _handleUpdateEvent = (value) => {
    const { listData, setCauseEffects } = this.props;
    const { definitionId, definition } = value;

    const isBlocked = this._blockModifyWhileGenerating();
    if (isBlocked) {
      return;
    }
    const index = listData.findIndex((e) => e.definitionId === definitionId);

    if (index < 0) {
      return;
    }

    const newItem = { ...listData[index], definition };
    const newList = [...listData];
    newList[index] = newItem;

    setCauseEffects(newList);
    this._raiseEvent({ action: domainEvents.ACTION.UPDATE, value: newItem });
  };

  _handleCutEvent = (eventData) => {
    const { listData: causeEffects } = this.props;
    const cutData = causeEffects.filter((causeEffect) => eventData.some((item) => item === causeEffect.definitionId));
    if (cutData.length > 0) {
      const value = cutData.map((data) => data.node);
      this._raiseEvent({ action: domainEvents.ACTION.CUT, value, receivers: [domainEvents.DES.GRAPH] });
    }
    this.setState({ cutData });
  };

  _handlePasteEvent = () => {
    const { listData: causeEffects, setCauseEffects } = this.props;
    const { cutData } = this.state;
    const newCauseEffects = causeEffects.slice();
    cutData.forEach((data) => {
      const isExists = newCauseEffects.find((causeEffect) => causeEffect.node === data.node);
      if (!isExists) {
        newCauseEffects.push(data);
      }
    });
    setCauseEffects(newCauseEffects);
    this.setState({ cutData: [] });
    this._raiseEvent({ action: domainEvents.ACTION.PASTE, receivers: [domainEvents.DES.GRAPH] });
  };

  _handleEvent = (message) => {
    const { action, value, receivers, storeActions } = message;
    if (receivers === undefined || receivers.includes(domainEvents.DES.CAUSEEFFECT)) {
      switch (action) {
        case domainEvents.ACTION.ADD:
          this._handleAddEvent(value);
          break;
        case domainEvents.ACTION.CUT:
          this._handleCutEvent(value);
          break;
        case domainEvents.ACTION.PASTE:
          this._handlePasteEvent();
          break;
        case domainEvents.ACTION.UPDATE:
          this._handleUpdateEvent(value);
          break;
        case domainEvents.ACTION.REMOVE:
          this._handleRemoveEvent(value, storeActions);
          break;
        case domainEvents.ACTION.ACCEPTDELETE:
          this._handleAcceptDeleteEvent(value, storeActions);
          break;
        default:
          break;
      }
    }
  };

  _handleAcceptDeleteEvent = (items, storeActions = false) => {
    const { listData, setCauseEffects } = this.props;
    // get causeEffect need remove
    let removedcauseEffects = listData.filter((x) =>
      items.some(
        (item) => item.nodeId === x.node && (!this.mergeItem || (this.mergeItem && item.nodeId !== this.mergeItem.node))
      )
    );

    // get causeEffect need remove include merged causeEffect;
    removedcauseEffects = listData.filter((x) =>
      removedcauseEffects.some(
        (removedcauseEffect) => removedcauseEffect.id === x.parent || removedcauseEffect.id === x.id
      )
    );
    const newListData = listData.filter(
      (x) => !removedcauseEffects.some((removedcauseEffect) => removedcauseEffect === x)
    );

    if (newListData.length !== listData.length) {
      setCauseEffects(newListData);

      removedcauseEffects.forEach((removedcauseEffect) => {
        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: removedcauseEffect,
          receivers: [domainEvents.DES.TESTBASIS, domainEvents.DES.TESTDATA],
          storeActions,
        });
      });
    }
  };

  _handleMerge = (mergeId, parentId) => {
    const { listData, setCauseEffects } = this.props;

    const isBlocked = this._blockModifyWhileGenerating();
    if (isBlocked) {
      return;
    }

    const mergeItem = listData.find((x) => x.id === mergeId);
    const parentItem = listData.find((x) => x.id === parentId);

    this.mergeItem = mergeItem;

    if (mergeItem && parentItem && mergeItem.type === parentItem.type && !parentItem.isMerged) {
      const newListData = [...listData];
      const mergeIndex = newListData.findIndex((x) => x.id === mergeItem.id);

      if (mergeIndex > -1) {
        newListData.forEach((x, index) => {
          if (x.isMerged && x.parent === mergeItem.id) {
            newListData[index] = { ...x, id: uuidv4(), isMerged: true, parent: parentItem.id };
          }
        });

        const newItem = { ...mergeItem, id: uuidv4(), isMerged: true, parent: parentItem.id };

        newListData[mergeIndex] = newItem;
        setCauseEffects(newListData);

        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: mergeItem,
          receivers: [domainEvents.DES.GRAPH, domainEvents.DES.TESTDATA],
        });

        const alertContent = Language.get('abridgealert')
          .replace(/mergeNode/g, mergeItem.node)
          .replace(/parentNode/g, parentItem.node);

        alert(alertContent, { info: true });
      }

      this.mergeItem = null;
    }
  };

  handleUnabridge = (id) => {
    const { listData, setCauseEffects } = this.props;
    const index = listData.findIndex((x) => x.id === id);

    const isBlocked = this._blockModifyWhileGenerating();
    if (isBlocked) {
      return;
    }

    if (index !== -1 && listData[index].isMerged) {
      const newItem = { ...listData[index], isMerged: false };
      const newListData = [...listData];

      newListData[index] = newItem;
      setCauseEffects(newListData);

      this._raiseEvent({
        action: domainEvents.ACTION.ADD,
        value: [newItem],
        receivers: [domainEvents.DES.TESTDATA],
      });
    }
  };

  handleEditNode = (id, newNode) => {
    const { listData, setCauseEffects } = this.props;

    const isBlocked = this._blockModifyWhileGenerating();
    if (isBlocked) {
      return;
    }

    if (listData.find((x) => x.node === newNode)) {
      const alertContent = Language.get('exitednodealert').replace(/newNode/g, newNode);

      alert(alertContent, { error: true });

      return;
    }

    const index = listData.findIndex((x) => x.id === id);

    if (index !== -1) {
      const oldNode = listData[index].node;
      const newItem = { ...listData[index], node: newNode };
      const newListData = [...listData];

      newListData[index] = newItem;
      setCauseEffects(newListData);

      this._raiseEvent({
        action: domainEvents.ACTION.CHANGE_NODE_ID,
        value: { oldNode, newNode },
        receivers: [domainEvents.DES.TESTDATA, domainEvents.DES.GRAPH],
      });
    }
  };

  handleReorder = (...arg) => {
    const { listData, setCauseEffects } = this.props;
    setCauseEffects(CauseEffect.reorder(listData, ...arg));
  };
  /* End handle events */

  /* Undo/Redo Actions */
  _updateUndoState = (newState) => {
    const { listData, generating } = this.props;
    if (generating !== GENERATE_STATUS.START || generating !== GENERATE_STATUS.SUCCESS) {
      return ActionsHelper.updateUndoState(newState, ACTIONS_STATE_NAME.CAUSEEFFECT_TABLE, listData);
    }
    return null;
  };

  _handleUpdateActions = (currentState) => {
    const { setCauseEffects } = this.props;
    const currentCauseEffectTable = currentState.causeEffectTable;
    setCauseEffects(currentCauseEffectTable);
  };
  /* End Undo/Redo Actions */

  _blockModifyWhileGenerating() {
    const { generating } = this.props;
    if (generating === GENERATE_STATUS.START || generating === GENERATE_STATUS.SUCCESS) {
      return true;
    }
    return false;
  }

  render() {
    const { listData } = this.props;
    const rows = CauseEffect.generateData(listData);

    return (
      <Table bordered size="sm" className="border-bottom cause-effect-table">
        <thead className="bg-transparent">
          <tr className="text-primary font-weight-bold">
            <td className="text-right">{Language.get('id')}</td>
            <td>{Language.get('definition')}</td>
            <td> {Language.get('abridged')}</td>
          </tr>
        </thead>

        <tbody>
          {rows.map((item) => (
            <CauseEffectRow
              key={item.id}
              data={item}
              onDelete={this._handleDeleteAction}
              onMerge={this._handleMerge}
              onUnabridge={this.handleUnabridge}
              onEditNode={this.handleEditNode}
              onReorder={this.handleReorder}
              isBlocked={this._blockModifyWhileGenerating}
            />
          ))}
        </tbody>
      </Table>
    );
  }
}

CauseEffectTable.propTypes = {
  setCauseEffects: PropTypes.func.isRequired,
  listData: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  subscribeUndoHandlers: PropTypes.func.isRequired,
  unSubscribeUndoHandlers: PropTypes.func.isRequired,
  generating: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  listData: state.work.causeEffects,
  generating: state.work.generating,
});
const mapDispatchToProps = { setCauseEffects, subscribeUndoHandlers, unSubscribeUndoHandlers };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(CauseEffectTable));
