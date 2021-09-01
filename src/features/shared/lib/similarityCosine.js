class SimilarityCosine {
  // return distinct elements of firstArray and secondArray
  _distinctValues = (firstArray, secondArray) => {
    const distincts = {};
    firstArray.forEach((value) => {
      distincts[value] = 1;
    });
    secondArray.forEach((value) => {
      distincts[value] = 1;
    });

    return Object.keys(distincts);
  };

  // return frequency of each pattern elements exist in source
  /* result is an object with keys is value of pattern elements,
     and values each the keys is frequency of key in source */
  _frequency = (pattern, source) => {
    const frequencies = {};
    pattern.forEach((key) => {
      frequencies[key] = 0;
    });
    source.forEach((value) => {
      if (typeof frequencies[value] !== 'undefined') {
        frequencies[value]++;
      }
    });

    return frequencies;
  };

  distance = (firstArray, secondArray) => {
    if (firstArray.length === 0 || secondArray.length === 0) {
      return Math.PI;
    }

    // find distinct list of items from two lists, used to align frequency distributions from two lists
    const distincts = this._distinctValues(firstArray, secondArray);

    // calculate frequency distributions for each list.
    const firstFD = this._frequency(distincts, firstArray);
    const secondFD = this._frequency(distincts, secondArray);

    let dotProduct = 0.0;
    let l2norm1 = 0.0;
    let l2norm2 = 0.0;

    distincts.forEach((key) => {
      const firstFDValue = firstFD[key];
      const secondFDValue = secondFD[key];
      dotProduct += firstFDValue * secondFDValue;
      l2norm1 += firstFDValue * firstFDValue;
      l2norm2 += secondFDValue * secondFDValue;
    });

    const cos = dotProduct / (Math.sqrt(l2norm1) * Math.sqrt(l2norm2));

    return Math.acos(Number(cos).toFixed(4));
  };

  distanceTwoString = (firstString, secondString) => this.distance(firstString.split(''), secondString.split(''));
}

export default new SimilarityCosine();
