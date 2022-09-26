import { OPTION_TYPE } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import React, { forwardRef, useState } from 'react';
import General from '../General';
import Graph from '../Graph';
import TestScenarioAndCase from '../TestScenarioAndCase';
import SentenceSimilarityCheck from '../SentenceSimilarityCheck';
import '../style.scss';
import TestCoverage from '../TestCoverage';
import TestData from '../TestData';
import Option from './Option';

const options = [
  { type: OPTION_TYPE.GENERAL, text: Language.get('general'), component: General },
  { type: OPTION_TYPE.GRAPH, text: Language.get('graph'), component: Graph },
  {
    type: OPTION_TYPE.TEST_SCENARIO_AND_CASE,
    text: Language.get('testscenarioandcase'),
    component: TestScenarioAndCase,
  },
  { type: OPTION_TYPE.TEST_DATA, text: Language.get('testdata'), component: TestData },
  {
    type: OPTION_TYPE.SENTENCE_SIMILARITY,
    text: Language.get('sentencesimilaritycheck'),
    component: SentenceSimilarityCheck,
  },
  { type: OPTION_TYPE.TEST_COVERAGE, text: Language.get('testcoverage'), component: TestCoverage },
];

function OptionsManager(props, ref) {
  // eslint-disable-next-line react/prop-types
  const { type } = props;
  const [selectedType, setSelectedType] = useState(type);
  const Component = options.find((x) => x.type === selectedType).component;

  return (
    <div className="d-flex options-content">
      <div className="options-left-content h-100 overflow-auto small">
        {options.map((option) => (
          <Option
            text={option.text}
            key={option.type}
            selected={selectedType === option.type}
            onClick={() => setSelectedType(option.type)}
          />
        ))}
      </div>
      <div className="options-right-content p-3 h-100 overflow-auto">
        <Component ref={ref} />
      </div>
    </div>
  );
}

export default forwardRef(OptionsManager);
