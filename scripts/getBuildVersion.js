const { execSync } = require("child_process");
const project = require("../package.json");

function getCommitId() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch (err) {
    console.warn("cannot get git commit version.", err);
    return;
  }
}

function getDate() {
  function pad(value) {
    return value.toString().padStart(2, "0");
  }

  var now = new Date();
  var y = pad(now.getUTCFullYear() % 2000);
  var m = pad(now.getMonth() + 1);
  var d = pad(now.getDate());
  var hh = pad(now.getHours());
  var mm = pad(now.getMinutes());
  var ss = pad(now.getSeconds());

  return `${y}${m}${d}${hh}${mm}${ss}`;
}

function getBuildVersion() {
  const date = getDate();
  const commitId = getCommitId();

  let version = `${project.version}-build.${date}`;

  if (commitId) {
    version += `+sha.${commitId}`;
  }

  return version;
}

module.exports = getBuildVersion;
