<script setup lang="ts">
import type { WebformType } from '@/types/webforms.type';

const route = useRoute();
const router = useRouter();
const webformId = ref(route.params.id as string);
const webformType = ref(route.query.webformType as WebformType);
const { create, webformType: webformTypeQuery, ...restQueries } = route.query;
const gotoList = () => {
  router.push({ name: 'admin-webform-templates', query: { ...restQueries } });
};
</script>

<template>
  <WebformsBuilder
    :webform-type="webformType"
    :webform-id="webformId"
    hide-values
    @back="gotoList"
    @success="gotoList"
    :key="route.fullPath"
  />
</template>

<style lang="scss" scoped></style>
