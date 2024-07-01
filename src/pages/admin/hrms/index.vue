<script setup lang="ts">
import { useMutation, useQueryClient } from 'vue-query';
import TabView from 'primevue/tabview';
import type { APIActions } from '@/types/common.type';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type {
  HRHoliday,
  HRHolidayCreateInput,
  HRLeaveBalance
} from '@/types/hrms.type';
import type { BulkImportConfig } from '@/types/bulkimport.type';

const bulkimportOptions: BulkImportConfig = {
  columns: HolidayImportColumns,
  allowPartialImport: true
};

const isCreateUpdateHolidayDialog = ref(false);
const isCreateUpdateLeaveBalanceDialog = ref(false);
const removeHolidayDialog = ref(false);
const isImportDialogVisible = ref(false);
const selectedHoliday = ref<HRHoliday>();
const selectedLeavebalance = ref<HRLeaveBalance>();

const router = useRouter();
const queryClient = useQueryClient();
const { initToast } = useToasts();
function showToast(data: HRLeaveBalance | HRHoliday,
  title: string,
  actionType: APIActions,
  detail?: string) {
  initToast({
    actionType,
    title,
    actionObj: { ...data },
    detail
  });
}
const { activeTabIndex, tabRef, handleTabChange } = useSteps('admin-hrms');
const { canDo, featureSubscribed } = usePermissions();
const { remove: removeHoliday, bulkCreate } = useHrmsHolidays();

const { defaultBreakpoints, styles } = useCommonBreakPoints();

function prepareForHolidayActions(data: {
  data: HRHoliday;
  action: APIActions;
}) {
  selectedHoliday.value = data.data;
  if (data.action === 'Update')
    isCreateUpdateHolidayDialog.value = true;
  if (data.action === 'Remove')
    removeHolidayDialog.value = true;
}

function prepareForLeavebalancerActions(data: {
  data: HRLeaveBalance;
  action: APIActions;
}) {
  selectedLeavebalance.value = data.data;
  if (data.action === 'Update')
    isCreateUpdateLeaveBalanceDialog.value = true;
}

const { mutateAsync: handleRemove } = useMutation(
  (id: string) => removeHoliday(id),
  {
    onSuccess: (data) => {
      showToast(data as HRHoliday, 'Holiday', 'Remove');
      selectedHoliday.value = undefined;
      queryClient.invalidateQueries('holidays-list');
    }
  }
);

const { mutateAsync: bulkCreateHoliday } = useMutation(
  (payload: HRHolidayCreateInput[]) => bulkCreate(payload),
  {
    onSuccess: (data: { count: number }) => {
      initToast({
        actionType: 'Create',
        summary: 'Bulk Import Holiday',
        detail: `Total <strong>${data.count}</strong> Holiday(s) imported successfully.`
      });
      isImportDialogVisible.value = false;
      queryClient.invalidateQueries('holidays-list');
    }
  }
);

async function handleBulkImport(rows: HRHolidayCreateInput[]) {
  const data = rows
    .map((row) => {
      let parseDate: Dayjs | undefined = dayjs(row.date);
      if (!parseDate.isValid()) {
        parseDate = undefined;
      }
      return {
        date: parseDate?.toISOString(),
        name: row.name,
        description: row.description
      };
    })
    .filter(row => row.date && row.name) as unknown as HRHolidayCreateInput[];

  bulkCreateHoliday(data);
}

function handleRemoveClose() {
  removeHolidayDialog.value = false;
  selectedHoliday.value = undefined;
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
    <TabPanel header="Holidays">
      <Common426
        v-if="featureSubscribed('hrms', 'holiday') === false"
        feature="holidays"
      />
      <CommonPage v-else title="Holidays">
        <template #actions>
          <Button
            v-if="canDo('holiday', 'create')"
            v-tooltip.left="'Import Holidays'"
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="isImportDialogVisible = true"
          >
            <Icon icon="ph:export" class="text-xl flex-none text-base" />
          </Button>
          <Button
            v-if="canDo('holiday', 'create')"
            v-tooltip.left="'Create Holiday'"
            icon="pi pi-plus"
            class="ml-2 p-button-rounded"
            @click="isCreateUpdateHolidayDialog = true"
          />
          <a
            href="https://brightreturn.com/kb/hrms-management-for-cpa-firm"
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
          <HRMSHolidayList
            v-if="canDo('holiday', 'list')"
            @update:holiday="prepareForHolidayActions"
            @delete:holiday="prepareForHolidayActions"
          />
          <p v-else class="text-center font-medium text-xl">
            You don't have access of the Holidays list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
    <TabPanel header="Leave Balance">
      <Common426
        v-if="featureSubscribed('hrms', 'leaves') === false"
        feature="leave balance"
      />
      <CommonPage v-else title="Leave Balance">
        <template #actions>
          <!-- <Button
            v-if="canDo('leave', 'create')"
            icon="pi pi-plus"
            class="ml-2 p-button-rounded"
            @click="isCreateUpdateLeaveBalanceDialog = true"
            v-tooltip.left="'Create Leave Balance'"
          /> -->
          <Button
            v-if="canDo('leave', 'create')"
            v-tooltip.left="'Add Leave Balance'"
            icon="pi pi-plus"
            class="p-button-rounded ml-2"
            @click="router.push({ name: 'admin-hrms-leavebalance' })"
          />
          <a
            href="https://brightreturn.com/kb/hrms-management-for-cpa-firm"
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
          <HRMSLeaveBalanceList
            v-if="canDo('leave', 'list')"
            @update:leavebalance="prepareForLeavebalancerActions"
          />
          <p v-else class="text-center font-medium text-xl">
            You don't have access of the Holidays list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
  </TabView>

  <CommonConfirmRemoveDialog
    v-if="removeHolidayDialog"
    :visible="removeHolidayDialog"
    :record-to-remove="selectedHoliday as Record<string, any>"
    header="Remove Holiday"
    @confirm="handleRemove(selectedHoliday?.id as string)"
    @hide="handleRemoveClose"
  />
  <Dialog
    v-model:visible="isCreateUpdateHolidayDialog"
    :modal="true"
    append-to="body"
    :header="selectedHoliday ? 'Update Holiday' : 'Create Holiday'"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="selectedHoliday = undefined"
  >
    <HRMSHolidayCreateForm
      :holiday="selectedHoliday"
      @success="isCreateUpdateHolidayDialog = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="isImportDialogVisible"
    modal
    header="Import Holidays"
    :style="{ width: '40vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
    content-class="border-round-bottom-md"
  >
    <CommonBulkImport
      :config="bulkimportOptions"
      import-type="Holidays"
      template-url="/csv/brightreturn-holiday-import.csv"
      @import="handleBulkImport"
    />
  </Dialog>
  <Dialog
    v-model:visible="isCreateUpdateLeaveBalanceDialog"
    :modal="true"
    append-to="body"
    :header="
      selectedLeavebalance ? 'Update Leave Balance' : 'Create Leave Balance'
    "
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="selectedLeavebalance = undefined"
  >
    <HRMSLeaveBalanceCreateForm
      :leave-balance="selectedLeavebalance"
      @success="isCreateUpdateLeaveBalanceDialog = false"
    />
  </Dialog>
</template>

<style lang="scss" scoped></style>
