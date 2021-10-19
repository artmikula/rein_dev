import CauseEffect from 'features/project/work/biz/CauseEffect';
import { setCauseEffects } from 'features/project/work/slices/workSlice';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import eventBus from 'features/shared/lib/eventBus';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Table } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import AbbreviateConfirmContent from './components/AbbreviateConfirmContent';
import CauseEffectRow from './components/CauseEffectRow';
import './style.scss';

class CauseEffectTable extends Component {
  mergeItem = null;

  componentDidMount() {
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
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
  }

  _raiseEvent = (message) => eventBus.publish(domainEvents.CAUSEEFFECT_DOMAINEVENT, message);

  _confirmAbbreviate = (value, similarItem) => {
    const { definition, type } = value;
    const { listData } = this.props;
    const newNode = CauseEffect.createNode(listData, type);

    return confirm(
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
          this._handleAddEvent(value, true);
        },
        noAction: () => {
          this._handleAddEvent(value, false);
        },
      }
    );
  };

  /* Handle event */
  _handleAddEvent = async (value, confirmedAbbreviate = undefined) => {
    const { listData, setCauseEffects } = this.props;

    let parent = null;
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
    // create cause/effect item and set id
    const newItem = CauseEffect.generateCauseEffectItem(listData, value, parent);
    newItem.id = uuidv4();

    setCauseEffects([...listData, newItem]);
    this._raiseEvent({ action: domainEvents.ACTION.ADD, value: newItem });
  };

  _handleDeleteAction = (item) => {
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

  _handleRemoveEvent = (item) => {
    const removeList = this._delete(item);
    if (removeList) {
      removeList.forEach((e) => {
        const receivers = [domainEvents.DES.GRAPH, domainEvents.DES.TESTDATA];
        if (e.isMerged) {
          receivers.push(domainEvents.DES.TESTBASIS);
        }
        this._raiseEvent({ action: domainEvents.ACTION.ACCEPTDELETE, value: e, receivers });
      });
    }
  };

  _handleUpdateEvent = (value) => {
    const { listData, setCauseEffects } = this.props;
    const { definitionId, definition } = value;
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

  _handleWorkMenuEvent = () => {
    const { listData } = this.props;
    const value = CauseEffect.generateReportData(listData);
    this._raiseEvent({
      action: domainEvents.ACTION.REPORTWORK,
      value,
      receivers: [domainEvents.DES.WORKMENU],
    });
  };

  _handleEvent = (message) => {
    const { action, value, receivers } = message;
    if (receivers === undefined || receivers.includes(domainEvents.DES.CAUSEEFFECT)) {
      switch (action) {
        case domainEvents.ACTION.ADD:
          this._handleAddEvent(value);
          break;
        case domainEvents.ACTION.UPDATE:
          this._handleUpdateEvent(value);
          break;
        case domainEvents.ACTION.REMOVE:
          this._handleRemoveEvent(value);
          break;
        case domainEvents.ACTION.ACCEPTDELETE:
          this._handleAcceptDeleteEvent(value);
          break;
        case domainEvents.ACTION.REPORTWORK:
          this._handleWorkMenuEvent();
          break;
        default:
          break;
      }
    }
  };

  _handleAcceptDeleteEvent = (items) => {
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
        });
      });
    }
  };

  _handleMerge = (result) => {
    if (result.combine) {
      const { listData, setCauseEffects } = this.props;
      const { combine, draggableId } = result;

      const mergeItem = listData.find((x) => x.id === draggableId);
      const parentItem = listData.find((x) => x.id === combine.draggableId);

      this.mergeItem = mergeItem;

      if (mergeItem && parentItem && mergeItem.type === parentItem.type) {
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

          this._raiseEvent({
            action: domainEvents.ACTION.ADD,
            value: newItem,
            receivers: [domainEvents.DES.TESTDATA],
          });
        }

        this.mergeItem = null;
      }
    }
  };

  /* End handle event */
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

        <DragDropContext onDragEnd={this._handleMerge}>
          <Droppable droppableId="list" isCombineEnabled>
            {(provided) => (
              <tbody ref={provided.innerRef} {...provided.droppableProps}>
                {rows.map((item, i) => (
                  <CauseEffectRow key={item.id} index={i} data={item} onDelete={this._handleDeleteAction} />
                ))}
                {provided.placeholder}
              </tbody>
            )}
          </Droppable>
        </DragDropContext>
      </Table>
    );
  }
}

CauseEffectTable.propTypes = {
  setCauseEffects: PropTypes.func.isRequired,
  listData: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const mapStateToProps = (state) => ({ listData: state.work.causeEffects });
const mapDispatchToProps = { setCauseEffects };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(CauseEffectTable));
