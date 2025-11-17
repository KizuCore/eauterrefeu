const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const NUL_WIND_PATH = path.join(__dirname, 'nul_wind.json');
const CONFIG_PATH = path.join(__dirname, 'config.json');

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function readNulWindPattern() {
  return JSON.parse(fs.readFileSync(NUL_WIND_PATH, 'utf-8'));
}

function writeConfig(newConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
}

// GET config actuelle
app.get('/api/config', (req, res) => {
  const cfg = readConfig();
  res.json(cfg);
});

// PUT pour MAJ config
app.put('/api/config', (req, res) => {
  const current = readConfig();
  const updated = { ...current, ...req.body };
  writeConfig(updated);
  res.json(updated);
});

// GET wind nul 
app.get('/api/nul_wind', (req, res) => {
  const cfg = readNulWindPattern();
  res.json(cfg);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Config API en écoute sur http://localhost:${PORT}`);
});