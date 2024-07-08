<script setup lang="ts">
import type { Webform, WebformType } from '@/types/webforms.type';
import { useMutation, useQueryClient } from 'vue-query';

import type { Ref } from 'vue';

const createUpdateDialogHeader = ref('Create webform');
const isDialogVisible = ref(false);
const isWebformCreateDialog = ref(false);
const isWebformCreate = ref(false);
const isWebformTemplate = ref(false);
const removeWebformDialog = ref(false);
const webformType = ref<WebformType>('ORGANIZER');
const actionType = ref();
const selectedWebform = ref<Webform>();

const route = useRoute();
const router = useRouter();
const { initToast } = useToasts();
const { titleCase } = useVueFilters();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const queryClient = useQueryClient();
const { remove } = useWebformTemplates();
const { canDo } = usePermissions();
const { activeTabIndex, tabRef, handleTabChange } = useSteps(
  'admin-webform-templates'
);

const hideWebformsList = computed(
  () => isWebformCreate.value || isWebformTemplate.value
);

function handleFromTemplate() {
  isWebformCreateDialog.value = false;
  isWebformTemplate.value = true;
}
function handleCreateManual() {
  isWebformCreateDialog.value = false;
  isWebformCreate.value = true;
}

function closeCreateWebform() {
  isWebformCreate.value = false;
  isWebformTemplate.value = false;
  /* const {
    isUpdateWebform,
    webformId,
    isESignWebform,
    isWebformCreate: isCreateWebform,
    ...restQueries
  } = route.query;
  router.push({
    query: { ...restQueries },
  }); */
}

function prepareForCreate(type: WebformType) {
  webformType.value = type;
  createUpdateDialogHeader.value = `Create ${titleCase(
    webformType.value === 'ORGANIZER' ? 'Request' : webformType.value
  )} Template`;
  selectedWebform.value = undefined;
  isWebformCreateDialog.value = true;
}

function prepareForUpdate(data: Webform) {
  createUpdateDialogHeader.value = `Update ${titleCase(
    webformType.value === 'ORGANIZER' ? 'Request' : webformType.value
  )} Template`;
  selectedWebform.value = data;
  isDialogVisible.value = true;
}

function prepareForRemove(data: Webform) {
  selectedWebform.value = data;
  removeWebformDialog.value = true;
}

function handleOperation(dialog: Ref<boolean>, toastFn: () => void) {
  dialog.value = false;
  if (toastFn && typeof toastFn === 'function') {
    toastFn();
  }
  if (actionType.value === 'Update') {
    router.push({
      name: 'admin-webform-templates-id',
      params: { id: selectedWebform.value?.id },
      query: { ...route.query, webformType: selectedWebform.value?.type }
    });
  }
  else {
    selectedWebform.value = undefined;
    queryClient.invalidateQueries('webforms-templates-list');
  }
}

function showToast() {
  initToast({
    actionType: actionType.value,
    title: 'Webform',
    actionObj: { ...selectedWebform.value }
  });
}

function handleCreate(data: Webform) {
  router.push({
    name: 'admin-webform-templates-id',
    params: { id: data.id },
    query: { ...route.query, create: 'true', webformType: data.type }
  });
}
function handleUpdate() {
  actionType.value = 'Update';
  handleOperation(isDialogVisible, showToast);
}

function handleRemove() {
  actionType.value = 'Remove';
  handleOperation(removeWebformDialog, showToast);
}

const connectedUsers = computed(() => {
  if (selectedWebform.value) {
    return selectedWebform.value._count?.forms;
  }
  return false;
});

const { mutateAsync: removeWebform } = useMutation(
  ({ id }: { id: string }) => remove(id),
  {
    onSuccess: () => handleRemove()
  }
);

