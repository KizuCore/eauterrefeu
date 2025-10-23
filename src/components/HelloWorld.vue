

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
            :class="{ burning: burning.has(cellId(r - 1, c - 1)) }"
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
const burning = ref(new Set())
const burningAndHot = ref(new Set())

// id stable pour la cellule (0..24)
const cellId = (rIdx, cIdx) => rIdx * width + cIdx

// entier 0..(n-1)
const rand = (n) => Math.floor(Math.random() * n)

let isFinished = false;

let intialFieldBurningID;
let intialFieldBurningID2;

// tire deux entiers distincts 0..(max-1)
function pickTwoDistinct(max) {
  intialFieldBurningID = rand(max)
  intialFieldBurningID2 = rand(max)
  while (intialFieldBurningID2 === intialFieldBurningID) intialFieldBurningID2 = rand(max)
  return [intialFieldBurningID, intialFieldBurningID2]
}

function initGame() {
  pickTwoDistinct(width * height) 
  burning.value = new Set([intialFieldBurningID, intialFieldBurningID2])
}

function play(){
  while(!isFinished){
    setTimeout(() => {
      playTurn();
      console.log('Timeout atteint après 1 seconde !');
    }, 1000);
    isFinished = true;
  }
}

function playTurn(){
  let currentState = [];
  burning.value.forEach(fieldBurn => {
      let field = fieldBurn + height;
      if(canBeBurned(field)){
        currentState.push(field);
      }
    }
  )
  currentState.forEach(value => {
     burning.value.add(value);
  })
}

function canBeBurned(field){
  return (field <= 25 && field >= 0 && !burning.value.has(field));
}

onMounted(() => {
  initGame()
  play();
})
</script>

