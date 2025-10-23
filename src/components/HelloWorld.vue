

<template>
  <div>
    <h2>Forêt 5x5</h2>

    <table class="grid-table">
      <tbody>
        <tr v-for="r in rows" :key="`r-${r}`">
          <td
            v-for="c in cols"
            :key="`c-${r}-${c}`"
            class="field"
            :class="{ burning: burning.has(cellId(r - 1, c - 1)),
              bah: bah.has(cellId(r - 1, c - 1))
             }"
            :id="cellId(r - 1, c - 1)"
          >
            <span>{{ cellId(r - 1, c - 1) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const width = 5
const height = 5

// 1..N pour v-for
const rows = ref(Array.from({ length: height }, (_, i) => i + 1))
const cols = ref(Array.from({ length: width },  (_, i) => i + 1))

// Ensemble des cellules en feu
const burning = ref(new Map())
const bah = ref(new Set())
const bac = ref(new Set())

const wind = 0

// id stable pour la cellule (0..24)
const cellId = (rIdx, cIdx) => rIdx * width + cIdx

// entier 0..(n-1)
const rand = (n) => Math.floor(Math.random() * n)

let isFinished = false;

// tire deux entiers distincts 0..(max-1)
function pickTwoDistinct(max) {
  let intialFieldBurningID = rand(max)
  let intialFieldBurningID2 = rand(max)
  while (intialFieldBurningID2 === intialFieldBurningID) intialFieldBurningID2 = rand(max)
  return [intialFieldBurningID, intialFieldBurningID2]
}

function initGame() {
  const [id1, id2] = pickTwoDistinct(width * height)
  burning.value.set(id1, 2)
  burning.value.set(id2, 2)
}

function play() {
  if (isEndGame()) {
    isFinished = true;
    console.log('🔥 Jeu terminé');
    return;
  }

  setTimeout(() => {
    playTurn();
    play(); // se rappelle lui-même
  }, 1000);
}

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

function canSendBrandon(fieldBurn){
  let proba = 0.005 * 1 + wind
  let stat = Math.floor(Math.random());
  return stat <= proba
}

function canBeBurned(field){
  return (field <= 25 && field >= 0 && !burning.value.has(field) && !bah.value.has(field));
}

function tryToBurn(currentState){
  let proba = 0.3
  let stat = Math.floor(Math.random());
  if(stat <= proba){
    return true
  }
  return false
}

function isEndGame(){
  return burning.length == 0 && bah.length == 0
}

onMounted(() => {
  initGame()
  play();
})
</script>

