/* eslint-disable max-lines */
import Enumerable from 'linq';
import { CONSTRAINT_TYPE, EXPRESSION_TYPE, GRAPH_NODE_TYPE, OPERATOR_TYPE } from 'features/shared/constants';
import CauseEffect from './CauseEffect';
import TestScenarioHelper from './TestScenario/TestScenarioHelper';
import DNFLogicCoverage from './TestScenario/TestScenarioMethodGenerate/DNFLogicCoverage';

class SSMetric {
  constructor() {
    this.graphLinks = [];
    this.graphNodes = [];
    this.causeNodes = [];
    this.effectNodes = [];
    this.groupNodes = [];
    this.constraints = [];
    this.causeEffects = [];
  }

  initValue(graphNodes = [], graphLinks = [], constraint = [], causeEffects = []) {
    this.graphNodes = graphNodes;
    this.graphLinks = graphLinks;
    this.causeEffects = causeEffects;
    this.constraints = constraint;
    this.causeNodes = [...graphNodes.filter((x) => x.type === GRAPH_NODE_TYPE.CAUSE)];
    this.effectNodes = [...graphNodes.filter((x) => x.type === GRAPH_NODE_TYPE.EFFECT)];
    this.groupNodes = [...graphNodes.filter((x) => x.type === GRAPH_NODE_TYPE.GROUP)];
  }

  calculateEfferent() {
    const causeConnections = Enumerable.from(this.graphLinks)
      .where((x) => x.source.type === GRAPH_NODE_TYPE.CAUSE)
      .groupBy((x) => x.source.id)
      .toDictionary(
        (l) => l.key(),
        (g) => g.count()
      )
      .toEnumerable();
    let total = 0;
    causeConnections.forEach((x) => {
      total += x.value;
    });
    if (total === 0) {
      return 0;
    }
    let weightedAverage = 0;
    causeConnections.forEach((x) => {
      weightedAverage += (x.value / 10) * (x.value / total);
    });
    weightedAverage = weightedAverage > 1 ? 1 : weightedAverage;

    return weightedAverage.toFixed(2);
  }

  calculateConstraints() {
    const causeNodeCount = this.causeNodes.length;
    const effectNodeCount = this.effectNodes.length;

    const exclusiveCount = this.constraints.filter((x) => x.type === CONSTRAINT_TYPE.EXCLUSIVE).length;
    const exclusive = this._calculatePercent(causeNodeCount, exclusiveCount);

    const inclusiveCount = this.constraints.filter((x) => x.type === CONSTRAINT_TYPE.INCLUSIVE).length;
    const inclusive = this._calculatePercent(causeNodeCount, inclusiveCount);

    const onlyOneCount = this.constraints.filter((x) => x.type === CONSTRAINT_TYPE.ONLYONE).length;
    const onlyOne = this._calculatePercent(causeNodeCount, onlyOneCount);

    const requireCount = this.constraints.filter((x) => x.type === CONSTRAINT_TYPE.REQUIRE).length;
    const require = this._calculatePercent(causeNodeCount, requireCount);

    const maskCount = this.constraints.filter((x) => x.type === CONSTRAINT_TYPE.EXCLUSIVE).length;
    const mask = this._calculatePercent(effectNodeCount, maskCount);

    return { exclusive, inclusive, onlyOne, require, mask };
  }

  calculateNodesPercentage() {
    let abridged = 0;
    let duplication = 0;
    const duplicationRate = 0.9;
    if (this.graphNodes.length > 0) {
      const allNodesCount = this.graphNodes.length;
      const abridgedNodes = this.causeEffects.filter((x) => x.isMerged);
      const abridgedNodesCount = abridgedNodes.length;
      const totalNodesCount = allNodesCount + abridgedNodesCount;

      // abridged
      abridged = totalNodesCount > 0 ? abridgedNodesCount / totalNodesCount : 0;

      // duplication
      const duplicatedNodeCount = abridgedNodes.filter((x) => {
        const parentDefinition = this.causeEffects.find((y) => y.id === x.parent).definition;

        return CauseEffect.calculateSentenceSimilarity(parentDefinition, x.definition) >= duplicationRate;
      }).length;

      duplication = abridgedNodesCount > 0 ? duplicatedNodeCount / abridgedNodesCount : 0;
    }

    return { abridged: abridged.toFixed(2), duplication: duplication.toFixed(2) };
  }

  _calculatePercent(total, constraintCount) {
    if (total <= 0) {
      return 0;
    }
    let result = 0.0;
    result = constraintCount !== 0 ? constraintCount / total : 0;
    result = result > 1 ? 1 : result;

    return result.toFixed(2);
  }

