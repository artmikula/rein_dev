import similarityCosine from './similarityCosine';

describe('test similarityCosine', () => {
  it('test _distinctValues successful', async () => {
    const array1 = ['a', 'b', 'c'];
    const array2 = ['c', 'd', 'e', 'a', 'f'];
    const result = ['a', 'b', 'c', 'd', 'e', 'f'];
    const distincts = similarityCosine._distinctValues(array1, array2);

    expect(result).toEqual(distincts);
  });

  it('test _frequency successful', async () => {
    const array1 = ['a', 'b', 'c', 'd', 'e', 'f'];
    const array2 = ['a', 'b', 'c', 'a', 'b', 'd', 'a'];
    const frequencyDist = similarityCosine._frequency(array1, array2);

    expect(frequencyDist.a).toEqual(3);
    expect(frequencyDist.b).toEqual(2);
    expect(frequencyDist.c).toEqual(1);
    expect(frequencyDist.d).toEqual(1);
    expect(frequencyDist.e).toEqual(0);
    expect(frequencyDist.f).toEqual(0);
  });

  it('test distance with an array empty failed', () => {
    const array1 = ['a', 'b', 'c', 'd'];
    const array2 = [];
    const distance = similarityCosine.distance(array1, array2);
    expect(distance).toEqual(Math.PI);
  });

  it('test distance with two same arrays successful', () => {
    const array = ['a', 'b', 'c', 'd'];
    const distance = similarityCosine.distance(array, array);
    expect(distance).toBeCloseTo(Math.acos(1), 4);
  });

  it('test distance with two dissimilar arrays successful', () => {
    const array1 = ['a', 'b', 'c', 'd'];
    const array2 = ['e', 'f', 'g', 'h'];
    const distance = similarityCosine.distance(array1, array2);
    expect(distance).toBeCloseTo(Math.acos(0), 4);
  });

  it('test distance with two half similar arrays successful', () => {
    const array1 = ['a', 'b', 'c', 'd'];
    const array2 = ['c', 'd', 'e', 'f'];
    const distance = similarityCosine.distance(array1, array2);
    expect(distance).toBeCloseTo(Math.acos(0.5), 4);
  });

  it('test distance successful', () => {
    const array1 = ['a', 'b', 'c', 'd'];
    const array2 = ['p', 'r', 'e', 't', 'e', 'n', 'd'];
    const distance = similarityCosine.distance(array1, array2);
    expect(distance).toBeCloseTo(1.40334, 4);
  });
});
