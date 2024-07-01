<script setup lang="ts">
const props = defineProps<{
  userId?: string;
}>();
const { canDo } = usePermissions();
</script>

<template>
  <ClientsList :userId="userId" v-if="canDo('clients', 'list')" />
  <div v-else class="card">
    <p class="text-center font-medium text-xl">
      You don't have access of the Assigned Clients list.
    </p>
  </div>
</template>
