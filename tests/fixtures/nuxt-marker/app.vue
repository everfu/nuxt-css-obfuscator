<script setup lang="ts">
const active = ref(true);
</script>

<template>
  <p class="shared">Outside</p>
  <section class="obfuscate shared" :class="{ active }">
    <span class="inner">Inside</span>
  </section>
</template>

<style>
.shared { color: blue; }
.active { font-weight: bold; }
.inner { display: inline; }
</style>
