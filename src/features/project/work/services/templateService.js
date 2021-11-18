import { v4 as uuidv4 } from 'uuid';

const templates = [
  { id: uuidv4(), name: 'Default', ruleSet: '1,2,3,5' },
  { id: uuidv4(), name: 'Template 1', ruleSet: '1,2,3' },
  { id: uuidv4(), name: 'Template 2', ruleSet: '1,2,3,5,6' },
  { id: uuidv4(), name: 'Template 3', ruleSet: '1,2,3,7,8' },
  { id: uuidv4(), name: 'Template 4', ruleSet: '7,8,9' },
  { id: uuidv4(), name: 'Template 5', ruleSet: '1,2,3,5,6,7' },
  { id: uuidv4(), name: 'Template 6', ruleSet: '3,6,9' },
  { id: uuidv4(), name: 'Template 7', ruleSet: '1,2' },
  { id: uuidv4(), name: 'Template 8', ruleSet: '4,5,6,7,8,9' },
  { id: uuidv4(), name: 'Template 9', ruleSet: '1,2,3,4,5,6,7,8,9' },
  { id: uuidv4(), name: 'Template 10', ruleSet: '1,3,5,7,9' },
];

class TemPlateService {
  constructor() {
    this._key = 'inspection_template';
  }

  _get = () => {
    const data = localStorage.getItem(this._key);
    if (data) {
      return JSON.parse(data);
    }

    return templates;
  };

  _set = (data) => {
    localStorage.setItem(this._key, JSON.stringify(data));
  };

  createAsync = async (item) => {
    const data = this._get();
    this._set([...data, item]);

    return { data: true };
  };

  updateAsync = async (item) => {
    const data = this._get();
    const index = data.findIndex((x) => x.id === item.id);
    if (index) {
      data[index] = { ...item };
      this._set(data);
    }

    return { data: true };
  };

  deleteAsync = async (templateId) => {
    const data = this._get();
    this._set(data.filter((x) => x.id !== templateId));

    return { data: true };
  };

  listAsync = async () => {
    const data = this._get();
    return { data };
  };
}

const templateService = new TemPlateService();

export default templateService;
