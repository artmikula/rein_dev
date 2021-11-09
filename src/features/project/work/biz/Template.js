import { parseString } from 'xml2js';

const getAllLeafProperties = (obj, parentKey, result = new Set()) => {
  if (Array.isArray(obj)) {
    if (obj.length === 0 || typeof obj[0] !== 'object') {
      if (parentKey) {
        result.add(parentKey);
      }
    } else {
      obj.forEach((item) => getAllLeafProperties(item, null, result));
    }
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] !== 'object') {
        result.add(key);
      } else {
        getAllLeafProperties(obj[key], key, result);
      }
    });
  }

  return result;
};

export const allPropertiesInJSON = (json) => {
  try {
    const obj = JSON.parse(json);
    const properties = getAllLeafProperties(obj);

    return [...properties];
  } catch (e) {
    return [];
  }
};

export const allTagsInXML = (xml) => {
  try {
    let json;
    parseString(xml, (err, result) => {
      json = result;
    });
    const properties = getAllLeafProperties(json);

    return [...properties];
  } catch (e) {
    return [];
  }
};

export const readFileContent = (file, process) => {
  const fr = new FileReader();
  fr.onloadend = (e) => process(e.target.result);
  fr.readAsText(file);
};
