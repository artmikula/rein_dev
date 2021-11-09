import * as dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

const toLocalTime = (dateTimeString) => {
  dayjs.extend(utc);
  return dayjs.utc(dateTimeString).local().format('DD/MM/YYYY H:mm:ss');
};

const arrayToCsv = (data = []) => {
  const columnDelimiter = ',';
  const lineDelimiter = '\n';
  let result = '\ufeff';

  if (data === null || !data.length) {
    return result;
  }

  const keys = Object.keys(data[0]);
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

export { toLocalTime as default, arrayToCsv };
