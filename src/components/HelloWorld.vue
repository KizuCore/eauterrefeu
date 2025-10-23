

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

