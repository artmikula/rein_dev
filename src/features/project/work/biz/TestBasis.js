import { STRING } from 'features/shared/constants';

class TestBasis {
  constructor() {
    this._drawContentState = {
      blocks: [],
      entityMap: {},
    };
  }

  set(content) {
    this._drawContentState = { ...content };
  }

  getEntity(definition, anchorKey, start, end) {
    const { blocks, entityMap } = this._drawContentState;
    const entities = Object.values(entityMap);
    const existEntities = entities.filter((e) => e.data.definition === definition);
    let result = { definition };
    if (existEntities.length > 1 || definition.trim().length === 0) {
      return null;
    }
    if (existEntities.length === 1) {
      blocks.forEach((block) => {
        if (block.key === anchorKey) {
          block.entityRanges.forEach((entity) => {
            const { offset, length } = entity;
            if (offset === start && offset + length === end) {
              result = { ...existEntities[0].data };
            }
          });
        }
      });
    }

    return result;
  }

  removeEntity(definitionId) {
    const { blocks, entityMap } = this._drawContentState;
    let removeEntityKey;
    Object.keys(entityMap).forEach((key) => {
      if (entityMap[key].data.definitionId === definitionId) {
        removeEntityKey = key;
      }
    });
    delete entityMap[removeEntityKey];

    blocks.forEach((block) => {
      const removeIndex = block.entityRanges.findIndex((e) => e.key.toString() === removeEntityKey);
      if (removeIndex >= 0) {
        block.entityRanges.splice(removeIndex, 1);
      }
    });
    return { blocks, entityMap };
  }

  findRemovedEntities(newContent) {
    const entities = Object.values(this._drawContentState.entityMap);
    const newEntities = Object.values(newContent.entityMap);
    const removedEntities = [];
    if (entities.length > newEntities.length) {
      entities.forEach((entity) => {
        const index = newEntities.findIndex((e) => e.data.definitionId === entity.data.definitionId);
        if (index < 0) {
          removedEntities.push(entity.data);
        }
      });
    }
    return removedEntities;
  }

  checkSameEntity(anchorKey, start, end) {
    const { blocks, entityMap } = this._drawContentState;
    const block = blocks.find((x) => x.key === anchorKey);

    if (block) {
      for (let i = 0; i < block.entityRanges.length; i++) {
        const entityRange = block.entityRanges[i];
        const entity = entityMap[entityRange.key];

        if (entity.type === STRING.DEFINITION) {
          const rangeStart = entityRange.offset;
          const rangeEnd = entityRange.offset + entityRange.length;

          if (rangeStart >= start && rangeStart < end) {
            return true;
          }

          if (rangeEnd > start && rangeEnd <= end) {
            return true;
          }

          if (start >= rangeStart && start < rangeEnd) {
            return true;
          }

          if (end > rangeStart && end <= rangeEnd) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
export default new TestBasis();
