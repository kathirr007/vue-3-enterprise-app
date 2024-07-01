<script setup lang="ts">
const route = useRoute();
const clientId = ref(route.params.id as string);
</script>

<template>
  <div>
    <ClientsUpdateStates :id="clientId" />
  </div>
</template>

<style lang="scss" scoped></style>
