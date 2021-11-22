import { CLASSIFY } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import similarityCosine from 'features/shared/lib/similarityCosine';
import { v4 as uuidv4 } from 'uuid';

class CauseEffect {
  /**
   * @param {CLASSIFY.CAUSE || CLASSIFY.EFFECT} type
   * @returns {string}
   */
  createNode = (causeEffectList, type) => {
    let max = 0;
    causeEffectList.forEach((causeEffect) => {
      const index = parseInt(
        causeEffect.node.replace(type === CLASSIFY.CAUSE ? CLASSIFY.CAUSE_PREFIX : CLASSIFY.EFFECT_PREFIX, ''),
        10
      );
      max = index > max ? index : max;
    });

    return type === CLASSIFY.CAUSE ? `${CLASSIFY.CAUSE_PREFIX}${max + 1}` : `${CLASSIFY.EFFECT_PREFIX}${max + 1}`;
  };

  /**
   * @param {object} value
   * @param {array} listData
   * @param {object} appConfig
   * @returns {object} { similarItem, rate }
   */
  checkExistOrSimilarity = (value, listData, appConfig) => {
    const { definition, type } = value;
    let similarItem = null;
    let maxRate = 0;
    const { similarity } = appConfig;
    for (let i = 0; i < listData.length; i++) {
      const item = listData[i];
      // check exist
      if (item.type === type && item.definition === definition) {
        similarItem = item;
        maxRate = 101;
        break;
      }
      // check similarity
      if (similarity && similarity.enable && item.type === type && !item.isMerged) {
        const distance = similarityCosine.distanceTwoString(definition, item.definition);
        const _rate = (1 - distance / Math.PI) * 100;

        if (_rate >= similarity.rate && _rate > maxRate) {
          similarItem = item;
          maxRate = _rate;
        }
      }
    }

    return { similarItem, rate: maxRate };
  };

  calculateSentenceSimilarity(sentence1, sentence2) {
    const distance = similarityCosine.distanceTwoString(sentence1, sentence2);
    const _rate = 1 - distance / Math.PI;

    return _rate;
  }

  /**
   *
   * @param {object} value
   * @param {object} parent // like value
   * @returns {object} newItem
   */
  generateCauseEffectItem = (causeEffectList, value, parent = null) => {
    const { type } = value;
    const newItem = {
      ...value,
      id: uuidv4(),
      node: this.createNode(causeEffectList, type),
    };
    // if Abbreviate is yes
    if (parent) {
      newItem.parent = parent.id;
      newItem.isMerged = true;
    }

    return newItem;
  };

  /**
   * Merge cause/effect child to its parent
   */
  _mergeData = (data, type, prefix) => {
    const listData = new Map();

    const _data = data.filter((x) => x.type === type);

    _data.forEach((item) => {
      if (!item.isMerged) {
        listData.set(item.id, { ...item, mergedChildren: [], mergedNodes: [] });
      }
    });

    _data.forEach((item) => {
      if (item.isMerged) {
        const parent = listData.get(item.parent);
        if (parent) {
          parent.mergedChildren.push({ ...item });
          parent.mergedNodes.push(item.node);
        }
      }
    });

    const result = [...listData.values()].sort((a, b) => {
      const aIndex = parseInt(a.node.replace(prefix, ''), 10);
      const bIndex = parseInt(b.node.replace(prefix, ''), 10);
      return aIndex - bIndex;
    });

    return result;
  };

  /**
   * Generage cause/effect data structure to render
   * @param {array} data
   * @returns {array} [list cause, list effect]
   */

  generateData = (data) => {
    const causes = this._mergeData(data, CLASSIFY.CAUSE, CLASSIFY.CAUSE_PREFIX);
    const effects = this._mergeData(data, CLASSIFY.EFFECT, CLASSIFY.EFFECT);

    return [...causes, ...effects];
  };

  /**
   * generate report data cause/effect data to object
   * @param {array} data
   * @returns {object} {causes: array, effects: array}
   */
  generateReportData = (data) => {
    let generateData = this.generateData(data);
    generateData = generateData.map((e) => ({ ...e, merged: e.mergedNodes.join(', ') }));
    const firstEffectIndex = generateData.findIndex((e) => e.type === CLASSIFY.EFFECT);
    const causes = [...generateData.slice(0, firstEffectIndex)];
    const effects = [...generateData.slice(firstEffectIndex, generateData.length)];
    return { causes, effects };
  };

  alertExistItem = () => {
    const title = Language.get('cannotaddanode');
    const content = Language.get('samenode');
    alert(content, { title, error: true });
  };

  alertError = (error) => {
    if (error['Request.Definition']) {
      alert(error['Request.Definition'][0], { error: true });
      return;
    }
    if (error.detail || error.title) {
      alert(error.detail, { title: error.title, error: true });
      return;
    }
    const content = Language.get('addnodefailed');
    const title = Language.get('networkerror');
    alert(content, { title, error: true });
  };
}
export default new CauseEffect();
