<template>
  <div>
    <h2>Forêt {{ width }} x {{ height }}</h2>

    <div class="controls">
      <label>
        Largeur
        <input type="number" v-model.number="width" min="5" max="200" />
      </label>

      <label>
        Hauteur
        <input type="number" v-model.number="height" min="5" max="200" />
      </label>

      <label>Direction du vent
        <select v-model="wind">
          <option :value="0">Nord</option>
          <option :value="1">Sud</option>
          <option :value="2">Ouest</option>
          <option :value="3">Est</option>
        </select>
      </label>

      <label>Force du vent
        <select v-model="wind">
          <option :value="0">Nul</option>
          <option :value="1">Modéré</option>
          <option :value="2">Fort</option>
          <option :value="3">Violent</option>
        </select>
      </label>

      <label>Sol
        <select v-model="fieldType">
          <option value="humide">Humide</option>
          <option value="normal">Normal</option>
          <option value="sec">Sec</option>
          <option value="tres_sec">Très sec</option>
        </select>
      </label>

      <label>Terrain
        <select v-model="terrain">
          <option value="continu">Continu</option>
          <option value="peu">Peu espacé</option>
          <option value="espace">Espacé</option>
          <option value="clair">Clairsemé</option>
        </select>
      </label>


      <button @click="startSimulation" :disabled="isPlaying">
        {{ isStopped? "Reset" : "Lancer" }}
      </button>
      <button v-if="isPlaying" @click="togglePause">
        Pause
      </button>
      <button v-if="!isPlaying && !isFinished" @click="togglePause">
        Reprendre
      </button>
    </div>


    <div class="table-container">
      <table class="grid-table">
        <tbody>
          <tr v-for="r in rows" :key="r">
            <td v-for="c in cols" :key="`${r}-${c}`" :class="['field', stateClass(cellId(r - 1, c - 1))]">
              <div class="carre"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<script setup lang="ts">
import { debug } from 'console'
import { ref, onMounted } from 'vue'

const API_URL = 'http://localhost:3000/api' // backend 

// taille de la grille par défaut
const width = ref(5)
const height = ref(5)
let seed : number = 0.877728959950038;
console.log(seed);
let wind_pattern: any[] = [];
const fieldType = ref<'humide' | 'normal' | 'sec' | 'tres_sec'>('normal')
const terrain  = ref<'continu'|'peu'|'espace'|'clair'>('continu')

// 1..N pour v-for
const rows = ref<number[]>([])
const cols = ref<number[]>([])

// Ensemble cellules en feu
const burning = ref(new Map<number, number>()) // id -> timer
const bah = ref(new Set<number>())             // brûlé chaud
const bac = ref(new Set<number>())             // brûlé froid

// paramètres venant de la config
const wind = ref(1)

const isFinished = ref(false)
const isPlaying = ref(false)   // savoir si la simu tourne
const isStopped = ref(false)          
let timerId: number | null = null     // pour annuler le setTimeout

function rebuildGrid() {
  rows.value = Array.from({ length: height.value }, (_, i) => i + 1)
  cols.value = Array.from({ length: width.value }, (_, i) => i + 1)
}

// id stable pour la cellule (0..N-1)
const cellId = (rIdx: number, cIdx: number) => rIdx * width.value + cIdx

// entier 0..(n-1)
const rand = (n: number) => Math.floor(Math.random() * n)


function stateClass(id: number) {
  if (burning.value.has(id)) return 'burning' 
  if (bah.value.has(id))     return 'hot'    
  if (bac.value.has(id))     return 'cold'    
  return 'veg'                                 
}

function removeValue<T>(array: T[], value: T): T[] {
  return array.filter(item => item !== value);
}

function getFieldProba(ft: 'humide' | 'normal' | 'sec' | 'tres_sec'): number {
  switch (ft) {
    case 'humide':
      return 0.1
    case 'normal':
      return 0.3
    case 'sec':
      return 0.6
    case 'tres_sec':
      return 0.9
  }
}

// tire deux entiers distincts 0..(max-1)
function pickThreeDistinct(max: number): [number, number, number] {
  let initialFieldBurningID = rand(max)
  let initialFieldBurningID2 = rand(max)
  let initialFieldBurningID3 = rand(max)
  while (initialFieldBurningID2 === initialFieldBurningID) initialFieldBurningID2 = rand(max)
  while (initialFieldBurningID3 === initialFieldBurningID && initialFieldBurningID3 === initialFieldBurningID2) initialFieldBurningID3 = rand(max)
  return [initialFieldBurningID, initialFieldBurningID2, initialFieldBurningID3]
}

function initGame() {
  burning.value.clear()
  bah.value.clear()
  bac.value.clear()

  const [id1, id2, id3] = pickThreeDistinct(width.value * height.value)
  burning.value.set(id1, 2)
  burning.value.set(id2, 2)
  burning.value.set(id3, 2)
}

function loop() {
  if (!isPlaying.value) return

  if (isEndGame()) {
    isFinished.value = true
    isPlaying.value = false
    console.log('🔥 Jeu terminé')
    return
  }

  playTurn()
  timerId = window.setTimeout(loop, 100)
}

