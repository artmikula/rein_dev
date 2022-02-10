import Language from 'features/shared/languages/Language';
import appConfig, { defaultOption } from 'features/shared/lib/appConfig';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import InputNumber from '../../InputNumber';
import Constraint from './components/Constraint';
import GraphNode from './components/GraphNode';
import IsRelation from './components/IsRelation';
import NotRelation from './components/NotRelation';

function Graph(props, ref) {
  const [data, setData] = useState(appConfig.graph);
  const {
    nodeSize,
    causeColor,
    effectColor,
    groupColor,
    errorColor,
    lineWidth,
    isRelationColor,
    constraintColor,
    notRelationColor,
  } = data;

  const _handleOptionChange = (key, value) => {
    setData({ ...data, [key]: value });
  };

  const getData = () => ({
    key: 'graph',
    value: JSON.parse(JSON.stringify(data)),
  });

  // public for OptionManager reset button call
  const reset = () => {
    setData(defaultOption.graph);
    return {
      key: 'graph',
      value: JSON.parse(JSON.stringify(defaultOption.graph)),
    };
  };

  useImperativeHandle(ref, () => ({ getData, reset }));

  useEffect(() => {
    if (appConfig.graph) {
      setData(appConfig.graph);
    }
  }, []);

  return (
    <div className="d-flex flex-column align-items-center">
      <div className="d-flex flex-wrap text-center">
        <div className="mx-1 mx-md-4">
          <GraphNode color={causeColor} text="C1" size={nodeSize} />
          <p className="mt-1">Cause</p>
        </div>
        <div className="mx-1 mx-md-4">
          <GraphNode color={effectColor} text="E1" size={nodeSize} />
          <p className="mt-1">Effect</p>
        </div>
        <div className="mx-1 mx-md-4">
          <GraphNode color={groupColor} text="G1" size={nodeSize} stroked strokeWidth={lineWidth} />
          <p className="mt-1">Group</p>
        </div>
        <div className="mx-1 mx-md-4">
          <GraphNode color={errorColor} text="C1" size={nodeSize} />
          <p className="mt-1">Error</p>
        </div>
      </div>
      <div className="d-flex my-4">
        <div className="d-flex align-items-center mr-4">
          <span className="mr-2">{Language.get('nodesize')}</span>
          <InputNumber
            min={30}
            value={nodeSize}
            onChange={(value) => {
              _handleOptionChange('nodeSize', value);
            }}
          />
        </div>
        <div className="d-flex align-items-center">
          <span className="mr-2">{Language.get('linewidth')}</span>
          <InputNumber
            min={1}
            max={Math.floor(nodeSize / 4)}
            value={lineWidth}
            onChange={(value) => {
              _handleOptionChange('lineWidth', value);
            }}
          />
        </div>
      </div>
      <div className="small">
        <div className="d-flex flex-wrap align-items-center">
          <span style={{ minWidth: 90 }}>{Language.get('isrelation')}</span>
          <IsRelation size={lineWidth} color={isRelationColor} width={200} />
        </div>
        <div className="d-flex flex-wrap align-items-center pt-2">
          <span style={{ minWidth: 90 }}>{Language.get('notrelation')}</span>
          <NotRelation size={lineWidth} color={notRelationColor} width={200} />
        </div>
        <div className="d-flex flex-wrap align-items-center pt-2">
          <span style={{ minWidth: 90 }}>{Language.get('constraint')}</span>
          <Constraint size={lineWidth} color={constraintColor} width={200} />
        </div>
      </div>
    </div>
  );
}

export default forwardRef(Graph);
