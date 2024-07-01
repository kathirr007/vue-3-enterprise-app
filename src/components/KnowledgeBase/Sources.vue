<script setup lang="ts">
import type { Source } from '@/types/knowlege-base.type';

const props = withDefaults(defineProps<{
  sources: Source[];
}>(), {
  sources: () => []
});

const isSomeSourceUrl = computed(() => {
  return props.sources?.some(
    source => source.document_metadata?.attributes.source_url
  );
});
</script>

<template>
  <div v-if="isSomeSourceUrl">
    <h6 class="m-0">
      Sources:
    </h6>
    <ul class="space-y-1.5">
      <template v-for="source in props.sources" :key="source.document_text">
        <li v-if="source.document_metadata?.attributes?.source_url">
          <a
            :href="source.document_metadata.attributes?.source_url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-500 hover:underline inline-block"
          >
            {{ source.document_metadata?.attributes?.source_url }}
          </a>
        </li>
      </template>
    </ul>
  </div>
</template>

<style lang="scss" scoped></style>
