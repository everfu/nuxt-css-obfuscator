<script setup lang="ts">
const active = ref(true);

onMounted(() => {
  document.querySelector('.shell')?.classList.toggle('mounted', true);
});
</script>

<template>
  <main id="hero" class="shell" :class="{ active }">
    <h1 class="title">Nuxt CSS Obfuscator integration</h1>
  </main>
</template>

<style>
#hero.shell { min-height: 10px; }
.title { animation: pulse 1s ease-in-out; }
.active { color: green; }
.mounted { display: block; }
@keyframes pulse { from { opacity: 0; } to { opacity: 1; } }
</style>
