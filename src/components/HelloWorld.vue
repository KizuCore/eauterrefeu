<template>
  <div>
    <h2>Forêt 5x5</h2>
    <table class="grid-table" border="1" cellspacing="0" cellpadding="6">
      <tbody>
        <tr v-for="row in rows" :key="'r'+row"> 
          <td v-for="col in cols" :key="row + '-' + col" class="field" :id='id++'>
            <span>{{ id }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const width = 5;
const height = 5;
let id = 0;

const rows = ref(Array.from({ length: width }, (_, i) => i + 1))
const cols = ref(Array.from({ length: height }, (_, i) => i + 1))
let burnFieldID1 = getRandomInt();
let burnFieldID2 = getRandomInt();

function randomBruntField(){
  burnFieldID2 = getRandomInt();
  return (burnFieldID2 === burnFieldID1) ? randomBruntField() : burnFieldID2;
}

function getRandomInt() {
  return Math.floor(Math.random() * ((width * height)-1));
}

function initGame(){
  randomBruntField();
  console.log(burnFieldID1 + " " + burnFieldID2);
  let burnField1 = document.getElementById(burnFieldID1);
  console.log(burnField1);
  let burnField2 = document.getElementById(burnFieldID2);
  console.log(burnField2);
  burnField1.className = "burning";
  burnField2.className = "burning";
}

onMounted(() => {
  initGame()
})
</script>

<style scoped>
.grid-table { border-collapse: collapse; }
.grid-table th { background:#f0f0f0; }

.burning {
  background: linear-gradient(135deg, #ff3c00, #ff8000);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  border: 1px solid #cc2a00;
  box-shadow: 0 0 10px rgba(255, 60, 0, 0.6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.burning:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(255, 60, 0, 0.9);
}

.field {
  background: linear-gradient(135deg, #4caf50, #81c784);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  border: 1px solid #388e3c;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.field:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.9);
}

</style>
