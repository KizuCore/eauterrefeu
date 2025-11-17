

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

  <button @click="startSimulation">
    Play
  </button>

  <button @click="pause" :disabled="!isPlaying">
    Pause
  </button>
</div>


    <div class="table-container">
      <table class="grid-table">
        <tbody>
          <tr v-for="r in rows" :key="r">
            <td
              v-for="c in cols"
              :key="`${r}-${c}`"
              :class="['field', stateClass(cellId(r - 1, c - 1))]"
            >
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

// 1..N pour v-for
const rows = ref<number[]>([])
const cols = ref<number[]>([])

// Ensemble des cellules en feu
const burning = ref(new Map<number, number>()) // id -> timer
const bah = ref(new Set<number>())             // brûlé chaud
const bac = ref(new Set<number>())             // brûlé froid

// paramètres venant de la config
const wind = ref(2)
const probaSendBrandonBase = ref(0.005)
const probaBurn = ref(0.3)
const probaFireStop = ref(0.6)

let isFinished = false
const isPlaying = ref(false)          // savoir si la simu tourne
let timerId: number | null = null     // pour annuler le setTimeout

function rebuildGrid() {
  rows.value = Array.from({ length: height.value }, (_, i) => i + 1)
  cols.value = Array.from({ length: width.value },  (_, i) => i + 1)
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

// tire deux entiers distincts 0..(max-1)
function pickTwoDistinct(max: number): [number, number] {
  let id1 = rand(max)
  let id2 = rand(max)
  while (id2 === id1) id2 = rand(max)
  return [id1, id2]
}

function initGame() {
  burning.value.clear()
  bah.value.clear()
  bac.value.clear()

  const [id1, id2] = pickTwoDistinct(width.value * height.value)
  burning.value.set(id1, 2)
  burning.value.set(id2, 2)

  isFinished = false
}

function loop() {
  if (!isPlaying.value) return

  if (isEndGame()) {
    isFinished = true
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
  loop()
}

function playTurn() {
  const currentState: number[] = []
  const merged = [...burning.value.keys(), ...bah.value]

  for (const fieldBurn of merged) {
    const fields = getNeighborhood(fieldBurn)
    fields.forEach(field => {
      if (canSendBrandon(fieldBurn) && canBeBurned(field)) {
        if (tryToBurn()) {
          currentState.push(field)
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
    } else {
      if (fireStop(fieldBurn)) {
        bah.value.delete(fieldBurn)
        bac.value.add(fieldBurn)
      }
    }
  })
}

function fireStop(fieldBurn: number) {
  const stat = Math.random()
  return stat <= probaFireStop.value
}

function canSendBrandon(fieldBurn: number) {
  const proba = probaSendBrandonBase.value * 1 + wind.value
  const stat = Math.random()
  return stat <= proba
}

function isValidField(field: number) {
  // max index = width*height - 1
  return field >= 0 && field < height.value * width.value
}

function canBeBurned(field: number) {
  return (
    isValidField(field) &&
    !burning.value.has(field) &&
    !bah.value.has(field) &&
    !bac.value.has(field)
  )
}

function tryToBurn() {
  const stat = Math.random()
  return stat <= probaBurn.value
}

function getNeighborhood(fieldBurn: number) {
  const w = width.value
  const rightEdge = (fieldBurn + 1) % w === 0
  const leftEdge = fieldBurn % w === 0

  const fields = [
    rightEdge ? fieldBurn : fieldBurn + 1,
    leftEdge ? fieldBurn : fieldBurn - 1,
    fieldBurn + w,
    fieldBurn - w,
  ]

  return fields.filter(isValidField)
}

function isEndGame() {
  return burning.value.size === 0 && bah.value.size === 0
}

// charge la config depuis Node au chargement
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
    if (typeof cfg.probaSendBrandonBase === 'number') {
      probaSendBrandonBase.value = cfg.probaSendBrandonBase
    }
    if (typeof cfg.probaBurn === 'number') probaBurn.value = cfg.probaBurn
    if (typeof cfg.probaFireStop === 'number') {
      probaFireStop.value = cfg.probaFireStop
    }
  } catch (e) {
    console.error('Erreur de chargement de la config API', e)
    rebuildGrid()
  }
}

/** bouton Pause */
function pause() {
  isPlaying.value = false
  if (timerId !== null) {
    clearTimeout(timerId)
    timerId = null
  }
}

async function startSimulation() {
  // on envoie la nouvelle taille au backend
  try {
    await fetch(`${API_URL}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        width: width.value,
        height: height.value,
        wind: wind.value,
        probaSendBrandonBase: probaSendBrandonBase.value,
        probaBurn: probaBurn.value,
        probaFireStop: probaFireStop.value,
      }),
    })
  } catch (e) {
    console.error('Erreur lors de la mise à jour de la config', e)
  }

  // on reconstruit la grille selon la taille choisie
  rebuildGrid()

  // on arrête une éventuelle simu en cours
  pause()

  // on lance une nouvelle partie
  initGame()
  play()
}

onMounted(async () => {
  await loadConfigFromApi()   // récupère variables
})
</script>




