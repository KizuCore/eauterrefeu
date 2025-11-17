

<template>
  <div>
    <h2>Forêt {{ width }} x {{ height }}</h2>
    <div class="table-container">
      <table class="grid-table">
        <tbody>
          <tr v-for="r in rows" :key="r">
            <td
              v-for="c in cols"
              :key="`${r}-${c}`"
              :class="['field', stateClass(cellId(r - 1, c - 1))]"
            ><div class="carre"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API_URL = 'http://localhost:3000/api' // backend config

// taille de la grille 
const width = ref(0)
const height = ref(0)

// 1..N pour v-for (on les recalculera quand width/height changent)
const rows = ref(Array.from({ length: height.value }, (_, i) => i + 1))
const cols = ref(Array.from({ length: width.value },  (_, i) => i + 1))

// Ensemble des cellules en feu
const burning = ref(new Map()) // id -> timer
const bah = ref(new Set())     // brûlé chaud
const bac = ref(new Set())     // brûlé froid

// paramètres venant de la config
const wind = ref(2)
const probaSendBrandonBase = ref(0.005)
const probaBurn = ref(0.3)
const probaFireStop = ref(0.6)

let isFinished = false

// id stable pour la cellule (0..N-1)
const cellId = (rIdx, cIdx) => rIdx * width.value + cIdx

// entier 0..(n-1)
const rand = (n) => Math.floor(Math.random() * n)

function stateClass(id) {
  if (burning.value.has(id)) return 'burning'
  if (bah.value.has(id))     return 'hot'
  if (bac.value.has(id))     return 'cold'
  return 'veg'
}

// tire deux entiers distincts 0..(max-1)
function pickTwoDistinct(max) {
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
}

function play() {
  if (isEndGame()) {
    isFinished = true
    console.log('🔥 Jeu terminé')
    return
  }

  setTimeout(() => {
    playTurn()
    play() // se rappelle lui-même
  }, 100)
}

function playTurn() {
  const currentState = []
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

function fireStop(fieldBurn) {
  const stat = Math.random()
  return stat <= probaFireStop.value
}

function canSendBrandon(fieldBurn) {
  const proba = probaSendBrandonBase.value * 1 + wind.value
  const stat = Math.random()
  return stat <= proba
}

function isValidField(field) {
  // max index = width*height - 1
  return field >= 0 && field < height.value * width.value
}

function canBeBurned(field) {
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

function getNeighborhood(fieldBurn) {
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

// 🔌 IPC : on charge la config depuis Node AVANT de lancer le feu
async function loadConfigFromApi() {
  try {
    const res = await fetch(`${API_URL}/config`)
    const cfg = await res.json()

    // --- on met à jour width/height ---
    if (typeof cfg.width === 'number' && typeof cfg.height === 'number') {
      width.value = cfg.width
      height.value = cfg.height
      // ⚠️ recalcul des lignes/colonnes
      rows.value = Array.from({ length: height.value }, (_, i) => i + 1)
      cols.value = Array.from({ length: width.value },  (_, i) => i + 1)
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
  }
}

onMounted(async () => {
  await loadConfigFromApi() // 🔌 récupère width/height = 10 x 10
  initGame()
  play()
})
</script>