/** Démarre / relance la simulation */
function play() {
  if (isPlaying.value) return   // déjà en cours
  isPlaying.value = true
  isStopped.value = false
  loop()
}

function getFieldFromCoord(coord: { x: number, y:number, proba:number }, fieldBurn : number){
  return fieldBurn + coord.x + (coord.y*height.value);
}

function canReiceiveBrandon(proba : number){
  let value = randomiseValue(seed);
  return proba <= value
}

function playTurn(){
  let currentState: any[] = [];
  //On parcours les bosqués à l'état burn / burn and hot
  const merged = [...burning.value.keys(), ...bah.value];
  for (const fieldBurn of merged) {    
    wind_pattern.forEach(coord => {
      let field = getFieldFromCoord(coord, fieldBurn);
      let proba = coord.proba;
      if(!isOutOfBound(fieldBurn, field,coord.x, coord.y) && canSendBrandon() && canReiceiveBrandon(proba) && canBeBurned(field)){
        if(tryToBurn()){
          currentState.push(field);
        }
      }
    })
  }

  currentState.forEach(value => {
    burning.value.set(value, 2)
  })

  merged.forEach(fieldBurn => {
    const isBurning = burning.value.has(fieldBurn)
    if (isBurning) {
      const newTimer = (burning.value.get(fieldBurn) ?? 1) - 1
      if (newTimer <= 0) {
        burning.value.delete(fieldBurn)
        bah.value.add(fieldBurn)
      } else {
        burning.value.set(fieldBurn, newTimer)
      }
    }else{
      if(fireStop()){
        bah.value.delete(fieldBurn);
        bac.value.add(fieldBurn);
      }
    }
  })
}

function fireStop(){
  let proba = 0.6;
  let stat = randomiseValue(seed);
  return stat <= proba
}

function canSendBrandon(){
  let proba = 0.005 * (1 + wind.value)
  let stat = randomiseValue(seed);
  return stat <= proba
}

function isValidField(field: number){
  return field <= (height.value*width.value) -1 && field > 0
}

function canBeBurned(field: number){
  return (isValidField(field) && !burning.value.has(field) && !bah.value.has(field) && !bac.value.has(field));
}

function tryToBurn(){
  const ft = fieldType.value 
  let proba = getFieldProba(ft);
  let stat = randomiseValue(seed);
  if(proba != undefined && stat < proba){
    return true
  }
  return false
}

function isOutOfBound(initialField : number, burningField : number, coordX : number, coordY: number){
  let isOutOfBound = !isValidField(burningField);
  if(isOutOfBound){
    return true
  }
  if(coordY === 0){
    return Math.floor(initialField / 10) !== Math.floor(burningField / 10);
  }

  //Si on dépasse de la droite 
  if((initialField+coordX)%height.value == 0 && ((initialField+2)%height.value == 0 || (initialField+1)%height.value == 0)){
    return true;
  }

  //Si on dépasse de la gauche
  if((initialField+1+coordX)%height.value == 0 && (initialField%height.value == 0 || (initialField-1)%height.value == 0)){
    return true;
  }
  return isOutOfBound;
}

function isEndGame() {
  return burning.value.size === 0 && bah.value.size === 0
}

// charge config depuis Node au chargement
async function loadConfigFromApi() {
  try {
    const res = await fetch(`${API_URL}/config`)
    const cfg = await res.json()

    const jsonGet = await fetch(`${API_URL}/nul_wind`)
    const jsonApi = await jsonGet.json()

    if (typeof cfg.width === 'number' && typeof cfg.height === 'number') {
      width.value = cfg.width
      height.value = cfg.height
      wind_pattern = jsonApi;
      rebuildGrid()
    } else {
      rebuildGrid()
    }

    if (typeof cfg.wind === 'number') wind.value = cfg.wind
    if (typeof cfg.fieldType === 'string') fieldType.value = cfg.fieldType
    if (typeof cfg.terrain === 'string') terrain.value = cfg.terrain

  } catch (e) {
    console.error('Erreur de chargement de la config API', e)
    rebuildGrid()
  }
}

/** bouton Pause */
function pause() {
  isPlaying.value = false
  isStopped.value = true
  if (timerId !== null) {
    clearTimeout(timerId)
    timerId = null
  }
}
function togglePause() {
  if (isPlaying.value) {
    pause()
  } else {
    if (!isEndGame()) {
      play()
    }
  }
}

async function startSimulation() {
  // envoie nouvelle taille au backend
  try {
    await fetch(`${API_URL}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        width: width.value,
        height: height.value,
        wind: wind.value,
        fieldType: fieldType.value,
        terrain: terrain.value
      }),
    })
  } catch (e) {
    console.error('Erreur lors de la mise à jour de la config', e)
  }

  // reconstruit grille selon taille choisie
  rebuildGrid()

  // arrête une éventuelle simu en cours
  pause()

  // lance nouvelle partie
  initGame()
  play()
}

onMounted(async () => {
  await loadConfigFromApi()   // récupère variables
})


function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }
}

function randomiseValue(seed: number): number{
  return mulberry32(Math.random()*2**32)();
}
</script>
