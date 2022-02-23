import { GRAPH_LINK_TYPE, NODE_INSPECTION } from 'features/shared/constants';
import Enumerable from 'linq';

class Constraint {
  validate(constraint, scenario) {
    switch (constraint.type) {
      case GRAPH_LINK_TYPE.EXCLUSIVE:
        if (!this._validateExclusive(scenario, constraint)) {
          return NODE_INSPECTION.EConstraintViolation;
        }
        break;
      case GRAPH_LINK_TYPE.INCLUSIVE:
        if (!this._validateInclusive(scenario, constraint)) {
          return NODE_INSPECTION.IConstraintViolation;
        }
        break;
      case GRAPH_LINK_TYPE.REQUIRE:
        if (!this._validateRequire(scenario, constraint)) {
          return NODE_INSPECTION.RConstraintViolation;
        }
        break;
      case GRAPH_LINK_TYPE.ONLYONE:
        if (!this._validateOnlyOne(scenario, constraint)) {
          return NODE_INSPECTION.OConstraintViolation;
        }
        break;
      case GRAPH_LINK_TYPE.MASK:
        if (!this._validateMask(scenario, constraint)) {
          return NODE_INSPECTION.MConstraintViolation;
        }
        break;
      default:
        return NODE_INSPECTION.None;
    }

    return NODE_INSPECTION.None;
  }

  _validateRequire(scenario, constraint) {
    const source = constraint.nodes[0];
    const target = constraint.nodes[1];
    const assertionTargetResult = scenario.testAssertions.find((x) => x.graphNode.id === target.graphNodeId);
    const assertionSourceResult = scenario.testAssertions.find((x) => x.graphNode.id === source.graphNodeId);
    return (
      assertionTargetResult &&
      (assertionTargetResult.result || (assertionSourceResult && !assertionSourceResult.result))
    );
  }

  _validateMask() {
    return true;
  }

  _validateInclusive(scenario, constraint) {
    const trueCount = Enumerable.from(constraint.nodes).count((x) =>
      scenario.testAssertions.some((y) => y.graphNode.id === x.graphNodeId && y.result === !x.isNotRelation)
    );

    return trueCount >= 1;
  }

  _validateExclusive(scenario, constraint) {
    const trueCount = Enumerable.from(constraint.nodes).count((x) =>
      scenario.testAssertions.some((y) => y.graphNode.id === x.graphNodeId && y.result === !x.isNotRelation)
    );

    return trueCount <= 1;
  }

  _validateOnlyOne(scenario, constraint) {
    let trueCount = 0;
    const { nodes } = constraint;
    for (let i = 0; i < nodes.length; i++) {
      const assertionResult = scenario.testAssertions.find((x) => x.graphNode.id === nodes[i].graphNodeId);
      if (assertionResult) {
        if (assertionResult.result === nodes[i].isNotRelation) {
          trueCount++;
          if (trueCount > 1) {
            return false;
          }
        }
      }
    }

    return trueCount === 1;
  }
}

export default new Constraint();
