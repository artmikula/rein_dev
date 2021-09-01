import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import * as dayjs from 'dayjs';
import PagesTemplate from './PagesTemplate';

const THEME = {
  // Color
  primary: '#5989AB',
  gray: '#707070',
  lightGray: '#9f9f9f',
  lighterGray: '#C9C9C9',
  purple: '#965196',
  lightPurple: '#96519620',
  yellow: '#f2ca30',
  lightYellow: '#fdfae6',
  green: '#28a745',
  lightGreen: '#28a74520',
  blue: '#0078d4',
  lightBlue: '#0078d420',
  pagePadding: '2cm',
  // Typography
  display1: '28',
  display2: '16',
  display3: '14',
  display4: '12',
  display5: '10',
  display6: '9',
  display7: '8',
};
// Register Font
Font.register({
  family: 'GothicA1',
  format: 'truetype',
  src: '/font/GothicA1-Regular.ttf',
  fonts: [
    { src: '/font/GothicA1-Thin.ttf', fontWeight: 'thin' },
    { src: '/font/GothicA1-Light.ttf', fontWeight: 'light' },
    { src: '/font/GothicA1-Regular.ttf', fontWeight: 'normal' },
    { src: '/font/GothicA1-Medium.ttf', fontWeight: 'medium' },
    { src: '/font/GothicA1-Bold.ttf', fontWeight: 'bold' },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const commonStyles = StyleSheet.create({
  textPrimary: {
    color: THEME.primary,
  },
  textGray: {
    color: THEME.gray,
  },
  textLightGray: {
    color: THEME.lightGray,
  },
  textLighterGray: {
    color: THEME.lighterGray,
  },
  textCenter: {
    textAlign: 'center',
  },
  dividerPrimary: {
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: THEME.primary,
    marginVertical: 7,
  },
  dividerSecondary: {
    borderTopWidth: 0.5,
    borderTopStyle: 'solid',
    borderTopColor: THEME.lighterGray,
    marginVertical: 7,
  },
  page: {
    position: 'relative',
    fontFamily: 'GothicA1',
    padding: THEME.pagePadding,
    paddingBottom: '5cm',
    color: THEME.gray,
    fontSize: THEME.display5,
    fontWeight: 'normal',
  },
  cover: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  coverTitle: {
    width: '72%',
    textAlign: 'center',
    fontWeight: 'medium',
  },
  coverFooter: {
    width: '100%',
    position: 'absolute',
    bottom: THEME.pagePadding,
    alignItems: 'center',
  },
  title: {
    color: THEME.primary,
    fontSize: THEME.display2,
    fontWeight: 'medium',
  },
  footer: {
    width: '100%',
    position: 'absolute',
    left: THEME.pagePadding,
    right: THEME.pagePadding,
    bottom: THEME.pagePadding,
    color: THEME.lightGray,
    fontSize: THEME.display6,
    fontWeight: 'normal',
  },
  footerRow: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    fontSize: THEME.display7,
  },
  pageNumber: {
    position: 'absolute',
    bottom: THEME.pagePadding,
    right: THEME.pagePadding,
    fontSize: THEME.display5,
    color: THEME.gray,
  },
});

export default function ReportDocument(data) {
  const reportDay = dayjs(new Date()).format('MM/DD/YYYY');
  const pages = PagesTemplate({ theme: THEME, ...data });
  const { projectName, workName, functionName, version, reporter, reviewer, approver } = data;

  return (
    <Document>
      <Page size="A4" style={[commonStyles.page, commonStyles.cover]}>
        <View style={commonStyles.coverTitle}>
          <Text style={{ fontSize: THEME.display1 }}>{workName} Report</Text>
          <View style={commonStyles.dividerPrimary} />
          <Text>{reportDay}</Text>
        </View>
        <View>
          <Text>
            <Text style={commonStyles.textPrimary}>Project </Text>
            {projectName}
          </Text>
          <View style={commonStyles.dividerSecondary} />
          <Text>
            <Text style={commonStyles.textPrimary}>Version </Text>
            {version}
          </Text>
          <View style={commonStyles.dividerSecondary} />
          <Text>
            <Text style={commonStyles.textPrimary}>Function </Text>
            {functionName}
          </Text>
        </View>
        <View>
          <Text>
            <Text style={commonStyles.textPrimary}>Reporter </Text>
            {reporter}
          </Text>
          <View style={commonStyles.dividerSecondary} />
          <Text>
            <Text style={commonStyles.textPrimary}>Reviewer </Text>
            {reviewer}
          </Text>
          <View style={commonStyles.dividerSecondary} />
          <Text>
            <Text style={commonStyles.textPrimary}>Approver </Text>
            {approver}
          </Text>
        </View>
        <View style={commonStyles.coverFooter}>
          <Text style={commonStyles.textLighterGray}>Copyright © 2021 ThinkforBL. All rights reserved</Text>
        </View>
      </Page>
      <Page size="A4" style={commonStyles.page} wrap>
        {pages.map((page, index) => (
          <View break={!!index} key={index}>
            <Text style={commonStyles.title} fixed>
              {page.title}
            </Text>
            <View style={commonStyles.dividerPrimary} fixed />
            {page.component}
          </View>
        ))}
        <View fixed style={commonStyles.footer}>
          <View style={commonStyles.footerRow}>
            <Text>
              <Text style={commonStyles.textPrimary}>Project </Text>
              {projectName}
            </Text>
            <Text>
              <Text style={commonStyles.textPrimary}>Version </Text>
              {version}
            </Text>
            <Text>
              <Text style={commonStyles.textPrimary}>Function </Text>
              {functionName}
            </Text>
          </View>
          <View style={commonStyles.dividerPrimary} />
          <Text style={commonStyles.textLighterGray}>Copyright © 2021 ThinkforBL. All rights reserved</Text>
        </View>
        <Text render={({ pageNumber }) => pageNumber} fixed style={commonStyles.pageNumber} />
      </Page>
    </Document>
  );
}
