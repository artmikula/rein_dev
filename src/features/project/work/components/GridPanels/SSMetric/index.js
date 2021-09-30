import SSMetricHelper from 'features/project/work/biz/SSMetric';
import testScenarioAnsCaseService from 'features/project/work/services/testScenarioAnsCaseService';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Label } from 'reactstrap';
import Language from '../../../../../shared/languages/Language';
import CircleProgress from './CircleProgress';
import RadarChart from './RadarChart';
import './style.scss';

class SSMertic extends Component {
  baseChartDatas = [
    {
      label: 'I',
      key: 'inclusive',
      value: 0.8,
    },
    {
      label: 'O',
      key: 'onlyOne',
      value: 0.5,
    },
    {
      label: 'R',
      key: 'require',
      value: 0.4,
    },
    {
      label: 'M',
      key: 'mask',
      value: 0.6,
    },
    {
      label: 'E',
      key: 'exclusive',
      value: 1,
    },
  ];

  baseLeftCircles = [
    {
      label: 'A',
      key: 'percentAnd',
      color: '#17a2b8',
      percent: 32,
      valueDisplay: '32',
    },
    {
      label: 'O',
      key: 'percentOr',
      color: '#17a2b8',
      percent: 49,
      valueDisplay: '49',
    },
    {
      label: Language.get('brevity'),
      key: 'brevity',
      color: '#8D5393',
      percent: 63,
      valueDisplay: '63',
    },
  ];

  baseRightCircles = [
    {
      label: Language.get('efferent'),
      key: 'efferent',
      color: '#007bff',
      percent: 90,
      valueDisplay: '90',
    },
    {
      label: Language.get('afferent'),
      key: 'afferent',
      color: '#007bff',
      percent: 25,
      valueDisplay: '25',
    },
    {
      label: Language.get('complexity'),
      key: 'complexity',
      color: '#007bff',
      percent: 47,
      valueDisplay: '47',
    },
  ];

  baseRecTangles = [
    {
      key: 'sameSoundAmbiguity',
      label: Language.get('samesoundambiguity'),
      color: 'blue',
      value: 1,
    },
    {
      key: 'sameMeaningAmbiguity',
      label: Language.get('samemeaningambiguity'),
      color: 'blue',
      value: 0,
    },
    {
      key: 'orphanNode',
      label: Language.get('orphannode'),
      color: 'purple',
      value: 0,
    },
    {
      key: 'arcLevel',
      label: Language.get('arclevel'),
      color: 'purple',
      value: 1,
    },
  ];

  constructor() {
    super();
    this.conotationValueRef = React.createRef(null);
  }

  _caculateSSMetricValue = () => {
    const { testBasis, causeEffects, graph } = this.props;
    const testScenariosAndCases = testScenarioAnsCaseService.get();

    SSMetricHelper.initValue(graph.graphNodes, graph.graphLinks, graph.constraints, causeEffects);
    const newChartDatas = this.baseChartDatas.map((x) => {
      const constraintValue = SSMetricHelper.calculateConstraints();
      return {
        ...x,
        value: constraintValue ? constraintValue[x.key] : 0,
      };
    });
    const logicGraphValue = SSMetricHelper.calculateLogicGraph();
    const newConotationValue = SSMetricHelper.calculateConnotation(testBasis);
    this._setConotationPosition(newConotationValue);

    const brevity = this.baseLeftCircles.find((x) => x.key === 'brevity');
    brevity.percent = parseFloat(SSMetricHelper.calculateBrevity(testScenariosAndCases)) * 100;
    brevity.valueDisplay = SSMetricHelper.calculateBrevity(testScenariosAndCases);

    const percentAnd = this.baseLeftCircles.find((x) => x.key === 'percentAnd');
    percentAnd.percent = parseFloat(logicGraphValue.percentAnd) * 100;
    percentAnd.valueDisplay = logicGraphValue.percentAnd;

    const percentOr = this.baseLeftCircles.find((x) => x.key === 'percentOr');
    percentOr.percent = parseFloat(logicGraphValue.percentOr) * 100;
    percentOr.valueDisplay = logicGraphValue.percentOr;

    const efferent = this.baseRightCircles.find((x) => x.key === 'efferent');
    efferent.percent = parseFloat(SSMetricHelper.calculateEfferent()) * 100;
    efferent.valueDisplay = SSMetricHelper.calculateEfferent();

    const afferent = this.baseRightCircles.find((x) => x.key === 'afferent');
    afferent.percent = parseFloat(logicGraphValue.afferent) * 100;
    afferent.valueDisplay = logicGraphValue.afferent;

    const complexity = this.baseRightCircles.find((x) => x.key === 'complexity');
    complexity.percent = parseFloat(logicGraphValue.complexity) * 100;
    complexity.valueDisplay = logicGraphValue.complexity;

    const sameSoundAmbiguity = this.baseRecTangles.find((x) => x.key === 'sameSoundAmbiguity');
    sameSoundAmbiguity.value = SSMetricHelper.countNodes().sameSoundAmbiguity;

    const sameMeaningAmbiguity = this.baseRecTangles.find((x) => x.key === 'sameMeaningAmbiguity');
    sameMeaningAmbiguity.value = SSMetricHelper.countNodes().sameMeaningAmbiguity;

    const orphanNode = this.baseRecTangles.find((x) => x.key === 'orphanNode');
    orphanNode.value = SSMetricHelper.countLinkedNodes().orphanNode;

    const arcLevel = this.baseRecTangles.find((x) => x.key === 'arcLevel');
    arcLevel.value = SSMetricHelper.countLinkedNodes().arcLevel;

    const newRightCircles = [...this.baseRightCircles];
    const newLeftCircles = [...this.baseLeftCircles];
    const newRecTangles = [...this.baseRecTangles];

    const newAbridgedValue = parseFloat(SSMetricHelper.calculateNodesPercentage().abridged) * 100;
    const newDuplicationValue = parseFloat(SSMetricHelper.calculateNodesPercentage().duplication) * 100;

    SSMetricHelper.calculateLogicGraph();

    return {
      chartDatas: newChartDatas,
      rightCircles: newRightCircles,
      leftCircles: newLeftCircles,
      recTangles: newRecTangles,
      abridged: newAbridgedValue,
      duplication: newDuplicationValue,
      conotationValue: newConotationValue,
    };
  };

  _setConotationPosition = (value) => {
    if (this.conotationValueRef.current) {
      let percent = value > 1 ? 1 : value;
      percent = percent < 0 ? 0 : percent * 100;
      this.conotationValueRef.current.style.left =
        percent > 10 ? `calc(${percent}% - 20px)` : `calc(${percent}% - 7px)`;
    }
  };

  render() {
    const { leftCircles, rightCircles, recTangles, chartDatas, duplication, abridged, conotationValue } =
      this._caculateSSMetricValue();

    return (
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
    );
  }
}

SSMertic.propTypes = {
  testBasis: PropTypes.shape({ content: PropTypes.string }).isRequired,
  causeEffects: PropTypes.arrayOf(PropTypes.object).isRequired,
  graph: PropTypes.shape({
    graphNodes: PropTypes.arrayOf(PropTypes.object).isRequired,
    graphLinks: PropTypes.arrayOf(PropTypes.object).isRequired,
    constraints: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
};

const mapStateToProps = (state) => ({
  testBasis: state.work.testBasis,
  causeEffects: state.work.causeEffects,
  graph: state.work.graph,
});

export default connect(mapStateToProps)(withRouter(SSMertic));
