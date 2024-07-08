<script setup lang="ts">
import type { Service } from '@/types/service.type';
import { useMutation, useQueryClient } from 'vue-query';

import type { Ref } from 'vue';

const serviceCreationType = ref<'template' | 'scratch'>();
const serviceState = ref<'list' | 'create'>('list');
const deleteServiceDialog = ref(false);
const isHelpVideoOpen = ref(false);
const actionType = ref();
const selectedService = ref<Service>();
const isStageCreate = ref(false);
const OpenServiceCreateModal = ref(false);

const { initToast } = useToasts();
const { defaultBreakpoints } = useCommonBreakPoints();
const queryClient = useQueryClient();
const { canDo } = usePermissions();
const { activeTabIndex, tabRef, handleTabChange } = useSteps('admin-services');

function prepareForRemove(data: Service) {
  selectedService.value = data;
  deleteServiceDialog.value = true;
}

function handleOperation(dialog: Ref<boolean>, toastFn: () => void) {
  dialog.value = false;
  if (toastFn && typeof toastFn === 'function') {
    toastFn();
  }
  selectedService.value = undefined;
  queryClient.invalidateQueries('service-list');
}

function showToast() {
  initToast({
    actionType: actionType.value,
    title: 'Project Template',
    actionObj: { ...selectedService.value }
  });
}

function handleRemove() {
  actionType.value = 'Delete';
  handleOperation(deleteServiceDialog, showToast);
}

function closeConfirmRemoveDialog() {
  deleteServiceDialog.value = false;
}

const { mutateAsync: removeService } = useMutation(
  (id: string) => useServiceDelete(id),
  {
    onSuccess: () => handleRemove()
  }
);

function deleteService() {
  if (selectedService.value !== undefined) {
    removeService(selectedService.value.id);
  }
}

function handleBackSuccess(type: 'back' | 'success') {
  serviceState.value = 'list';
  serviceCreationType.value = undefined;
  if (type === 'success') {
    queryClient.invalidateQueries('service-list');
  }
}

function prepareForStageCreate() {
  isStageCreate.value = true;
}
</script>

<template>
  <TabView
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    lazy
    @tab-change="handleTabChange"
  >
    <TabPanel header="Project Templates">
      <CommonPage
        :title="
          serviceState === 'list'
            ? 'Choose a Project Template to update OR Create from Scratch'
            : 'Create Project Template'
        "
      >
        <template #description>
          {{
            serviceState === 'list'
              ? 'These are the project templates which are already being shortlisted by you to offer your client. You can also add more project templates or create a new project templates from scratch.'
              : `Setup Project Template ${
                serviceCreationType === 'scratch'
                  ? 'From Scratch'
                  : 'From Template'
              }`
          }}
        </template>
        <template #helpActions>
          <div class="w-full max-w-26rem ml-auto mb-6">
            <a
              aria-label="setup project template video"
              class="font-medium flex justify-content-end align-items-center cursor-pointer"
              @click="isHelpVideoOpen = true"
            ><i
               class="pi pi-youtube p-button-icon p-button-icon-left text-3xl text-primary mr-1 mt-1"
             />
              <span>Help</span></a>
          </div>
        </template>

        <!-- <Button
        label="Help"
        icon="pi pi-plus"
        class="p-button-sm inline-block mr-2"
        @click="$router.push({ name: '' })"
      /> -->

        <template #actions>
          <template
            v-if="serviceState === 'list' && canDo('services', 'create')"
          >
            <Button
              v-tooltip.top="'Add Project Template'"
              icon="pi pi-plus"
              class="p-button-sm p-button-rounded"
              @click="OpenServiceCreateModal = true"
            />
          </template>
        </template>

        <ServiceList
          v-if="serviceState === 'list'"
          @prepare-for-remove="prepareForRemove"
          @handle-back-success="handleBackSuccess"
        />
      </CommonPage>
    </TabPanel>
    <TabPanel header="Project Stages">
      <CommonPage
        title="
          Project Stages
        "
      >
        <template #actions>
          <template v-if="canDo('services', 'create')">
            <Button
              v-tooltip.top="'Create'"
              icon="pi pi-plus"
              class="p-button-sm p-button-rounded"
              @click="prepareForStageCreate"
            />
          </template>
        </template>
        <ServiceProjectStageList />
      </CommonPage>
    </TabPanel>
  </TabView>
  <CommonConfirmRemoveDialog
    v-if="selectedService && deleteServiceDialog"
    :visible="deleteServiceDialog"
    :record-to-remove="selectedService as Record<string, any>"
    title="Confirm Delete Project Template"
    @confirm="deleteService"
    @hide="closeConfirmRemoveDialog"
  />
  <Dialog
    v-model:visible="isHelpVideoOpen"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '75vw' }"
    content-class="border-round-bottom-md"
    header="Setup Project Template"
    @hide="isHelpVideoOpen = false"
  >
    <div class="video-container">
      <iframe
        width="560"
        height="315"
        src="https://www.youtube.com/embed/gh6-gcigNiw"
        title="Setup Project Template"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      />
    </div>
  </Dialog>

  <Dialog
    v-model:visible="isStageCreate"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '40vw' }"
    content-class="border-round-bottom-md"
    header="Create Project Stage"
    @hide="isStageCreate = false"
  >
    <ServiceStageCreateUpdate @success="isStageCreate = false" />
  </Dialog>
  <Dialog
    v-model:visible="OpenServiceCreateModal"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    header="Create Project Template"
    @hide="OpenServiceCreateModal = false"
  >
    <ServiceCreateModal />
  </Dialog>
</template>
