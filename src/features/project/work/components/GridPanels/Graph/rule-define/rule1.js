import { twoCauseDefinitionDoNotHasASameExclusive } from './common';

function rule1(currentNode, graphData) {
  const appliedDefinitions = new Set(['SAG', 'SWELL']);

  return twoCauseDefinitionDoNotHasASameExclusive(currentNode, graphData, appliedDefinitions);
}

export default rule1;
