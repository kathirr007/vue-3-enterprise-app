<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import type { User } from '@/types/teams.type';
import type { Ref } from 'vue';
import type { AxiosError } from 'axios';
import router from '@/router';
import { Icon } from '@iconify/vue';
import dayjs from 'dayjs';
import type {
  HRLeaveBalanceCreateInput,
  HRLeaveBalance,
  HRLeaveBalanceBulkCreateInput,
  BulkLeavePayload,
} from '@/types/hrms.type';
import { HRLeaveBalanceBulkPayloadSchema } from '@/types/hrms.type';

type EmptyRecord = BulkLeavePayload & { error: string };
type teamMembers = { users: BulkLeavePayload[] };

const emit = defineEmits<{
  (e: 'success', data: HRLeaveBalance): void;
  (e: 'update', data: HRLeaveBalance): void;
}>();

const tableCellStyles = { 'min-width': '15rem' };
const tableActionStyles = { 'min-width': '8rem' };

const { isMedium } = useCommonBreakPoints();
const { showToast } = useToasts();
const { getUsers, getLeaveTypes } = useCommonListQueries();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const queryClient = useQueryClient();

const { data: leaveTypes, isLoading: loadingLeaveTypes } = getLeaveTypes();
const { createBulk: createLeaveBalanceBulkCreation } = useHrmsLeaveBalance();
const { transformBulkLeaves } = useUtilityFns();
const { data: usersList, isLoading: loadingUsers } = getUsers(
  true,
  true,
  initialFilters
);

const confirmResetDialog = ref(false);
const emptyRecord: EmptyRecord = {
  userId: [],
  typeId: '',
  year: null,
  days: null,
  error: '',
};

const lastThreeYears = computed(() => {
  const currentYear = dayjs().year();
  // const previousYear = currentYear - 1;
  const nextYear = currentYear + 1;
  const lastThreeYears = [currentYear, nextYear];
  return lastThreeYears;
});

const { handleSubmit, meta, values, errors, setValues, resetForm, validate } =
  useForm({
    validationSchema: HRLeaveBalanceBulkPayloadSchema,
    validateOnMount: false,
    initialValues: {
      users: [{ ...emptyRecord }],
    },
  });

const { remove, push, fields } = useFieldArray('users');

const addNewRecord = () => {
  push(emptyRecord);
  validate({
    mode: 'silent',
  });
};

const removeFieldError = (field: Ref<EmptyRecord>): void => {
  if (!field.value.error) return;
  field.value.error = '';
};

const handleResetForm = () => {
  resetForm();
};

const { mutateAsync: createBulkLeaveBalance, isLoading: bulkCreateLoading } =
  useMutation(
    (payload: HRLeaveBalanceCreateInput[]) => {
      return createLeaveBalanceBulkCreation(payload);
    },
    {
      onSuccess: (data) => {
        if (data.count > 0) {
          showToast({
            severity: 'success',
            summary: 'Create Leave balance',
            detail: `Total of <strong>${data.count}</strong> ${
              data.count > 1 ? 'Leave balances' : 'Leave balance'
            } successfully created.`,
          });
        }
        router.push({
          name: 'admin-hrms',
          query: {
            activeIndex: 1,
          },
        });
        queryClient.invalidateQueries('leavebalance-list');
      },
    }
  );

const onSubmit = handleSubmit(async (values: Record<string, unknown>) => {
  const transformedLeaves = transformBulkLeaves(values.users);
  await createBulkLeaveBalance(transformedLeaves);
});
</script>

