<script setup lang="ts">
const props = defineProps<{
  userId: string;
}>();

const { canDo } = usePermissions();
</script>

<template>
  <ProjectList v-if="canDo('projects', 'list')" :userId="userId" />
  <div v-else class="card">
    <p class="text-center font-medium text-xl">
      You don't have access of the Active & Scheduled projects list.
    </p>
  </div>
</template>
