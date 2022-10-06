/* eslint-disable max-lines */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Label } from 'reactstrap';
import SSMetricHelper from 'features/project/work/biz/SSMetric';
import { GENERATE_STATUS, METRIC_KEYS } from 'features/shared/constants';
import Language from '../../../../../shared/languages/Language';
import CircleProgress from './CircleProgress';
import RadarChart from './RadarChart';
import './style.scss';

const baseChartDatas = [
  {
    label: 'I',
    key: METRIC_KEYS.INCLUSIVE,
    value: 0.0,
  },
  {
    label: 'O',
    key: METRIC_KEYS.ONLY_ONE,
    value: 0.0,
  },
  {
    label: 'R',
    key: METRIC_KEYS.REQUIRE,
    value: 0.0,
  },
  {
    label: 'M',
    key: METRIC_KEYS.MASK,
    value: 0.0,
  },
  {
    label: 'E',
    key: METRIC_KEYS.EXCLUSIVE,
    value: 0.0,
  },
];

const baseLeftCircles = [
  {
    label: 'A',
    key: METRIC_KEYS.PERCENT_AND,
    color: '#17a2b8',
    percent: 32,
    valueDisplay: '32',
  },
  {
    label: 'O',
    key: METRIC_KEYS.PERCENT_OR,
    color: '#17a2b8',
    percent: 49,
    valueDisplay: '49',
  },
  {
    label: Language.get('brevity'),
    key: METRIC_KEYS.BREVITY,
    color: '#8D5393',
    percent: 63,
    valueDisplay: '63',
  },
];

const baseRightCircles = [
  {
    label: Language.get('efferent'),
    key: METRIC_KEYS.EFFERENT,
    color: '#007bff',
    percent: 90,
    valueDisplay: '90',
  },
  {
    label: Language.get('afferent'),
    key: METRIC_KEYS.AFFERENT,
    color: '#007bff',
    percent: 25,
    valueDisplay: '25',
  },
  {
    label: Language.get('complexity'),
    key: METRIC_KEYS.COMPLEXITY,
    color: '#007bff',
    percent: 47,
    valueDisplay: '47',
  },
];

const baseRecTangles = [
  {
    key: METRIC_KEYS.SAME_SOUND_AMBIGUITY,
    label: Language.get('samesoundambiguity'),
    color: 'blue',
    value: 1,
  },
  {
    key: METRIC_KEYS.SAME_MEANING_AMBIGUITY,
    label: Language.get('samemeaningambiguity'),
    color: 'blue',
    value: 0,
  },
  {
    key: METRIC_KEYS.ORPHAN_NODE,
    label: Language.get('orphannode'),
    color: 'purple',
    value: 0,
  },
  {
    key: METRIC_KEYS.ARC_LEVEL,
    label: Language.get('arclevel'),
    color: 'purple',
    value: 1,
  },
];

class SSMertic extends Component {
  constructor() {
    super();
    this.state = {
      leftCircles: [],
      rightCircles: [],
      recTangles: [],
      chartDatas: [...baseChartDatas],
      duplication: 0,
      abridged: 0,
      conotationValue: '',
      error: null,
    };
    this.conotationValueRef = React.createRef(null);
    this.isCalculated = false;
  }

  async componentDidMount() {
    const { dbContext } = this.props;
    if (dbContext && dbContext.db) {
      await this._updateSSMetric();
    }
  }

  async componentDidUpdate(prevProps) {
    const { generating, dbContext } = this.props;
    if (
      (prevProps.dbContext === null && dbContext && dbContext.db) ||
      (prevProps.generating === GENERATE_STATUS.SUCCESS && generating === GENERATE_STATUS.COMPLETE)
    ) {
      await this._updateSSMetric();
    } else if (
      prevProps.generating !== GENERATE_STATUS.RESET &&
      generating === GENERATE_STATUS.RESET &&
      this.isCalculated
    ) {
      await this._updateSSMetric('reset');
    }
  }

