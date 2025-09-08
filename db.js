const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'users.json');

function readData() {
  if (!fs.existsSync(DB_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function saveState(state) {
  const data = readData();
  data.push({ state, createdAt: new Date().toISOString() });
  writeData(data);
}

function hasState(state) {
  return readData().some((entry) => entry.state === state);
}

module.exports = { saveState, hasState };
