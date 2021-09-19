import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import {
  Editor,
  EditorState,
  RichUtils,
  CompositeDecorator,
  getVisibleSelectionRect,
  convertToRaw,
  convertFromRaw,
  Modifier,
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash.debounce';
import TestBasisManager from 'features/project/work/biz/TestBasis';
import domainEvents from 'features/shared/domainEvents';
import eventBus from 'features/shared/lib/eventBus';
import testBasisService from 'features/project/work/services/testBasisService';
import { STRING, CLASSIFY } from 'features/shared/constants';
import GlobalContext from 'security/GlobalContext';
import DecoratedText from './DecoratedText';
import ClassifyPopover from './ClassifyPopover';
import StyleControlEditor from './StyleControlEditor';

class TestBasis extends Component {
  constructor(props) {
    super(props);
    this._selectedText = {};
    this._isFocusEditor = false;
    this.state = {
      isOpenClassifyPopover: false,
      editorState: EditorState.createEmpty(this._compositeDecorator()),
      selectionState: {},
      ready: false,
    };
  }

  async componentDidMount() {
    await this._getTestBasis();
    eventBus.subscribe(this, domainEvents.CAUSEEFFECT_ONCHANGE_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEventBus(message);
    });
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
  }

  _saveTestBasis = (newEditorState) => {
    const { editorState } = this.state;
    const currentEditor = newEditorState || editorState;
    const drawContentState = convertToRaw(currentEditor.getCurrentContent());
    TestBasisManager.set(drawContentState);
    this._createUpdateTestBasis(JSON.stringify(drawContentState));
  };

  _findEntities = (contentBlock, callback, contentState) => {
    contentBlock.findEntityRanges((character) => {
      const entityKey = character.getEntity();
      return entityKey !== null && contentState.getEntity(entityKey).getType() === STRING.DEFINITION;
    }, callback);
  };

  _compositeDecorator = () =>
    new CompositeDecorator([
      {
        strategy: this._findEntities,
        component: (props) => {
          const { decoratedText, contentState, entityKey } = props;
          const entityData = contentState.getEntity(entityKey).getData();
          const newEntityData = { ...entityData, definition: decoratedText };
          const { type, definition } = entityData;
          // update definition
          if (definition !== decoratedText) {
            this._raiseEventBus(domainEvents.ACTION.UPDATE, newEntityData);
            contentState.mergeEntityData(entityKey, newEntityData);
          }
          return <DecoratedText {...props} type={type} />;
        },
      },
    ]);

  _updateTextDecorators = (drawContent) => {
    let newEditorState;
    if (drawContent) {
      newEditorState = EditorState.createWithContent(convertFromRaw(drawContent));
    }
    this.setState((state) => ({
      isOpenClassifyPopover: false,
      editorState: EditorState.set(newEditorState || state.editorState, {
        decorator: this._compositeDecorator(),
      }),
    }));
  };

  _createUpdateTestBasis = debounce((content) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { getToken } = this.context;
    return testBasisService.createUpdateAsync(getToken(), projectId, workId, { content });
  }, 500);

  _getTestBasis = async () => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { getToken } = this.context;
    const result = await testBasisService.getAsync(getToken(), projectId, workId);
    if (result.data) {
      const { content } = result.data;
      const drawContent = JSON.parse(content);
      this._updateTextDecorators(drawContent);
      TestBasisManager.set(drawContent);
    }
    setTimeout(() => {
      this.setState({ ready: true });
    }, 500);
  };

  _removeCauseEffect = (definitionId) => {
    const { ready } = this.state;
    if (ready) {
      const drawContentState = TestBasisManager.removeEntity(definitionId);
      this._updateTextDecorators(drawContentState);
      this._saveTestBasis();
    }
  };

  /* Events */
  _handleEventBus = async (message) => {
    const { action, type, value, receivers } = message;
    if (receivers === undefined || receivers.includes(domainEvents.DES.TESTBASIS)) {
      if (action === domainEvents.ACTION.ACCEPTDELETE) {
        this._removeCauseEffect(value.definitionId);
      }
      if (action === domainEvents.ACTION.NOTACCEPT) {
        /*
         * - handle not accepted when add,update or remove,
         * - You can add more data to the message if needed, sample type of action which is not accepted
         */
      }
    }
  };

  _raiseEventBus = (action, value) => {
    let eventName = domainEvents.TESTBASIC_CLASSIFYASEFFECT_DOMAINEVENT;
    if (value.type === CLASSIFY.CAUSE) {
      eventName = domainEvents.TESTBASIC_CLASSIFYASCAUSE_DOMAINEVENT;
    }
    eventBus.publish(eventName, { action, value });
  };
  /* End event */

  /* Action */
  _handleChange = (newEditorState) => {
    const { ready, editorState } = this.state;
    if (!ready) {
      return;
    }
    const selectionState = newEditorState.getSelection();
    const isCollapsed = selectionState.isCollapsed();
    const currentAnchorKey = selectionState.getAnchorKey();
    const currentContent = newEditorState.getCurrentContent();
    const currentContentBlock = currentContent.getBlockForKey(currentAnchorKey);
    const start = selectionState.getStartOffset();
    const end = selectionState.getEndOffset();
    const currentPlainText = currentContent.getPlainText();
    let selectedText = currentContentBlock.getText().slice(start, end);
    const drawContent = convertToRaw(currentContent);
    const prevContent = editorState.getCurrentContent();
    const prevPlainText = prevContent.getPlainText();
    // select new definition
    if (!isCollapsed) {
      this._selectedText = { definition: selectedText };
    }
    if (this._isFocusEditor) {
      this._isFocusEditor = false;
      this.setState({ isOpenClassifyPopover: false });
      return;
    }
    // check is selected exist definition
    const existDefinition = TestBasisManager.getEntity(selectedText, currentAnchorKey, start, end);
    if (existDefinition) {
      this._selectedText = existDefinition;
    } else {
      selectedText = '';
      this._selectedText = {};
    }
    if (currentPlainText.length !== prevPlainText.length) {
      // check if delete definition
      const removedEntities = TestBasisManager.findRemovedEntities(drawContent);
      removedEntities.forEach((item) => {
        this._raiseEventBus(domainEvents.ACTION.REMOVE, { ...item });
      });
      this._saveTestBasis(newEditorState);
    }
    this.setState({
      editorState: newEditorState,
      selectionState,
      isOpenClassifyPopover: selectedText.length > 0,
    });
  };

  _handleFocus = () => {
    const { ready } = this.state;
    if (ready) {
      this._isFocusEditor = true;
    }
  };

  _handleKeyCommand = (command, editorState) => {
    const { ready } = this.state;
    if (ready) {
      const newState = RichUtils.handleKeyCommand(editorState, command);
      if (newState) {
        this._handleChange(newState);
        return 'handled';
      }
    }
    return 'not-handled';
  };

  _toggleInlineStyle = (inlineStyle) => {
    const { editorState, ready } = this.state;
    if (ready) {
      this._handleChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    }
  };

  _toggleBlockType = (blockType) => {
    const { editorState, ready } = this.state;
    if (ready) {
      this._handleChange(RichUtils.toggleBlockType(editorState, blockType));
    }
  };

  _addCauseEffect = async (data) => {
    const { editorState, selectionState, ready } = this.state;
    if (ready) {
      const contentState = editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity(STRING.DEFINITION, 'MUTABLE', data);
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const contentStateWithLink = Modifier.applyEntity(contentStateWithEntity, selectionState, entityKey);
      const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithLink });
      await this.setState({ editorState: newEditorState, selectionState: {}, isOpenClassifyPopover: false });
      this._updateTextDecorators();
      this._saveTestBasis(newEditorState);
    }
  };

  _classifyText = async (currentType) => {
    const { ready } = this.state;
    const { type: previousType } = this._selectedText;
    if (!ready || previousType === currentType) {
      return;
    }
    if (previousType) {
      this._raiseEventBus(domainEvents.ACTION.REMOVE, { ...this._selectedText, type: previousType });
    }
    if (currentType) {
      const definitionId = uuidv4();
      await this._addCauseEffect({ ...this._selectedText, type: currentType, definitionId });
      this._raiseEventBus(domainEvents.ACTION.ADD, { ...this._selectedText, type: currentType, definitionId });
    }
  };
  /* End Action */

  render() {
    const { editorState, isOpenClassifyPopover } = this.state;
    const visibleSelectionRect = getVisibleSelectionRect(window);

    return (
      <div className="h-100 p-4">
        <StyleControlEditor
          editorState={editorState}
          onToggleBlockType={this._toggleBlockType}
          onToggleInlineStyle={this._toggleInlineStyle}
        />
        <Editor
          placeholder="Type test basis here ..."
          spellCheck
          editorState={editorState}
          handleKeyCommand={this._handleKeyCommand}
          onChange={this._handleChange}
          onFocus={this._handleFocus}
        />
        <ClassifyPopover
          isOpen={isOpenClassifyPopover}
          visibleSelectionRect={visibleSelectionRect}
          onClickItem={this._classifyText}
        />
      </div>
    );
  }
}
TestBasis.propTypes = {
  match: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.bool])).isRequired,
  decoratedText: PropTypes.string,
  entityKey: PropTypes.string,
};
TestBasis.defaultProps = {
  decoratedText: undefined,
  entityKey: undefined,
};

TestBasis.contextType = GlobalContext;

export default withRouter(TestBasis);
