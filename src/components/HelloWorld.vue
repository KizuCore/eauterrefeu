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

      <label>Vent
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

      <label>Végétation
        <select v-model="vegetation">
          <option value="continue">Continue</option>
          <option value="peu">Peu espacé</option>
          <option value="espacee">Espacé</option>
          <option value="clairsemee">Clairsemé</option>
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
import { ref, onMounted } from 'vue'

const API_URL = 'http://localhost:3000/api' // backend 

// taille de la grille par défaut
const width = ref(5)
const height = ref(5)
const fieldType = ref<'humide' | 'normal' | 'sec' | 'tres_sec'>('normal')
const vegetation  = ref<'continue'|'peu'|'espacee'|'clairsemee'>('continue')
const inert = ref(new Set<number>())

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
  if (inert.value.has(id))   return 'inert'   
  if (burning.value.has(id)) return 'burning'
  if (bah.value.has(id))     return 'hot'
  if (bac.value.has(id))     return 'cold'
  return 'veg'
}


function removeValue<T>(array: T[], value: T): T[] {
  return array.filter(item => item !== value);
}

function getTerrainVegetationProba(t: 'continue' | 'peu' | 'espacee' | 'clairsemee'): number {
  switch (t) {
    case 'continue':
      return 1.0      // 100% végétation
    case 'peu':
      return 0.95     // 95% végétation
    case 'espacee':
      return 0.80     // 80% végétation
    case 'clairsemee':
      return 0.50     // 50% végétation
  }
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

function buildTerrain() {
  inert.value.clear()

  const p = getTerrainVegetationProba(vegetation.value)
  const total = width.value * height.value

  for (let id = 0; id < total; id++) {
    const hasVegetation = Math.random() <= p
    if (!hasVegetation) {
      inert.value.add(id) // case inerte
    }
  }
}


// tire 3 entiers distincts 0..(max-1)
function pickThreeDistinct(list: number[]): [number, number, number] {
  if (list.length < 3) {
    throw new Error("Pas assez de cases végétalisées pour lancer 3 feux")
  }
  const copy = [...list]
  const id1 = copy.splice(rand(copy.length), 1)[0] as number 
  const id2 = copy.splice(rand(copy.length), 1)[0] as number
  const id3 = copy.splice(rand(copy.length), 1)[0] as number
  return [id1, id2, id3]
}

function initGame() {
  burning.value.clear()
  bah.value.clear()
  bac.value.clear()

  // Construire le terrain (végétation + inertes)
  buildTerrain()

  // Récupérer toutes les cases qui ont de la végétation
  const vegetatedCells: number[] = []
  const total = width.value * height.value

  for (let id = 0; id < total; id++) {
    if (!inert.value.has(id)) {
      vegetatedCells.push(id)
    }
  }

  // Tirer 3 feux initiaux uniquement sur ces cases
  const [id1, id2, id3] = pickThreeDistinct(vegetatedCells)
  burning.value.set(id1, 2)
  burning.value.set(id2, 2)
  burning.value.set(id3, 2)
}


function loop() {
  if (!isPlaying.value) return

  if (isEndGame()) {
    isFinished.value = true
    isPlaying.value = false
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

function playTurn(){
  let currentState: any[] = [];
  // parcours les cases à l'état burn / burn and hot
  const merged = [...burning.value.keys(), ...bah.value];
  for (const fieldBurn of merged) {    
    let fields = getNeighborhood(fieldBurn);
    fields.forEach(field => {
      if(canSendBrandon() && canBeBurned(field)){
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
  let stat =Math.random();
  return stat <= proba
}

function canSendBrandon(){
  let proba = 0.05 * (1 + wind.value)
  let stat =Math.random();
  debugger;
  return stat <= proba
}

function isValidField(field: number){
  return field <= height.value*width.value && field >= 0
}

function canBeBurned(field: number){
  return (isValidField(field) && !burning.value.has(field) && !inert.value.has(field) && !bah.value.has(field) && !bac.value.has(field));
}

function tryToBurn(){
  const ft = fieldType.value 
  let proba = getFieldProba(ft);
  let stat = Math.random();
  if(proba != undefined && stat <= proba){
    return true
  }
  return false
}

function getNeighborhood(fieldBurn: number){
  let fields =[];
  let rightEdge = (fieldBurn+1)%width.value == 0 ? true : false;
  let leftEdge = fieldBurn%width.value == 0 || fieldBurn == 0 ? true : false;
  fields = [rightEdge ? fieldBurn : fieldBurn+1, leftEdge ? fieldBurn : fieldBurn-1, fieldBurn+width.value, fieldBurn-height.value];
  fields.forEach(field =>{
    if(!isValidField(field)){
      removeValue(fields, field)
    }
  })
  return fields
}

function isEndGame() {
  return burning.value.size === 0 && bah.value.size === 0
}

// charge config depuis Node au chargement
async function loadConfigFromApi() {
  try {
    const res = await fetch(`${API_URL}/config`)
    const cfg = await res.json()

    if (typeof cfg.width === 'number' && typeof cfg.height === 'number') {
      width.value = cfg.width
      height.value = cfg.height
      rebuildGrid()
    } else {
      rebuildGrid()
    }

    if (typeof cfg.wind === 'number') wind.value = cfg.wind
    if (typeof cfg.fieldType === 'string') fieldType.value = cfg.fieldType
    if (typeof cfg.vegetation === 'string') vegetation.value = cfg.vegetation

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
        vegetation: vegetation.value
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
</script>
