import { parseString } from 'xml2js';

const getAllProperties = (obj, result = []) => {
  if (Array.isArray(obj) && typeof obj[0] === 'object') {
    obj.forEach((x) => getAllProperties(x, result));
  } else if (!Array.isArray(obj)) {
    Object.keys(obj).forEach((key) => {
      const item = { name: key };

      if ((Array.isArray(obj[key]) && typeof obj[key][0] !== 'object') || typeof obj[key] !== 'object') {
        item.selected = true;
      }

      if (!result.some((x) => x.name === key)) {
        result.push(item);
      }

      if (!item.selected) {
        getAllProperties(obj[key], result);
      }
    });
  }

  return result;
};

export const allPropertiesInJSON = (json) => {
  try {
    const obj = JSON.parse(json);
    return getAllProperties(obj);
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

    return getAllProperties(json);
  } catch (e) {
    return [];
  }
};

export const readFileContent = (file, process) => {
  const fr = new FileReader();
  fr.onloadend = (e) => process(e.target.result);
  fr.readAsText(file);
};
