<script setup lang="ts">
import { useQuery } from 'vue-query';

const { getFolders } = useDocuments();
const { canDo } = usePermissions();

const { data: folderDetails, isLoading } = useQuery('folder-documents', () => {
  return getFolders({
    id: 'sampleId',
    isGallery: true
  });
});
</script>

<template>
  <div class="card">
    <template v-if="canDo('gallery', 'list')">
      <CommonLoading v-if="isLoading" />
      <GalleryDocuments v-else :folder-data="folderDetails" />
    </template>
    <Common401 v-else feature="Document Gallery" />
  </div>
</template>
