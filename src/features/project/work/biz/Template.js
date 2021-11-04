import { parseString } from 'xml2js';

const getAllProperties = (obj, result = new Set()) => {
  if (Array.isArray(obj)) {
    obj.forEach((item) => getAllProperties(item, result));
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      result.add(key);
      getAllProperties(obj[key], result);
    });
  }

  return result;
};

export const allPropertiesInJSON = (json) => {
  try {
    const obj = JSON.parse(json);
    const properties = getAllProperties(obj);

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
    const properties = getAllProperties(json);

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