<template>
  <form @submit.stop="onSubmit">
    <div class="p-datatable p-component p-datatable-responsive-scroll">
      <div class="p-datatable-wrapper overflow-x-auto">
        <table
          class="bulk-create-table p-datatable-table w-full"
          role="table"
          cellspacing="0"
          cellpadding="0"
        >
          <thead class="bg-gray-50 p-datatable-thead" role="rowgroup">
            <tr>
              <th role="cell" :style="tableCellStyles">
                Team Member <span class="text-red-600">*</span>
              </th>
              <th role="cell" :style="tableCellStyles">
                Leave type <span class="text-red-600">*</span>
              </th>
              <th role="cell" :style="tableCellStyles">
                Year <span class="text-red-600">*</span>
              </th>
              <th role="cell" :style="tableCellStyles">
                Number of Days <span class="text-red-600">*</span>
              </th>
              <th role="cell" :style="tableActionStyles">Actions</th>
            </tr>
          </thead>
          <tbody class="p-datatable-tbody relative" role="rowgroup">
            <tr
              role="row"
              class="relative"
              :class="[
                {
                  'border-red-400 border-2': (
                    field.value as unknown as EmptyRecord
                  ).error,
                },
              ]"
              v-for="(field, idx) in fields"
              :key="field.key"
            >
              <td role="cell" valign="top" :style="tableCellStyles">
                <label
                  :for="`name_${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                  >User</label
                >
                <VField
                  :id="`name_${idx}`"
                  :name="`users[${idx}].userId`"
                  v-slot="{ handleChange, value, validate }"
                >
                  <MultiSelect
                    class="w-full"
                    @update:model-value="handleChange"
                    @blur="validate()"
                    @change="
                      removeFieldError(field as unknown as Ref<EmptyRecord>)
                    "
                    :model-value="value"
                    :options="usersList"
                    optionLabel="name"
                    optionValue="id"
                    :filter="true"
                    placeholder="Select Team members"
                  />
                  <transition mode="out-in" name="field-slide-down">
                    <FormFeedbackMessage
                      :errors="errors"
                      :values="values"
                      :errorKey="`users[${idx}].userId`"
                    />
                  </transition>
                </VField>
              </td>
              <td role="cell" valign="top" :style="tableCellStyles">
                <label
                  :for="`typeId_${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                  >Leave Type</label
                >
                <VField
                  :id="`typeId_${idx}`"
                  :name="`users[${idx}].typeId`"
                  v-slot="{ handleChange, value, validate }"
                >
                  <Dropdown
                    class="w-full"
                    @update:model-value="handleChange"
                    @blur="validate()"
                    @change="
                      removeFieldError(field as unknown as Ref<EmptyRecord>)
                    "
                    :model-value="value"
                    :options="leaveTypes"
                    optionLabel="name"
                    optionValue="id"
                    :filter="true"
                    placeholder="Select a Leave type"
                  >
                  </Dropdown>
                </VField>
                <transition mode="out-in" name="field-slide-down">
                  <FormFeedbackMessage
                    :errors="errors"
                    :values="values"
                    :errorKey="`users[${idx}].typeId`"
                  />
                </transition>
              </td>
              <td role="cell" valign="top" :style="tableCellStyles">
                <label
                  :for="`year_${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                  >Year</label
                >
                <VField
                  :id="`year_${idx}`"
                  :name="`users[${idx}].year`"
                  v-slot="{ handleChange, value, validate }"
                >
                  <Dropdown
                    class="w-full"
                    @update:model-value="handleChange"
                    @blur="validate()"
                    @change="
                      removeFieldError(field as unknown as Ref<EmptyRecord>)
                    "
                    :model-value="value"
                    :options="lastThreeYears"
                    :filter="true"
                    placeholder="Select a year"
                  />
                  <transition mode="out-in" name="field-slide-down">
                    <FormFeedbackMessage
                      :errors="errors"
                      :values="values"
                      :errorKey="`users[${idx}].year`"
                    />
                  </transition>
                </VField>
              </td>
              <td role="cell" valign="top" :style="tableCellStyles">
                <label
                  :for="`days_${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                  >Number of days</label
                >
                <VField
                  :id="`days_${idx}`"
                  :name="`users[${idx}].days`"
                  v-slot="{ handleChange, value, validate }"
                >
                  <InputNumber
                    placeholder="Enter No. of days"
                    class="w-full"
                    @update:model-value="handleChange"
                    @blur="validate()"
                    @input="
                      removeFieldError(field as unknown as Ref<EmptyRecord>)
                    "
                    :model-value="value as number"
                  />
                </VField>
                <div
                  v-if="values.users[idx].userId.length > 1"
                  class="text-sm font-italic mt-1"
                >
                  Same days will be added to all the selected team members.
                </div>
                <transition mode="out-in" name="field-slide-down">
                  <FormFeedbackMessage
                    :errors="errors"
                    :values="values"
                    :errorKey="`users[${idx}].days`"
                  />
                </transition>
                <div
                  class="p-error api-error"
                  v-if="(field.value as unknown as EmptyRecord).error"
                >
                  {{ (field.value as unknown as EmptyRecord).error }}
                </div>
              </td>
              <td
                role="cell"
                valign="top"
                :style="tableActionStyles"
                class="text-right md:text-left"
              >
                <Button
                  v-if="fields.length > 1"
                  type="button"
                  icon="pi pi-trash"
                  aria-label="delete-record"
                  class="p-button-sm p-button-rounded p-button-danger"
                  @click="remove(idx)"
                />
                <span v-if="idx === fields.length - 1">
                  <Button
                    icon="pi pi-plus"
                    aria-label="add-record"
                    class="p-button-sm p-button-rounded p-button-primary ml-2"
                    @click="addNewRecord"
                  />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex justify-content-between mt-4">
      <Button
        label="Reset"
        class="p-button-danger"
        @click="confirmResetDialog = true"
      />
      <span>
        <Button
          label="Submit"
          type="submit"
          class="p-button ml-2"
          :loading="bulkCreateLoading"
          :disabled="!meta.valid"
        />
      </span>
    </div>
  </form>
  <CommonConfirmRemoveDialog
    v-if="confirmResetDialog"
    :visible="confirmResetDialog"
    title="Confirm Reset Form"
    @confirm="handleResetForm"
    @hide="confirmResetDialog = false"
  >
    Are you sure you want to reset the form? You will lose all entered Leave
    data.
  </CommonConfirmRemoveDialog>
</template>
