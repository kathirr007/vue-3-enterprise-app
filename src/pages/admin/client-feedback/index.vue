<script setup lang="ts">
import TabView from 'primevue/tabview';
import type { APIActions } from '@/types/common.type';
import type { Feedback } from '@/types/feedback.type';

const isCreateUpdateFeedbackDialog = ref(false);
const selectedFeedback = ref<Feedback>();

const { initToast } = useToasts();

const { activeTabIndex, tabRef, handleTabChange } = useSteps('admin-client-feedback');

const { defaultBreakpoints, styles } = useCommonBreakPoints();

function prepareFeedbackAction(value: { data: Feedback; action: APIActions }) {
  selectedFeedback.value = value.data;
  if (value.action === 'Update') {
    isCreateUpdateFeedbackDialog.value = true;
  }
}
</script>

<template>
  <TabView
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    lazy
    @tab-change="handleTabChange"
    @tab-click="handleTabChange"
  >
    <TabPanel header="Feedback">
      <CommonPage title="Feedback">
        <template #actions>
          <Button
            v-tooltip.left="'Create Feedback'"
            data-v-if="canDo('feedback', 'create')"
            icon="pi pi-plus"
            class="ml-2 p-button-rounded"
            @click="isCreateUpdateFeedbackDialog = true"
          />
          <!-- <a
            href="https://brightreturn.com/kb/hrms-management-for-cpa-firm"
            target="_blank"
          >
            <Button
              v-tooltip.top="'Need Help'"
              type="button"
              icon="pi pi-question-circle text-lg"
              class="p-button-icon-only p-button-rounded ml-2"
            />
          </a> -->
        </template>
        <div class="card">
          <ClientFeedbackList
            data-v-if="canDo('feedback', 'list')"
            @update:feedback="prepareFeedbackAction"
          />
        </div>
      </CommonPage>
    </TabPanel>
    <TabPanel header="Setting">
      <CommonPage title="Feedback Setting">
        <ClientFeedbackSettingForm />
      </CommonPage>
    </TabPanel>
  </TabView>

  <Dialog
    v-model:visible="isCreateUpdateFeedbackDialog"
    :modal="true"
    append-to="body"
    :header="selectedFeedback ? 'Update Feedback' : 'Create Feedback'"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="selectedFeedback = undefined"
  >
    <ClientFeedbackCreateForm :feedback="selectedFeedback" @modal-close="isCreateUpdateFeedbackDialog = false" />
  </Dialog>
</template>

<style lang="scss" scoped></style>
