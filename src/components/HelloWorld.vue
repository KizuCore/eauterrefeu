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

// 1..N pour v-for (lisible dans le template)
const rows = ref(Array.from({ length: height }, (_, i) => i + 1))
const cols = ref(Array.from({ length: width },  (_, i) => i + 1))

// Ensemble des cellules en feu (ids numériques)
const burning = ref(new Set())

// id stable pour la cellule (0..24)
const cellId = (rIdx, cIdx) => rIdx * width + cIdx

// entier 0..(n-1)
const rand = (n) => Math.floor(Math.random() * n)

// tire deux entiers distincts 0..(max-1)
function pickTwoDistinct(max) {
  const a = rand(max)
  let b = rand(max)
  while (b === a) b = rand(max)
  return [a, b]
}

function initGame() {
  const [a, b] = pickTwoDistinct(width * height) 
  burning.value = new Set([a, b])
  // console.log([...burning.value]) // debug
}

onMounted(() => {
  initGame()
})
</script>

<style scoped>
.grid-table { border-collapse: collapse; margin: 0 auto; }
.grid-table td { padding: 0; }

.field {
  width: 56px;
  height: 56px;
  text-align: center;
  vertical-align: middle;
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
.field > span {
  display: inline-block;
  font-weight: 600;
}

.burning {
  background: linear-gradient(135deg, #ff3c00, #ff8000);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  border: 1px solid #cc2a00;
  box-shadow: 0 0 10px rgba(255, 60, 0, 0.6);
}
.burning:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(255, 60, 0, 0.9);
}
</style>
