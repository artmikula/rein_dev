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
    const assertionSource = scenario.testAssertions.find((x) => x.graphNodeId === source.graphNodeId);
    const assertionTarget = scenario.testAssertions.find((x) => x.graphNodeId === target.graphNodeId);

    if (
      assertionSource &&
      assertionTarget &&
      assertionSource.result &&
      assertionSource.result !== assertionTarget.result
    ) {
      return false;
    }

    return true;
  }

  _validateMask() {
    return true;
  }

  _validateInclusive(scenario, constraint) {
    const trueCount = Enumerable.from(constraint.nodes).count((x) =>
      scenario.testAssertions.some((y) => y.graphNodeId === x.graphNodeId && y.result)
    );

    return trueCount >= 1 || scenario.testAssertions.length < 2;
  }

  _validateExclusive(scenario, constraint) {
    const trueCount = Enumerable.from(constraint.nodes).count((x) =>
      scenario.testAssertions.some((y) => y.graphNodeId === x.graphNodeId && y.result)
    );

    return trueCount <= 1;
  }

  _validateOnlyOne(scenario, constraint) {
    let trueCount = 0;
    let falseCount = 0;
    const { nodes } = constraint;

    for (let i = 0; i < nodes.length; i++) {
      const assertionResult = scenario.testAssertions.find((x) => x.graphNodeId === nodes[i].graphNodeId);

      if (assertionResult && assertionResult.result) {
        trueCount++;
        if (trueCount > 1) {
          return false;
        }
      }

      if (assertionResult && !assertionResult.result) {
        falseCount++;
        if (falseCount > 1) {
          return false;
        }
      }
    }

    return true;
  }
}

export default new Constraint();
