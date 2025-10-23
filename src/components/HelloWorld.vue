

<template>
  <div class="app">
    <h2>Forêt 5x5</h2>
    <div class="controls">
      <label>Vent
        <select v-model="wind">
          <option :value="0">Nul</option>
          <option :value="1">Modéré</option>
          <option :value="2">Fort</option>
          <option :value="3">Violent</option>
        </select>
      </label>

      <label>Humidité
        <select v-model="humidity">
          <option value="humide">Humide</option>
          <option value="normale">Normale</option>
          <option value="seche">Sèche</option>
          <option value="tres_seche">Très sèche</option>
        </select>
      </label>

      <label>Terrain
        <select v-model="terrain">
          <option value="continue">Continue</option>
          <option value="peu">Peu espacée</option>
          <option value="espacee">Espacée</option>
          <option value="claire">Clairsemée</option>
        </select>
      </label>

      <button @click="resetGame">Reset</button>
      <button @click="play">Play</button>
    </div>

    <table class="grid-table">
      <tbody>
        <tr v-for="r in rows" :key="r">
          <td
            v-for="c in cols"
            :key="`${r}-${c}`"
            :class="['field', stateClass(cellId(r - 1, c - 1))]"
          >
          </td>
        </tr>
      </tbody>
    </table>

    <div class="legend">
      <span class="dot veg"></span> Végétation
      <span class="dot burning"></span> En feu
      <span class="dot hot"></span> Brûlé chaud
      <span class="dot cold"></span> Brûlé froid
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'

let isFinished = false; // indique si le jeu est terminé
let isPlaying = false // indique si la boucle de jeu est en cours
let timerId = null // pour stocker l'ID du timer

const wind = ref<0|1|2|3>(1) // vent (0..3)
const humidity = ref<'humide'|'normale'|'seche'|'tres_seche'>('normale')
const terrain  = ref<'continue'|'peu'|'espacee'|'claire'>('peu')


const DENS = { continue: 1.0, peu: 0.95, espacee: 0.8, claire: 0.5 }
const P_IGNITE = { humide: 0.1, normale: 0.3, seche: 0.6, tres_seche: 0.9 }

function stateClass(id) {
  if (burning.value.has(id)) return 'burning' 
  if (bah.value.has(id))     return 'hot'    
  if (bac.value.has(id))     return 'cold'    
  return 'veg'                                 
}

const width = 5
const height = 5

// 1..N pour v-for
const rows = ref(Array.from({ length: height }, (_, i) => i + 1))
const cols = ref(Array.from({ length: width },  (_, i) => i + 1))

// Ensemble des cellules en feu
const burning = ref(new Map())
const bah = ref(new Set())
const bac = ref(new Set())


// id stable pour la cellule (0..24)
const cellId = (rIdx, cIdx) => rIdx * width + cIdx

// entier 0..(n-1)
const rand = (n) => Math.floor(Math.random() * n)

// tire deux entiers distincts 0..(max-1)
function pickTwoDistinct(max) {
  let intialFieldBurningID = rand(max)
  let intialFieldBurningID2 = rand(max)
  while (intialFieldBurningID2 === intialFieldBurningID) intialFieldBurningID2 = rand(max)
  return [intialFieldBurningID, intialFieldBurningID2]
}


/* Initialise le jeu en mettant deux cellules en feu */
function initGame() {
  const [id1, id2] = pickTwoDistinct(width * height)
  burning.value.set(id1, 2)
  burning.value.set(id2, 2)
}

/* Démarre la boucle principale du jeu */
function play() {
  if (isPlaying) return  // empêche de relancer si déjà en cours
  isPlaying = true
  loop()
}

/* Boucle principale du jeu */
function loop() {
  if (isEndGame()) {
    isPlaying = false
    isFinished = true
    console.log('🔥 Jeu terminé')
    return
  }

  playTurn()
  if (isPlaying) {
    timerId = setTimeout(loop, 1000)
  }
}



/* Joue un tour de jeu */
function playTurn(){
  let currentState = [];
  //On parcours les bosqués à l'état burn / burn and hot
  let currentBurningField = burning.value + bah.value;
  for (const fieldBurn of burning.value.keys()) {    
    let isHot = bah.value.has(fieldBurn);
    let field = fieldBurn + height;
    if(canSendBrandon(fieldBurn) && canBeBurned(field)){
      if(tryToBurn(currentState, field)){
        currentState.push(field);
      }
    }
    if(!isHot){
      burning.value.set(fieldBurn, burning.value.get(fieldBurn)-1) 
      if(burning.value.get(fieldBurn) == 0){
        burning.value.delete(fieldBurn)
        bah.value.add(fieldBurn);
      }
    }
  }
  currentState.forEach(value => {
     burning.value.set(value, 2);
  })
}

/* Vérifie si une cellule en feu peut envoyer des braises */
function canSendBrandon(fieldBurn){
  let proba = 0.005 * 1 + wind
  let stat = Math.floor(Math.random());
  return stat <= proba
}

/* Vérifie si une cellule peut être brûlée */
function canBeBurned(field){
  return (field <= 25 && field >= 0 && !burning.value.has(field) && !bah.value.has(field));
}

/* Tente de brûler une cellule voisine */
function tryToBurn(currentState){
  let proba = 0.3
  let stat = Math.floor(Math.random());
  if(stat <= proba){
    return true
  }
  return false
}

/* Vérifie si le jeu est terminé */
function isEndGame(){
  return burning.length == 0 && bah.length == 0
}

function resetGame() {
  // stopper boucle 
  isPlaying = false
  if (timerId !== null) {
    clearTimeout(timerId)
    timerId = null
  }

  // vider structures
  burning.value.clear()
  bah.value.clear()
  bac.value.clear()

  // réinitialiser flags
  isFinished = false

  // relancer
  initGame()
}


onMounted(() => {
  initGame()
})
</script>

