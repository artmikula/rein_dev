import * as dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

const toLocalTime = (dateTimeString) => {
  dayjs.extend(utc);
  return dayjs.utc(dateTimeString).local().format('DD/MM/YYYY H:mm:ss');
};

const arrayToCsv = (data = [], graphNodes = []) => {
  const columnDelimiter = ',';
  const lineDelimiter = '\n';
  let result = '\ufeff';

  if (data === null || !data.length) {
    return result;
  }

  let meta = ',,,Meta,';
  let characteristic = ',,,characteristic,';
  const keys = Object.keys(data[0]);

  for (let i = 5; i < keys.length; i++) {
    const node = graphNodes.find((x) => x.nodeId === keys[i]);
    meta += `,${node.definition}`;

    if (node.inspectionPalettes) {
      characteristic += `,${node.inspectionPalettes.split(',')[0]}`;
    } else {
      characteristic += `,`;
    }
  }

  result += meta + lineDelimiter;
  result += characteristic + lineDelimiter;
  result += keys.join(',');
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

const sortByString = (data, key) => {
  if (Array.isArray(data)) {
    return data.sort((a, b) => {
      const stringA = a[key].toUpperCase();
      const stringB = b[key].toUpperCase();
      if (stringA < stringB) {
        return -1;
      }
      if (stringA > stringB) {
        return 1;
      }
      return 0;
    });
  }
  return [];
};

export { toLocalTime as default, arrayToCsv, sortByString };
