<script setup lang="ts">
import type {
  Designation,
  DesignationRemovePayload
} from '@/types/designation.type';
import { DesignationRemovePayloadSchema } from '@/types/designation.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

import type { Ref } from 'vue';

const dialogHeader = ref('Create Desgination');
const isDialogVisible = ref(false);
const deleteDesignationDialog = ref(false);
const actionType = ref();
const selectedDesgination = ref<Designation>();

const { activeTabIndex, tabRef, handleTabChange } = useSteps(
  'admin-roles-and-designations'
);
const { initToast } = useToasts();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const queryClient = useQueryClient();
const { currentPage, currentLimit, queryKeys, queryFilters, querySortBy }
  = useDataTableUtils();
const { canDo } = usePermissions();

const { isLoading: loadingDesignations, data: designations } = useQuery(
  ['designations-list', ...queryKeys],
  () => {
    return useDesignationListV2({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value,
      sortBy: querySortBy.value
    });
  }
);

const { values, errors, meta, setValues, validate } = useForm({
  validationSchema: DesignationRemovePayloadSchema,
  initialErrors: undefined,
  initialValues: undefined
});

const { value: designationId } = useField('designationId');

function prepareForCreate() {
  dialogHeader.value = 'Create Designation';
  selectedDesgination.value = undefined;
  isDialogVisible.value = true;
}

function prepareForUpdate(data: Designation) {
  dialogHeader.value = 'Update Designation';
  selectedDesgination.value = data;
  isDialogVisible.value = true;
}

function prepareForRemove(data: Designation) {
  selectedDesgination.value = data;
  deleteDesignationDialog.value = true;
}

function handleOperation(dialog: Ref<boolean>, toastFn: () => void) {
  dialog.value = false;
  if (toastFn && typeof toastFn === 'function') {
    toastFn();
  }
  selectedDesgination.value = undefined;
  queryClient.invalidateQueries('designations-list');
}

function showToast() {
  initToast({
    actionType: actionType.value,
    title: 'Designation',
    actionObj: { ...selectedDesgination.value }
  });
}

function handleCreate(data: Designation) {
  actionType.value = 'Create';
  selectedDesgination.value = data;
  handleOperation(isDialogVisible, showToast);
}
function handleUpdate(data: Designation) {
  actionType.value = 'Update';
  selectedDesgination.value = data;
  handleOperation(isDialogVisible, showToast);
}

function handleRemove() {
  actionType.value = 'Delete';
  handleOperation(deleteDesignationDialog, showToast);
}

function closeConfirmRemoveDialog() {
  deleteDesignationDialog.value = false;
  setValues({ designationId: undefined });
  validate();
}

const connectedUsers = computed(() => {
  if (selectedDesgination.value) {
    return selectedDesgination.value._count?.users;
  }
  return false;
});

const otherDesignations = computed(() => {
  if (selectedDesgination.value) {
    return designations.value?.results.filter(
      designation => designation.id !== selectedDesgination.value?.id
    );
  }
  return [];
});

const { mutateAsync: removeDesignation } = useMutation(
  ({ id, payload }: { id: string; payload?: DesignationRemovePayload }) =>
    useDesignationRemove(id, payload),
  {
    onSuccess: () => handleRemove()
  }
);

function deleteDesignation() {
  if (!connectedUsers.value && selectedDesgination.value) {
    removeDesignation({ id: selectedDesgination?.value?.id });
  }
  else
    removeDesignation({
      id: `${selectedDesgination?.value?.id}`,
      payload: { designationId: designationId.value as string }
    });
  // TODO: API call to redesignate users
}
</script>

<template>
  <TabView
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    lazy
    @tab-change="handleTabChange"
  >
    <TabPanel header="Designations">
      <CommonPage title="Designations">
        <template #actions>
          <Button
            v-if="canDo('designations', 'create')"
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="prepareForCreate"
          />
        </template>
        <Dialog
          v-model:visible="isDialogVisible"
          :modal="true"
          append-to="body"
          :header="dialogHeader"
          :breakpoints="defaultBreakpoints"
          :style="styles"
          content-class="border-round-bottom-md"
        >
          <DesignationsCreateForm
            :designation="selectedDesgination"
            @success="handleCreate"
            @update="handleUpdate"
          />
        </Dialog>
        <CommonConfirmRemoveDialog
          v-if="selectedDesgination && deleteDesignationDialog"
          :visible="deleteDesignationDialog"
          :record-to-remove="selectedDesgination as Record<string, any>"
          title="Delete Designation"
          class="remove-dialog"
          :is-remove="!connectedUsers"
          :hide-button-icons="!!connectedUsers"
          :cancel-label="connectedUsers ? 'Cancel' : ''"
          :okay-label="connectedUsers ? 'Submit' : ''"
          :disable-okay="!!(connectedUsers && !meta.valid)"
          :hide-cancel="!!connectedUsers"
          @confirm="deleteDesignation"
          @hide="closeConfirmRemoveDialog"
        >
          <div v-if="connectedUsers">
            There {{ connectedUsers > 1 ? 'are' : 'is' }}
            <strong>{{ connectedUsers }}</strong>
            {{ connectedUsers > 1 ? 'users' : 'user' }} connected to
            <strong>{{ selectedDesgination.name }}</strong>. To delete <strong>{{ selectedDesgination.name }}</strong>, Please Redesignate the Team members to other Designation.
            <form class="mt-3">
              <label for="designation" class="mb-2">Designation <span class="text-red-500">*</span></label>
              <Dropdown
                v-model="designationId"
                class="w-full"
                :options="otherDesignations"
                option-label="name"
                option-value="id"
                :filter="true"
                placeholder="Select a Designation"
                @blur="validate()"
              />

              <transition mode="out-in" name="field-slide-down">
                <FormFeedbackMessage
                  :errors="errors"
                  :values="values"
                  error-key="designationId"
                  :feedback="false"
                />
              </transition>
            </form>
          </div>
        </CommonConfirmRemoveDialog>
        <div class="card">
          <DesignationsList
            v-if="designations && canDo('designations', 'list')"
            :designations="designations"
            :loading-designations="loadingDesignations"
            @update:designation="prepareForUpdate"
            @delete:designation="prepareForRemove"
          />
          <p v-else class="text-center font-medium text-xl">
            You don't have access of the Desingations list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
    <TabPanel header="Roles">
      <CommonPage title="Roles">
        <template #actions>
          <a
            href="https://brightreturn.com/kb/manage-project-team-in-cpa-firm"
            target="_blank"
          >
            <Button
              v-tooltip.top="'Need Help'"
              type="button"
              icon="pi pi-question-circle text-lg"
              class="p-button-icon-only p-button-rounded ml-2"
            />
          </a>
        </template>
        <div class="card">
          <RoleList />
        </div>
      </CommonPage>
    </TabPanel>
  </TabView>
</template>
