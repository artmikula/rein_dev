/* eslint-disable no-restricted-globals */

const workercode = () => {
  self.onmessage = async function () {
    await self.postMessage('done');
  };
};

let code = workercode.toString();
code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));

const blob = new Blob([code], { type: 'application/javascript' });
const workerScript = URL.createObjectURL(blob);

export default workerScript;