  countNodes() {
    let sameSoundAmbiguity = 0;
    let sameMeaningAmbiguity = 0;

    const sameSoundAmbiguityRate = 0.1;
    const sameMeaningAmbiguityRate = 0.9;

    const calculatedNodes = [];
    for (let i = 0; i < this.graphNodes.length; i++) {
      calculatedNodes.push(this.graphNodes[i]);
      sameSoundAmbiguity += this.graphNodes.filter(
        (x) =>
          !calculatedNodes.some((y) => x.id === y.id) &&
          CauseEffect.calculateSentenceSimilarity(x.definition, this.graphNodes[i].definition) <= sameSoundAmbiguityRate
      ).length;

      sameMeaningAmbiguity += this.graphNodes.filter(
        (x) =>
          !calculatedNodes.some((y) => x.id === y.id) &&
          CauseEffect.calculateSentenceSimilarity(x.definition, this.graphNodes[i].definition) >=
            sameMeaningAmbiguityRate
      ).length;
    }

    return { sameSoundAmbiguity, sameMeaningAmbiguity };
  }

  countLinkedNodes() {
    // Orphan Node
    const orphanNode = this.graphNodes.filter(
      (x) => !this.graphLinks.some((y) => y.source.id === x.id || y.target.id === x.id)
    ).length;

    // Arc Level
    const linkedNodes = [];
    for (let i = 0; i < this.graphLinks.length; i++) {
      if (!linkedNodes.some((x) => x.id === this.graphLinks[i].source.id)) {
        linkedNodes.push(this.graphLinks[i].source);
      }

      if (!linkedNodes.some((x) => x.id === this.graphLinks[i].target.id)) {
        linkedNodes.push(this.graphLinks[i].target);
      }
    }

    const singleTypeLinkedNodes = linkedNodes.filter(
      (x) =>
        Enumerable.from(this.graphLinks)
          .where((y) => y.source.id === x.id || y.target.id === x.id)
          .select((y) => y.isNotRelation)
          .distinct()
          .count() === 1
    );

    const arcLevel = singleTypeLinkedNodes.length;

    return { orphanNode, arcLevel };
  }

  calculateBrevity(testScenarios = []) {
    const testScenarioTableColumnCount = this.graphNodes.filter(
      (x) => x.type === GRAPH_NODE_TYPE.CAUSE || x.type === GRAPH_NODE_TYPE.GROUP
    ).length;
    const assertionCount = Enumerable.from(testScenarios)
      .selectMany((x) => x.testAssertions)
      .count();
    const testScenarioCount = testScenarios.length;
    const totalCells = testScenarioCount * testScenarioTableColumnCount;
    const blankCells = totalCells - assertionCount;
    const brevity = totalCells > 0 ? blankCells / totalCells : 0;
    return brevity.toFixed(2);
  }

  calculateConnotation(testBasis) {
    let connotation = 0;
    if (testBasis) {
      const content = JSON.parse(testBasis.content);
      if (content) {
        const totalCharsCount = this._calculateTotalCharacterCount(content.blocks);
        const nodeSelectedCharsCount = this.causeEffects.reduce((a, b) => a + (b.definition.length || 0), 0);
        connotation = totalCharsCount > 0 ? nodeSelectedCharsCount / totalCharsCount : 0;
      }
    }

    return connotation.toFixed(2);
  }

  calculateLogicGraph() {
    const assertionDictionary = TestScenarioHelper.calculateAssertionDictionary(this.graphLinks, this.effectNodes);
    const expressions = [];
    const groups = new Map(assertionDictionary);
    groups.forEach((value, key) => {
      if (!this.groupNodes.some((x) => x.id === key)) {
        groups.delete(key);
      }
    });

    const flattenGroups = this._flattenGroups(groups);

    assertionDictionary.forEach((value, key) => {
      if (this.effectNodes.some((x) => x.id === key)) {
        const simplified = DNFLogicCoverage.simplify(value, assertionDictionary);
        const expression = this._getLogicalExpression(simplified, flattenGroups);
        const { testResults } = simplified;
        for (let i = 0; i < testResults.length; i++) {
          if (this.effectNodes.some((x) => x.id === testResults[i].graphNodeId)) {
            expressions.push(expression);
          }
        }
      }
    });
    const percentAndOr = this.calculatePercentAndOrOperators(expressions);
    return {
      complexity: this.calculateComplexity(expressions),
      percentAnd: percentAndOr ? percentAndOr.percentAnd : 0,
      percentOr: percentAndOr ? percentAndOr.percentOr : 0,
      afferent: this.calculateAfferent(expressions),
    };
  }

  calculateAfferent(expressions = []) {
    const listWeights = [];
    const rateAndConnection = 0.3;
    const rateOrConnection = 0.7;
    for (let i = 0; i < expressions.length; i++) {
      const countAnd = this._countOperator(expressions[i], OPERATOR_TYPE.AND);
      const andNodes = countAnd === 0 ? 0 : countAnd + 1;
      listWeights.push(andNodes * rateAndConnection);
      const countOr = this._countOperator(expressions[i], OPERATOR_TYPE.OR);
      const orNodes = countOr === 0 ? 0 : countOr + 1;
      listWeights.push(orNodes * rateOrConnection);
    }

    let weightedAverage = 0;
    const total = listWeights.reduce((a, b) => a + b, 0);
    if (total === 0) {
      return 0;
    }
    for (let i = 0; i < listWeights.length; i++) {
      weightedAverage += (listWeights[i] / 10) * (listWeights[i] / total);
    }
    weightedAverage = weightedAverage > 1 ? 1 : weightedAverage;

    return weightedAverage.toFixed(2);
  }

