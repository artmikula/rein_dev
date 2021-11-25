import { twoCauseDefinitionDoNotHasASameExclusive } from './common';

function rule2(currentNode, graphData) {
  const appliedDefinitions = new Set(['SAG', 'INTERRUPTION']);

  return twoCauseDefinitionDoNotHasASameExclusive(currentNode, graphData, appliedDefinitions);
}

export default rule2;
