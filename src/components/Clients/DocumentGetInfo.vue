<script setup lang="ts">
import type { DocumentFile } from '@/types/documents.type';
import prettybytes from 'pretty-bytes';

defineProps<{
  fileDetails?: DocumentFile;
}>();

const { dateToHumanShort } = useVueFilters();
</script>

<template>
  <div class="container">
    <div class="mt-3">
      <div class="my-2">
        <div class="flex w-3/4 justify-content-between my-2 mx-auto">
          <span>Name</span>
          <span class="font-semibold">{{ fileDetails?.name }}</span>
        </div>
        <div class="w-3/4 flex justify-content-between my-2 mx-auto">
          <span>Size</span>
          <span class="font-semibold">{{
            prettybytes(fileDetails?.contentLength as number)
          }}</span>
        </div>
        <div class="w-3/4 flex justify-content-between my-2 mx-auto">
          <span>Type</span>
          <span class="font-semibold">{{
            fileDetails ? fileDetails?.contentType : ''
          }}</span>
        </div>
        <div class="w-3/4 flex justify-content-between my-2 mx-auto">
          <span>Created At</span>
          <span class="font-semibold">{{
            dateToHumanShort(fileDetails?.createdAt as string)
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
