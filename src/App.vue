<template>
  <div class="app">
    <h1>Bienvenue sur EauTerreFeu v 0.2.0</h1>
    <p v-if="updateAvailable">Une nouvelle version est disponible 🎉</p>
  </div>
  <HelloWorld msg="Vite + Vue" />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
// @ts-ignore: No declaration file for .vue modules
import HelloWorld from './components/HelloWorld.vue';

const updateAvailable = ref(false);

onMounted(() => {
  window.electronAPI?.onUpdateReady(() => {
    updateAvailable.value = true;
  });
});
</script>