  _calculateSSMetricValue = async () => {
    try {
      const { testBasis, causeEffects, graph, dbContext } = this.props;

      SSMetricHelper.initValue(graph.graphNodes, graph.graphLinks, graph.constraints, causeEffects);
      const newChartDatas = baseChartDatas.map((x) => {
        const constraintValue = SSMetricHelper.calculateConstraints();
        return {
          ...x,
          value: constraintValue ? constraintValue[x.key] : 0,
        };
      });
      const logicGraphValue = SSMetricHelper.calculateLogicGraph();
      const newConotationValue = SSMetricHelper.calculateConnotation(testBasis);
      this._setConotationPosition(newConotationValue);

      /** baseLeftCircles */
      const newLeftCircles = structuredClone(baseLeftCircles);
      const brevity = newLeftCircles.find((x) => x.key === METRIC_KEYS.BREVITY);
      if (dbContext && dbContext.db) {
        const { testScenarioSet } = dbContext;
        const testScenariosAndCases = await testScenarioSet.get();
        brevity.percent = parseFloat(SSMetricHelper.calculateBrevity(testScenariosAndCases)) * 100;
        brevity.valueDisplay = SSMetricHelper.calculateBrevity(testScenariosAndCases);
      }

      const percentAnd = newLeftCircles.find((x) => x.key === METRIC_KEYS.PERCENT_AND);
      percentAnd.percent = parseFloat(logicGraphValue.percentAnd) * 100;
      percentAnd.valueDisplay = logicGraphValue.percentAnd;

      const percentOr = newLeftCircles.find((x) => x.key === METRIC_KEYS.PERCENT_OR);
      percentOr.percent = parseFloat(logicGraphValue.percentOr) * 100;
      percentOr.valueDisplay = logicGraphValue.percentOr;
      /** end baseLeftCircles */

      /** baseRightCircles */
      const newRightCircles = structuredClone(baseRightCircles);
      const efferent = newRightCircles.find((x) => x.key === METRIC_KEYS.EFFERENT);
      efferent.percent = parseFloat(SSMetricHelper.calculateEfferent()) * 100;
      efferent.valueDisplay = SSMetricHelper.calculateEfferent();

      const afferent = newRightCircles.find((x) => x.key === METRIC_KEYS.AFFERENT);
      afferent.percent = parseFloat(logicGraphValue.afferent) * 100;
      afferent.valueDisplay = logicGraphValue.afferent;

      const complexity = newRightCircles.find((x) => x.key === METRIC_KEYS.COMPLEXITY);
      complexity.percent = parseFloat(logicGraphValue.complexity) * 100;
      complexity.valueDisplay = logicGraphValue.complexity;
      /** end baseRightCircles */

      /** baseRecTangles */
      const newRecTangles = structuredClone(baseRecTangles);
      const sameSoundAmbiguity = newRecTangles.find((x) => x.key === METRIC_KEYS.SAME_SOUND_AMBIGUITY);
      sameSoundAmbiguity.value = SSMetricHelper.countNodes().sameSoundAmbiguity;

      const sameMeaningAmbiguity = newRecTangles.find((x) => x.key === METRIC_KEYS.SAME_MEANING_AMBIGUITY);
      sameMeaningAmbiguity.value = SSMetricHelper.countNodes().sameMeaningAmbiguity;

      const orphanNode = newRecTangles.find((x) => x.key === METRIC_KEYS.ORPHAN_NODE);
      orphanNode.value = SSMetricHelper.countLinkedNodes().orphanNode;

      const arcLevel = newRecTangles.find((x) => x.key === METRIC_KEYS.ARC_LEVEL);
      arcLevel.value = SSMetricHelper.countLinkedNodes().arcLevel;
      /** end baseRecTangles */

      const newAbridgedValue = parseFloat(SSMetricHelper.calculateNodesPercentage().abridged) * 100;
      const newDuplicationValue = parseFloat(SSMetricHelper.calculateNodesPercentage().duplication) * 100;

      SSMetricHelper.calculateLogicGraph();

      return {
        chartDatas: newChartDatas,
        rightCircles: newRightCircles ?? [],
        leftCircles: newLeftCircles ?? [],
        recTangles: newRecTangles ?? [],
        abridged: newAbridgedValue,
        duplication: newDuplicationValue,
        conotationValue: newConotationValue,
        error: null,
      };
    } catch (err) {
      console.error('Error calculcate SSMetric:', err);

      return {
        chartDatas: [],
        rightCircles: baseRightCircles,
        leftCircles: baseLeftCircles,
        recTangles: baseRecTangles,
        abridged: 0,
        duplication: 0,
        conotationValue: '',
        error: Language.get('errorcalculate'),
      };
    }
  };

  _updateSSMetric = async (type = 'default') => {
    if (type === 'reset') {
      this.isCalculated = false;
      this._resetMetricValue();
    } else if (type === 'default') {
      const { leftCircles, rightCircles, recTangles, chartDatas, duplication, abridged, conotationValue, error } =
        await this._calculateSSMetricValue();
      this.isCalculated = true;
      this.setState({
        leftCircles,
        rightCircles,
        recTangles,
        chartDatas,
        duplication,
        abridged,
        conotationValue,
        error,
      });
    }
  };

