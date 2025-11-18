const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const NUL_WIND_PATH = path.join(__dirname, 'nul_wind.json');
const WEAK_WIND_PATH = path.join(__dirname, 'weak_wind.json');
const STRONG_WIND_PATH = path.join(__dirname, 'strong_wind.json');
const VIOLENT_WIND_PATH = path.join(__dirname, 'violent_wind.json');
const CONFIG_PATH = path.join(__dirname, 'config.json');

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function readNulWindPattern() {
  return JSON.parse(fs.readFileSync(NUL_WIND_PATH, 'utf-8'));
}

function readWeakWindPattern() {
  return JSON.parse(fs.readFileSync(WEAK_WIND_PATH, 'utf-8'));
}

function readStrongWindPattern() {
  return JSON.parse(fs.readFileSync(STRONG_WIND_PATH, 'utf-8'));
}

function readViolentPattern() {
  return JSON.parse(fs.readFileSync(VIOLENT_WIND_PATH, 'utf-8'));
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

// GET wind weak 
app.get('/api/weak_wind', (req, res) => {
  const cfg = readWeakWindPattern();
  res.json(cfg);
});

// GET wind strong 
app.get('/api/strong_wind', (req, res) => {
  const cfg = readStrongWindPattern();
  res.json(cfg);
});

// GET wind violent 
app.get('/api/violent_wind', (req, res) => {
  const cfg = readViolentPattern();
  res.json(cfg);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Config API en écoute sur http://localhost:${PORT}`);
});