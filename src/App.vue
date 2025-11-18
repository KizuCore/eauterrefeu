<template>
  <div class="app">
    <h1>Bienvenue sur EauTerreFeu v 1.0.0</h1>
    <p v-if="updateAvailable">Une nouvelle version est disponible</p>
    <HelloWorld msg="Vite + Vue" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import HelloWorld from "./components/HelloWorld.vue";

const updateAvailable = ref(false);

onMounted(() => {
  window.electronAPI?.onUpdateReady(() => {
    updateAvailable.value = true;
  });
});
</script>