  calculateComplexity(expressions = []) {
    const totalLogicalFormular = expressions.length;
    const rateAndOnly = 0.1;
    const rateOrOnly = 0.2;
    const rateMixed = 0.7;
    let expAndCount = 0;
    let expOrCount = 0;
    let expAndOrCount = 0;

    for (let i = 0; i < expressions.length; i++) {
      const hasAnd = this._countOperator(expressions[i], OPERATOR_TYPE.AND) > 0;
      const hasOr = this._countOperator(expressions[i], OPERATOR_TYPE.OR) > 0;
      if (hasAnd && hasOr) {
        expAndOrCount++;
      } else if (hasAnd) {
        expAndCount++;
      } else if (hasOr) {
        expOrCount++;
      }
    }

    const complexity =
      totalLogicalFormular > 0
        ? (expAndCount / totalLogicalFormular) * rateAndOnly +
          (expOrCount / totalLogicalFormular) * rateOrOnly +
          (expAndOrCount / totalLogicalFormular) * rateMixed
        : 0;

    return complexity.toFixed(2);
  }

  calculatePercentAndOrOperators(expressions) {
    let andCount = 0;
    let orCount = 0;
    for (let i = 0; i < expressions.length; i++) {
      andCount += this._countOperator(expressions[i], OPERATOR_TYPE.AND);
      orCount += this._countOperator(expressions[i], OPERATOR_TYPE.OR);
    }

    const totalOperatorCount = andCount + orCount;
    const percentAnd = totalOperatorCount > 0 ? andCount / totalOperatorCount : 0;
    const percentOr = totalOperatorCount > 0 ? orCount / totalOperatorCount : 0;

    return { percentAnd: percentAnd.toFixed(2), percentOr: percentOr.toFixed(2) };
  }

  _countOperator(logicalExpression, operatorType) {
    const countCurrent = logicalExpression.expression.filter(
      (x) => x.type === EXPRESSION_TYPE.Operator && x.operator === operatorType
    ).length;
    const childrens = logicalExpression.expression.filter((x) => x.type === EXPRESSION_TYPE.Expression);
    let countChildren = 0;
    for (let i = 0; i < childrens.length; i++) {
      countChildren += this._countOperator(childrens[i], operatorType);
    }

    return countCurrent + countChildren;
  }

  _flattenGroups(groups = new Map()) {
    const groupExpressions = new Map();
    groups.forEach((value, key) => {
      groupExpressions.set(key, this._getLogicalExpression(value));
    });

    return groupExpressions;
  }

  _getLogicalExpression(testScenario, groupExpressions) {
    const opr = {
      operator: testScenario.targetType,
      type: EXPRESSION_TYPE.Operator,
    };
    const exp = {
      expression: [],
      type: EXPRESSION_TYPE.Expression,
    };
    const { testAssertions } = testScenario;
    for (let i = 0; i < testAssertions.length; i++) {
      const def = testAssertions[i].graphNode;
      const testScenarioKey = testAssertions[i].testScenario;
      if (def && def.type === GRAPH_NODE_TYPE.GROUP && groupExpressions) {
        const groupExp = groupExpressions.get(def.id);
        if (groupExp) {
          const cloneGroupExp = {
            name: groupExp.name,
            notOperator: groupExp.notOperator,
            expression: [...groupExp.expression],
            type: groupExp.type,
          };
          cloneGroupExp.notOperator = !testAssertions[i].result;
          cloneGroupExp.parent = exp;
          if (exp.expression) {
            exp.expression.push(opr);
          }
          exp.expression.push(cloneGroupExp);
        }
      } else if (testScenarioKey && groupExpressions) {
        const tcExpression = this._getLogicalExpression(testScenarioKey, groupExpressions);
        tcExpression.parent = exp;
        tcExpression.notOperator = !testAssertions[i].result;
        if (exp.expression) {
          exp.expression.push(opr);
        }
        exp.expression.push(tcExpression);
      } else {
        const logicVar = {
          name: '',
          object: testAssertions[i].graphNode ? testAssertions[i].graphNode : testAssertions[i].testScenario,
          notOperator: !testAssertions[i].result,
          type: EXPRESSION_TYPE.Variable,
        };
        if (exp.expression.length > 0) {
          exp.expression.push(opr);
        }
        exp.expression.push(logicVar);
      }
    }

    return exp;
  }

  _calculateTotalCharacterCount(blocks) {
    return blocks.reduce((a, b) => a + (b.text.length || 0), 0);
  }
}
export default new SSMetric();
