<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';
import { useQueryClient } from 'vue-query';

const isQuickStart = useRouteQuery<string>('quickstart');
const { featureSubscribed } = usePermissions();
const { isFalsy } = useUtilityFns();
const router = useRouter();
const route = useRoute();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { isPortalUser } = useCurrentUserData();

const createDataExtractionDialog = ref(false);
const extractionFormRef = ref(null);

const queryClient = useQueryClient();

function handleSubmit() {
  console.log('Handle Submit');
}

function closeDialog() {
  createDataExtractionDialog.value = false;
  if (!isFalsy(isQuickStart.value)) {
    const { quickstart, ...queryParams } = route.query;
    router.push({
      query: { ...queryParams }
    });
  }
}
/* const { data: extractionLimits } = useQuery('extraction-limit', () => {
  return getResourceLimits({ resource: ResourceType['data extraction'] });
});

const extractionResource = computed(() => {
  const limitComputed = extractionLimits.value?.[0].limit === -1 ? 0 : extractionLimits.value?.[0].limit;
  const usageComputed = extractionLimits.value?.[0].orgSubscriptionResourceUsages && extractionLimits.value?.[0].orgSubscriptionResourceUsages.length > 0 ? extractionLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
  return { limit: limitComputed, usage: usageComputed };
}); */

const { resourceUsage: extractionResource } = useUsageLimit({
  isPortalUser: isPortalUser.value,
  queryKey: 'extraction-limit',
  resource: 'data extraction'
});

onBeforeMount(() => {
  if (isQuickStart.value) {
    createDataExtractionDialog.value = true;
  }
});
</script>

<template>
  <div v-if="featureSubscribed('data_extraction', 'multiple_file_extraction') === false" class="card">
    <Common426 feature="multiple file extraction" />
  </div>
  <div v-else>
    <TabView>
      <TabPanel header="Extraction">
        <CommonPage title="Data Extraction">
          <template #description>
            To initiate data extraction from your PDF or image file, kindly
            select the + icon on the right
          </template>
          <template #actions>
            <Button
              icon="pi pi-undo" class="p-button-rounded ml-2"
              @click="queryClient.invalidateQueries('extraction-list')"
            />
            <span
              v-tooltip="`${extractionResource.limit && (extractionResource.usage >= extractionResource.limit) ? `Can't extract more than available limit ${extractionResource.limit}` : extractionResource.limit && (extractionResource.usage >= extractionResource.limit) ? `Available limit of ${extractionResource.limit} extractions already done` : ''}`"
            >
              <Button icon="pi pi-plus" class="p-button-rounded ml-2" :disabled="extractionResource.limit && (extractionResource.usage >= extractionResource.limit)" @click="createDataExtractionDialog = true" />
            </span>
          </template>
        </CommonPage>
        <DataExtractionList />
      </TabPanel>
    </TabView>

    <Dialog
      v-model:visible="createDataExtractionDialog"
      :modal="true"
      append-to="body"
      header="Data Extraction"
      :breakpoints="defaultBreakpoints"
      :style="{ width: '35vw' }"
      content-class="pb-0"
      @hide="closeDialog"
    >
      <DataExtractionCreateForm
        ref="extractionFormRef"
        @success="handleSubmit"
        @cancel="closeDialog"
      />
      <template #footer>
        <div
          class="buttons-wrapper flex w-full p-0 justify-content-between mt-3 ml-auto col-12"
        >
          <Button
            label="Cancel"
            class="mr-0 max-w-max font-medium"
            severity="danger"
            @click="createDataExtractionDialog = false"
          />
          <span class="inline-block" style="height: 2.357rem;">
            <Button
              class="mr-0 max-w-max font-medium"
              type="submit"
              label="Submit"
              :disabled="
                !(extractionFormRef as any)?.formRef.meta.valid
                  || (extractionFormRef as any)?.disableSubmit
              "
              :loading="(extractionFormRef as any)?.disableForm"
              @click="(extractionFormRef as any)?.formRef.onSubmit"
            />
          </span>
        </div>
      </template>
    </Dialog>
  </div>
</template>