  _setConotationPosition = (value) => {
    if (this.conotationValueRef.current) {
      let percent = value > 1 ? 1 : value;
      percent = percent < 0 ? 0 : percent * 100;
      this.conotationValueRef.current.style.left =
        percent > 10 ? `calc(${percent}% - 20px)` : `calc(${percent}% - 7px)`;
    }
  };

  _resetMetricValue = () => {
    const rightCircles = baseRightCircles.map((data) => {
      const _data = data;
      _data.percent = 0;
      _data.valueDisplay = '0';
      return _data;
    });
    const leftCircles = baseLeftCircles.map((data) => {
      const _data = data;
      _data.percent = 0;
      _data.valueDisplay = '0';
      return _data;
    });
    const recTangles = baseRecTangles.map((data) => {
      const _data = data;
      _data.value = 0;
      return _data;
    });
    this.setState({
      leftCircles,
      rightCircles,
      recTangles,
      chartDatas: [],
      abridged: 0,
      duplication: 0,
      conotationValue: '',
      error: null,
    });
  };

  render() {
    const { leftCircles, rightCircles, recTangles, chartDatas, duplication, abridged, conotationValue, error } =
      this.state;

    return (
      <div>
        {error && (
          <div
            style={{
              color: 'red',
              position: 'absolute',
              right: 5,
              background: '#fff',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
        <div className="d-md-flex p-3">
          <div className="metric-area text-muted">
            <div className="metric-wrapper">
              <div>
                <div className="d-flex">
                  {leftCircles.map((circle) => {
                    return (
                      <CircleProgress
                        percent={circle.percent}
                        valueDisplay={circle.valueDisplay}
                        lineColor={circle.color}
                        label={circle.label}
                        key={circle.label}
                      />
                    );
                  })}
                </div>
                <Label className="text-dark font-weight-500">{Language.get('logiccombination')}</Label>
              </div>
              <div className="position-relative ml-3 mr-4">
                <span className="conotation min position-absolute text-14">0</span>
                <input type="range" min="1" max="100" defaultValue={conotationValue * 100} className="slider" />
                <span ref={this.conotationValueRef} className="position-absolute conotation-container">
                  <input readOnly className="text-center conotation-value small" value={conotationValue} />
                </span>
                <span className="conotation max position-absolute text-14">1</span>
                <Label>{Language.get('connotation')}</Label>
              </div>
              {rightCircles.map((circle) => {
                return (
                  <CircleProgress
                    percent={circle.percent}
                    valueDisplay={circle.valueDisplay}
                    lineColor={circle.color}
                    label={circle.label}
                    key={circle.label}
                  />
                );
              })}
            </div>
            <div className="dropdown-divider" />
            <div className="metric-wrapper pt-2">
              {recTangles.map((x, index) => {
                return (
                  <div className="metric-container mr-2" key={index}>
                    <div className={`gradient-block ${x.color} d-flex justify-content-between align-items-center`}>
                      <span className="ml-1 small">{x.value}</span>
                      <span className="metric-unit">EA</span>
                    </div>
                    <Label>{x.label}</Label>
                  </div>
                );
              })}
              <div className="metric-container mx-2">
                <CircleProgress
                  lineDot
                  percent={abridged}
                  valueDisplay={`${abridged}%`}
                  label={Language.get('abridgedpercentage')}
                />
              </div>
              <div className="metric-container ml-2">
                <CircleProgress percent={duplication} valueDisplay={duplication} label={Language.get('duplication')} />
              </div>
            </div>
          </div>
          <div className="chart-area">
            <RadarChart data={chartDatas} />
          </div>
        </div>
      </div>
    );
  }
}

SSMertic.propTypes = {
  testBasis: PropTypes.shape({ content: PropTypes.string }).isRequired,
  causeEffects: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  graph: PropTypes.shape({
    graphNodes: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    graphLinks: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    constraints: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  }).isRequired,
  generating: PropTypes.string.isRequired,
  dbContext: PropTypes.oneOfType([PropTypes.object]),
};

SSMertic.defaultProps = {
  dbContext: null,
};

const mapStateToProps = (state) => ({
  testBasis: state.work.testBasis,
  causeEffects: state.work.causeEffects,
  graph: state.work.graph,
  dbContext: state.work.dbContext,
  generating: state.work.generating,
});

export default connect(mapStateToProps)(withRouter(SSMertic));
