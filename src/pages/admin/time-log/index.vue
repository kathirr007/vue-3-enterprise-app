<script setup lang="ts">
const { featureSubscribed } = usePermissions();
</script>

<template>
  <div v-if="featureSubscribed('work', 'time_sheet') === false" class="card">
    <Common426 feature="time log" />
  </div>
  <CommonPage v-else title="Time Log">
    <div class="card">
      <TimerList />
    </div>
  </CommonPage>
</template>
