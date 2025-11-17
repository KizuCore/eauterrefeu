<template>
  <div>
    <h2>Forêt 5x5 v0.3</h2>

    <table class="grid-table">
      <tbody>
        <tr v-for="r in rows" :key="r">
          <td
            v-for="c in cols"
            :key="`${r}-${c}`"
            :class="['field', stateClass(cellId(r - 1, c - 1))]"
          ></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const width = 10;
const height = 10;

// 1..N pour v-for
const rows = ref(Array.from({ length: height }, (_, i) => i + 1));
const cols = ref(Array.from({ length: width }, (_, i) => i + 1));

// Ensemble des cellules en feu
const burning = ref(new Map());
const bah = ref(new Set());
const bac = ref(new Set());

const wind = 2;

// id stable pour la cellule (0..24)
const cellId = (rIdx, cIdx) => rIdx * width + cIdx;

// entier 0..(n-1)
const rand = (n) => Math.floor(Math.random() * n);

let isFinished = false;

function stateClass(id) {
  if (burning.value.has(id)) return "burning";
  if (bah.value.has(id)) return "hot";
  if (bac.value.has(id)) return "cold";
  return "veg";
}

// tire deux entiers distincts 0..(max-1)
function pickTwoDistinct(max) {
  let intialFieldBurningID = rand(max);
  let intialFieldBurningID2 = rand(max);
  while (intialFieldBurningID2 === intialFieldBurningID)
    intialFieldBurningID2 = rand(max);
  return [intialFieldBurningID, intialFieldBurningID2];
}

function initGame() {
  const [id1, id2] = pickTwoDistinct(width * height);
  burning.value.set(id1, 2);
  burning.value.set(id2, 2);
}

function play() {
  if (isEndGame()) {
    isFinished = true;
    console.log("🔥 Jeu terminé");
    return;
  }

  setTimeout(() => {
    playTurn();
    play(); // se rappelle lui-même
  }, 1000);
}

function playTurn() {
  let currentState = [];
  //On parcours les bosqués à l'état burn / burn and hot
  const merged = [...burning.value.keys(), ...bah.value];
  for (const fieldBurn of merged) {
    let fields = getNeighborhood(fieldBurn);
    fields.forEach((field) => {
      if (canSendBrandon(fieldBurn) && canBeBurned(field)) {
        if (tryToBurn(currentState, field)) {
          currentState.push(field);
        }
      }
    });
  }
  currentState.forEach((value) => {
    burning.value.set(value, 2);
  });
  merged.forEach((fieldBurn) => {
    let isBurning = burning.value.has(fieldBurn);
    if (isBurning) {
      burning.value.set(fieldBurn, burning.value.get(fieldBurn) - 1);
      if (burning.value.get(fieldBurn) == 0) {
        burning.value.delete(fieldBurn);
        bah.value.add(fieldBurn);
      }
    } else {
      if (fireStop(fieldBurn)) {
        bah.value.delete(fieldBurn);
        bac.value.add(fieldBurn);
      }
    }
  });
}

function fireStop(fieldBurn) {
  let proba = 0.6;
  let stat = Math.random();
  return stat <= proba;
}

function canSendBrandon(fieldBurn) {
  let proba = 0.005 * 1 + wind;
  let stat = Math.random();
  return stat <= proba;
}

function isValidField(field) {
  return field <= height * width && field >= 0;
}

function canBeBurned(field) {
  return (
    isValidField(field) &&
    !burning.value.has(field) &&
    !bah.value.has(field) &&
    !bac.value.has(field)
  );
}

function tryToBurn(currentState) {
  let proba = 0.3;
  let stat = Math.floor(Math.random());
  if (stat <= proba) {
    return true;
  }
  return false;
}

function getNeighborhood(fieldBurn) {
  let fields = [
    fieldBurn + 1,
    fieldBurn - 1,
    fieldBurn + width,
    fieldBurn - height,
  ];
  fields.forEach((field) => {
    if (!isValidField(field)) {
      fields.pop(field);
    }
  });
  return fields;
}

function isEndGame() {
  return burning.length == 0 && bah.length == 0;
}

onMounted(() => {
  initGame();
  play();
});
</script>
