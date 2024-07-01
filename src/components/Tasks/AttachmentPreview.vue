<script setup lang="ts">
import type { Attachment } from '@/types/attachment.type';

const props = defineProps<{
  attachment: Attachment;
  showRemove?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete', data: Attachment): void;
  (e: 'copy', data: Attachment): void;
}>();
const { isPortalUser } = useCurrentUserData();
const { getAttachmentUrl, downloadFileAs } = useAttachments();
const { isImageExt } = useUtilityFns();
const { fileIcon } = useVueFilters();
</script>

<template>
  <!-- background: #fff;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 0 0.5rem 0 rgba(0, 0, 0, 0.1); -->
  <div
    class="flex justify-content-center align-items-center object-fit-cover bg-white rounded-sm pt-3 px-3 border-1 border-gray-100 cursor-pointer relative attachment-container transition-all transition-duration-300 transition-ease-in-out"
  >
    <img
      v-if="isImageExt(props.attachment.name)"
      class="w-full h-full"
      :src="getAttachmentUrl(props.attachment.path)"
      loading="lazy"
    >
    <img
      v-else
      class="w-full h-full"
      :src="`${fileIcon(attachment.name)}`"
      :alt="attachment.name"
    >
    <div class="absolute top-0 left-0 w-full h-full">
      <div
        class="w-full p-2 border-1 border-gray-100 absolute bg-white hover:bg-primary hover:text-white attachment-info transistion-bottom"
      >
        <div class="flex text-sm font-medium align-items-end">
          <div class="flex-1 break-all">
            {{ props.attachment.name }}
          </div>
          <div class="flex align-items-center">
            <i
              v-if="!isPortalUser"
              v-tooltip.top="'Save'"
              class="pi pi-save mr-1 p-1"
              @click="emit('copy', props.attachment)"
            />

            <i
              v-tooltip.top="'Download'"
              class="pi pi-download mr-1 mb-1 p-1"
              @click="
                downloadFileAs(
                  getAttachmentUrl(props.attachment.path),
                  props.attachment.name,
                )
              "
            />
          </div>
        </div>
      </div>
      <div
        v-tooltip.top="'Delete'"
        class="absolute right-0 p-2 text-red-500 bg-white cursor-pointer hover:bg-primary hover:text-white attachment-info transistion-top"
        style="border-radius: 0 0 0 50%;"
        @click="emit('delete', attachment)"
      >
        <i class="pi pi-trash" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-icon {
  width: 50% !important;
  height: 50% !important;

  &::before {
    background-color: $primaryColor;
  }
}

.attachment-container {
  img {
    object-fit: cover;
  }

  .attachment-info {
    opacity: 0;
    transition: all 0.25s ease-in-out;

    &:hover {
      .download-btn {
        color: white !important;
      }
    }
  }

  .transistion-bottom {
    bottom: -50px;
  }

  .transistion-top {
    top: -31px;
  }

  &:hover {
    .attachment-info {
      opacity: 1;
    }

    .transistion-bottom {
      bottom: 0;
    }

    .transistion-top {
      top: 0;
    }
  }
}
</style>
