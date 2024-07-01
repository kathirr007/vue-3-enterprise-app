<script setup lang="ts">
import type { Feedback } from '@/types/feedback.type';
import type { Webform } from '@/types/webforms.type';
import { useQuery } from 'vue-query';

const props = defineProps<{
  webforms?: Webform[] | Feedback[];
  title: string;
  type?: string;
  loadingWebforms?: boolean;
  isFeedback?: boolean;
}>();

const { getOnePortalWebform } = useWebforms();
const { openLinkInNewTab } = useUtilityFns();
const { getOneFeedback } = useFeedback();

const selectedWebform = ref<Webform | Feedback | undefined>();

const webformId = computed(() => {
  return selectedWebform.value?.id;
});

const {
  data: webformDetails,
  isLoading,
  isFetching
} = useQuery(
  ['webform-details', webformId],
  async () => {
    if (!webformId.value)
      return;
    return getOnePortalWebform(webformId.value as string);
  },
  {
    onSuccess: (data: any) => {
      if (data) {
        openLinkInNewTab(data.link as string);
        selectedWebform.value = undefined;
      }
    }
  }
);

function handleClick(item: any) {
  const url = `${window.location.origin}/feedbacks/${item.id}`;
  if (props.isFeedback) {
    openLinkInNewTab(url as string);
    return;
  }
  selectedWebform.value = props.webforms?.find(
    (webform: any) => webform.id === item.id
  );
}
</script>

<template>
  <div class="box-shadow card p-3">
    <slot name="header">
      <div
        class="flex items-center justify-content-between align-items-center mb-2"
      >
        <h4>
          {{ title }}
          <div
            v-if="isLoading || isFetching"
            class="text-sm flex align-items-center font-italic mt-2"
          >
            Loading {{ type }}... <i class="ml-2 pi pi-spin pi-spinner" />
          </div>
        </h4>
      </div>
    </slot>
    <CommonLoading v-if="loadingWebforms" />
    <div v-else class="portal-card-container">
      <ul v-if="webforms?.length > 0" class="mt-2 space-y-2.5 p-0">
        <li
          v-for="(item, index) in webforms"
          :key="index"
          class="flex items-center justify-content-between"
        >
          <span
            class="cursor-pointer text-base font-medium"
            @click="handleClick(item)"
          >{{ index + 1 }}.
            <span class="hover:underline">{{ item.name || item.title }}</span>
          </span>
        </li>
      </ul>
      <div v-else class="mt-2 p-2 w-full">
        <span>No Pending {{ type }}s</span>
      </div>
    </div>
  </div>
</template>
