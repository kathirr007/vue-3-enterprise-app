<script setup lang="ts">
import type { Webform, WebformType } from '@/types/webforms.type';
import { useQueryClient } from 'vue-query';
import { useMutation } from 'vue-query';
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

const handleFromTemplate = () => {
  isWebformCreateDialog.value = false;
  isWebformTemplate.value = true;
};
const handleCreateManual = () => {
  isWebformCreateDialog.value = false;
  isWebformCreate.value = true;
};

const closeCreateWebform = () => {
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
};

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
      query: { ...route.query, webformType: selectedWebform.value?.type },
    });
  } else {
    selectedWebform.value = undefined;
    queryClient.invalidateQueries('webforms-templates-list');
  }
}

function showToast() {
  initToast({
    actionType: actionType.value,
    title: 'Webform',
    actionObj: { ...selectedWebform.value },
  });
}

function handleCreate(data: Webform) {
  router.push({
    name: 'admin-webform-templates-id',
    params: { id: data.id },
    query: { ...route.query, create: 'true', webformType: data.type },
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
    onSuccess: () => handleRemove(),
  }
);

const handleRemoveWebform = () => {
  removeWebform({
    id: selectedWebform.value?.id as string,
  });
};
</script>

<template>
  <TabView
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    @tab-change="handleTabChange"
    @tab-click="handleTabChange"
    lazy
  >
    <TabPanel header="Request">
      <CommonPage
        :title="
          hideWebformsList ? 'Create Request Template' : 'Request Templates'
        "
      >
        <template v-slot:actions v-if="!hideWebformsList">
          <Button
            data-v-if="canDo('webforms', 'create')"
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="prepareForCreate('ORGANIZER')"
            v-tooltip.left="'Create new request template'"
          />
        </template>
        <template v-if="!hideWebformsList && true">
          <WebformsList
            data-v-if="canDo('webforms', 'list')"
            v-if="!hideWebformsList && true"
            :webform-type="'ORGANIZER'"
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
            :webform-type="webformType"
            is-create-template
            v-if="isWebformCreate || isWebformTemplate"
            :is-template="isWebformTemplate"
            @modalClose="closeCreateWebform"
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
        <template v-slot:actions v-if="!hideWebformsList">
          <Button
            data-v-if="canDo('webforms', 'create')"
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="prepareForCreate('CONTRACT')"
            v-tooltip.left="'Create new contract template'"
          />
        </template>
        <template v-if="!hideWebformsList && true">
          <WebformsList
            data-v-if="canDo('webforms', 'list')"
            v-if="true"
            :webform-type="'CONTRACT'"
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
            is-create-template
            :webform-type="webformType"
            v-if="isWebformCreate || isWebformTemplate"
            :is-template="isWebformTemplate"
            @modalClose="closeCreateWebform"
          />
        </template>
      </CommonPage>
    </TabPanel>
  </TabView>

  <Dialog
    :modal="true"
    appendTo="body"
    :header="createUpdateDialogHeader"
    v-model:visible="isDialogVisible"
    :breakpoints="defaultBreakpoints"
    :style="webformType === 'CONTRACT' ? { width: '45vw' } : styles"
    :contentClass="'border-round-bottom-md'"
  >
    <WebformsCreateUpdateForm
      :webform-type="webformType"
      @success="handleCreate"
      @update="handleUpdate"
      :webformDetails="selectedWebform"
      @back="isDialogVisible = false"
    ></WebformsCreateUpdateForm>
  </Dialog>
  <Dialog
    :modal="true"
    appendTo="body"
    :header="createUpdateDialogHeader"
    v-model:visible="isWebformCreateDialog"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    :contentClass="'border-round-bottom-md'"
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
    :recordToRemove="selectedWebform as Record<string, any>"
    :title="`Delete ${titleCase(
      webformType === 'ORGANIZER' ? 'Request' : webformType
    )}`"
    class="remove-dialog"
    :isRemove="true"
    @confirm="handleRemoveWebform"
    @hide="removeWebformDialog = false"
  >
    <div v-if="connectedUsers">
      There {{ connectedUsers > 1 ? 'are' : 'is' }}
      <strong>{{ connectedUsers }}</strong>
      {{ connectedUsers > 1 ? 'webforms' : 'webform' }} in
      <strong>{{ selectedWebform.name }}</strong
      >. Would you like to delete <strong>{{ selectedWebform.name }}</strong
      >?
    </div>
  </CommonConfirmRemoveDialog>
</template>