function handleRemoveWebform() {
  removeWebform({
    id: selectedWebform.value?.id as string
  });
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
    <TabPanel header="Request">
      <CommonPage
        :title="
          hideWebformsList ? 'Create Request Template' : 'Request Templates'
        "
      >
        <template v-if="!hideWebformsList" #actions>
          <Button
            v-tooltip.left="'Create new request template'"
            data-v-if="canDo('webforms', 'create')"
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="prepareForCreate('ORGANIZER')"
          />
        </template>
        <template v-if="!hideWebformsList && true">
          <WebformsList
            v-if="!hideWebformsList && true"
            data-v-if="canDo('webforms', 'list')"
            webform-type="ORGANIZER"
            @update:webform="prepareForUpdate"
            @delete:webform="prepareForRemove"
          />
          <div v-else class="card">
            <p class="text-center font-medium text-xl">
              You don't have access of the request templates list.
            </p>
          </div>
        </template>
        <template v-else>
          <ClientsWebformsCreate
            v-if="isWebformCreate || isWebformTemplate"
            :webform-type="webformType"
            is-create-template
            :is-template="isWebformTemplate"
            @modal-close="closeCreateWebform"
          />
        </template>
      </CommonPage>
    </TabPanel>
    <TabPanel header="Contracts">
      <CommonPage
        :title="
          hideWebformsList ? 'Create Contract Template' : 'Contract Templates'
        "
      >
        <template v-if="!hideWebformsList" #actions>
          <Button
            v-tooltip.left="'Create new contract template'"
            data-v-if="canDo('webforms', 'create')"
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="prepareForCreate('CONTRACT')"
          />
        </template>
        <template v-if="!hideWebformsList && true">
          <WebformsList
            v-if="true"
            data-v-if="canDo('webforms', 'list')"
            webform-type="CONTRACT"
            @update:webform="prepareForUpdate"
            @delete:webform="prepareForRemove"
          />
          <div v-else class="card">
            <p class="text-center font-medium text-xl">
              You don't have access of the contract templates list.
            </p>
          </div>
        </template>
        <template v-else>
          <ClientsWebformsCreate
            v-if="isWebformCreate || isWebformTemplate"
            is-create-template
            :webform-type="webformType"
            :is-template="isWebformTemplate"
            @modal-close="closeCreateWebform"
          />
        </template>
      </CommonPage>
    </TabPanel>
  </TabView>

  <Dialog
    v-model:visible="isDialogVisible"
    :modal="true"
    append-to="body"
    :header="createUpdateDialogHeader"
    :breakpoints="defaultBreakpoints"
    :style="webformType === 'CONTRACT' ? { width: '45vw' } : styles"
    content-class="border-round-bottom-md"
  >
    <WebformsCreateUpdateForm
      :webform-type="webformType"
      :webform-details="selectedWebform"
      @success="handleCreate"
      @update="handleUpdate"
      @back="isDialogVisible = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="isWebformCreateDialog"
    :modal="true"
    append-to="body"
    :header="createUpdateDialogHeader"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    @hide="isWebformCreateDialog = false"
  >
    <div class="px-3">
      <div class="flex justify-content-between align-items-center">
        <div class="font-medium text-lg flex-1">
          Create
          {{ titleCase(webformType === 'ORGANIZER' ? 'Request' : webformType) }}
          template using Template
          <p class="font-normal text-base mt-1">
            Setup a new
            {{
              titleCase(webformType === 'ORGANIZER' ? 'Request' : webformType)
            }}
            template using predefined or already existing templates and use it
            to create
            {{
              titleCase(webformType === 'ORGANIZER' ? 'Request' : webformType)
            }}
            form for your clients
          </p>
        </div>
        <Button
          label="Use Template"
          class="p-button-outlined"
          @click="handleFromTemplate"
        />
      </div>
      <Divider />
      <div class="flex justify-content-between align-items-center">
        <div class="font-medium text-lg flex-1">
          Create
          {{ titleCase(webformType === 'ORGANIZER' ? 'Request' : webformType) }}
          template Manually
          <p class="font-normal text-base mt-1">
            Setup a new
            {{
              titleCase(webformType === 'ORGANIZER' ? 'Request' : webformType)
            }}
            template from scratch and use it to create
            {{
              titleCase(webformType === 'ORGANIZER' ? 'Request' : webformType)
            }}
            form for your clients
          </p>
        </div>
        <Button
          label="Create New"
          class="p-button-outlined"
          @click="handleCreateManual"
        />
      </div>
    </div>
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="selectedWebform && removeWebformDialog"
    :visible="removeWebformDialog"
    :record-to-remove="selectedWebform as Record<string, any>"
    :title="`Delete ${titleCase(
      webformType === 'ORGANIZER' ? 'Request' : webformType,
    )}`"
    class="remove-dialog"
    :is-remove="true"
    @confirm="handleRemoveWebform"
    @hide="removeWebformDialog = false"
  >
    <div v-if="connectedUsers">
      There {{ connectedUsers > 1 ? 'are' : 'is' }}
      <strong>{{ connectedUsers }}</strong>
      {{ connectedUsers > 1 ? 'webforms' : 'webform' }} in
      <strong>{{ selectedWebform.name }}</strong>. Would you like to delete <strong>{{ selectedWebform.name }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
</template>
