<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';

const props = defineProps<{
  feature?: string;
}>();

const featureInQuery = useRouteQuery('feature');

const { titleCase } = useVueFilters();
</script>

<template>
  <div class="card shadow-3 text-center text-xl font-medium">
    <p v-if="feature || featureInQuery">
      You don't have access to
      <strong> {{ titleCase(feature || (featureInQuery as string)) }} </strong>.
    </p>
    To activate your access, kindly reach out to your admin.
  </div>
</template>
