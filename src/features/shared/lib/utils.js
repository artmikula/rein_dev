import * as dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { EXPORT_TYPE_NAME } from 'features/project/work/components/GridPanels/Graph/constants';

const toLocalTime = (dateTimeString) => {
  dayjs.extend(utc);
  return dayjs.utc(dateTimeString).local().format('DD/MM/YYYY H:mm:ss');
};

/**
 * Take an array of objects of similar structure and convert it to a CSV.
 * @param      {Array}  data  Array of data
 * @return     {String}       CSV
 */
const arrayToCsv = (data = [], graphNodes = [], exportTypeName = '') => {
  const columnDelimiter = ',';
  const lineDelimiter = '\n';
  let result = '\ufeff';

  if (data === null || !data.length) {
    return result;
  }

  const keys = Object.keys(data[0]);

  for (let i = 0; i <= 4; i++) {
    result += columnDelimiter;
  }

  result += keys.slice(5, keys.length + 1).join(columnDelimiter);
  result += lineDelimiter;
  result += keys.slice(0, 5).join(columnDelimiter);

  if (exportTypeName === EXPORT_TYPE_NAME.TestCase) {
    keys.slice(5, keys.length + 1).forEach((key, index) => {
      const graphNode = graphNodes.find((x) => x.nodeId === key);

      if (graphNode) {
        result += graphNode.definition.includes(columnDelimiter) ? `"${graphNode.definition}"` : graphNode.definition;
      }

      if (index < keys.length - 1) {
        result += columnDelimiter;
      }
    });
  }

  result += lineDelimiter;

  data.forEach((item) => {
    let ctr = 0;
    keys.forEach((key) => {
      if (ctr > 0) {
        result += columnDelimiter;
      }

      if (key === 'True Data' || key === 'False Data') {
        result += `"${item[key]}"`;
      } else {
        result += typeof item[key] === 'string' && item[key].includes(columnDelimiter) ? `"${item[key]}"` : item[key];
      }
      ctr++;
    });
    result += lineDelimiter;
  });

  return new Blob([result], { type: 'text/csv;charset=UTF-8' });
};

export { toLocalTime as default, arrayToCsv };
