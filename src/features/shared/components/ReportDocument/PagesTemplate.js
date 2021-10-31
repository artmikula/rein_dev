import { Image } from '@react-pdf/renderer';
import React from 'react';
import CauseEffectTable from './CauseEffectTable';
import TestCase from './TestCase';
import TestCoverage from './TestCoverage';
import TestScenariosTable from './TestScenariosTable';

const causeEffectHeader = [
  { name: 'ID', key: 'node', styles: { width: '10%', textAlign: 'center' } },
  { name: 'Definition', key: 'definition', styles: { width: '80%' } },
  { name: 'Merged', key: 'merged', styles: { width: '10%' } },
];

export default function PagesTemplate(props) {
  const { theme, testCoverage, causes, effects, graphSrc, inspections, testScenarios, testData, testCases } = props;
  return [
    {
      title: 'Test Coverage',
      component: <TestCoverage theme={theme} rows={testCoverage} />,
    },
    {
      title: '1. Cause & Effect Classification',
      component: (
        <CauseEffectTable
          theme={theme}
          header={causeEffectHeader}
          bodySections={[
            {
              rows: causes,
              borderLeftColor: theme.blue,
              firstColStyles: {
                color: 'black',
                backgroundColor: theme.lightBlue,
              },
            },
            {
              rows: effects,
              borderLeftColor: theme.green,
              firstColStyles: {
                color: 'black',
                backgroundColor: theme.lightGreen,
              },
            },
          ]}
        />
      ),
    },
    {
      title: '2. Cause & Effect Definition',
      component: (
        <CauseEffectTable
          theme={theme}
          header={causeEffectHeader}
          bodySections={[
            {
              rows: causes,
              borderLeftColor: theme.blue,
              firstColStyles: {
                color: 'black',
                backgroundColor: theme.lightBlue,
              },
            },
          ]}
        />
      ),
    },
    {
      title: '2. Cause & Effect Definition',
      component: (
        <CauseEffectTable
          theme={theme}
          header={causeEffectHeader}
          bodySections={[
            {
              rows: effects,
              borderLeftColor: theme.green,
              firstColStyles: {
                color: 'black',
                backgroundColor: theme.lightGreen,
              },
            },
          ]}
        />
      ),
    },
    {
      title: '3. Cause & Effect Graph',
      component: (
        <>
          <Image src={graphSrc} style={{ objectFit: 'contain' }} alt="graph-image" />
          <CauseEffectTable
            theme={theme}
            header={[
              { name: 'Inspection', key: 'node', styles: { width: '13%', textAlign: 'center', color: theme.purple } },
              { name: '', key: 'text', styles: { width: '87%' } },
            ]}
            bodySections={[
              {
                rows: inspections,
                borderLeftColor: theme.purple,
                firstColStyles: {
                  color: 'black',
                  backgroundColor: theme.lightPurple,
                },
              },
            ]}
          />
        </>
      ),
    },
    {
      title: '4. Test Scenarios',
      component: <TestScenariosTable theme={theme} rows={testScenarios} />,
    },
    {
      title: '5. Test Data',
      component: (
        <CauseEffectTable
          theme={theme}
          header={[
            { name: 'Cause', key: 'nodeId', styles: { width: '10%', textAlign: 'center' } },
            { name: 'Type', key: 'type', styles: { width: '14%' } },
            { name: 'True Data', key: 'trueDatas', styles: { width: '38%' } },
            { name: 'False Data', key: 'falseDatas', styles: { width: '38%' } },
          ]}
          bodySections={[
            {
              rows: testData,
              borderLeftColor: theme.yellow,
              firstColStyles: {
                color: 'black',
                backgroundColor: theme.lightYellow,
              },
            },
          ]}
        />
      ),
    },
    ...testCases.map((test) => ({
      title: '6. Test Cases',
      component: (
        <>
          <TestCase {...test} theme={theme} />
          <CauseEffectTable
            theme={theme}
            header={[
              { name: 'Cause', key: 'node', styles: { width: '10%', textAlign: 'center' } },
              { name: 'Definition', key: 'definition', styles: { width: '45%' } },
              { name: 'Type Data', key: 'type', styles: { width: '45%' } },
            ]}
            bodySections={[{ rows: test.causes }]}
          />
        </>
      ),
    })),
  ];
}
