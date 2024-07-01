<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import { useMutation, useQuery } from 'vue-query';
import type { Designation } from '@/types/designation.type';
import type { CreateUserPayload, User } from '@/types/teams.type';
import { InviteTeamPayloadSchema } from '@/types/teams.type';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';

import type { Ref } from 'vue';
import type { AxiosError } from 'axios';
import router from '@/router';
import { Icon } from '@iconify/vue';

type EmptyRecord = CreateUserPayload & { error: string };
interface teamMembers { users: CreateUserPayload[] }

const { isMedium } = useCommonBreakPoints();
const { showToast } = useToasts();

const tableCellStyles = { 'min-width': '15rem' };
const tableActionStyles = { 'min-width': '8rem' };

const emptyRecord: EmptyRecord = {
  firstName: '',
  orgUserRoleId: '',
  designationId: '',
  managerId: '',
  email: '',
  error: ''
};

const failedRecords = ref<EmptyRecord[]>([]);
const successRecords = ref<EmptyRecord[]>([]);
const confirmResetDialog = ref(false);
const refetchKey = ref(0);
const duplicateEmails = ref<string[]>([]);
const { getDesignations, getRoles } = useCommonListQueries();
const {
  data: filterData,
  applyFilter,
  applyDynamicFilter
} = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const { usersListOptions } = useUserListOptions(true, initialFilters);
const { isPortalUser } = useCurrentUserData();

const { data: designations } = getDesignations();
const { data: roles } = getRoles(true);
const { getDuplicates } = useUtilityFns();
const { data: customerDetails } = useQuery(
  ['customer-details', refetchKey],
  () => {
    return useCustomerDetails();
  }
);

const { data: teamUserLimits } = useQuery('team-limit', () => {
  return getResourceLimits({ resource: 'TEAM_MEMBER' });
});

/* const { data: teamLimits } = useQuery('team-limit', () => {
  return getResourceLimits({ resource: ResourceType['team member'] });
});

const teamResource = computed(() => {
  const limitComputed = teamLimits.value?.[0].limit === -1 ? 0 : teamLimits.value?.[0].limit;
  const usageComputed = teamLimits.value?.[0].orgSubscriptionResourceUsages ? teamLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
  return { limit: limitComputed, usage: usageComputed };
}); */

const { resourceUsage: teamResource } = useUsageLimit({
  isPortalUser: isPortalUser.value,
  queryKey: 'team-limit',
  resource: 'team member'
});

const currentActiveUsers = computed(() => {
  return teamResource.value.usage;
});

const userLimit = computed(() => {
  return teamResource.value.limit;
});

const availableLimit = computed(() => {
  return (
    userLimit.value
    && userLimit.value - currentActiveUsers.value
  );
});

const { handleSubmit, meta, values, errors, setValues, resetForm, validate }
  = useForm({
    validationSchema: InviteTeamPayloadSchema,
    validateOnMount: false,
    initialValues: {
      users: [{ ...emptyRecord }]
    }
  });

const { remove, push, fields } = useFieldArray('users');

function addNewRecord() {
  push(emptyRecord);
  validate({
    mode: 'silent'
  });
}

const { mutateAsync: createTeamMember, isLoading: createBulkIsLoading }
  = useMutation((payload: CreateUserPayload) => useUserCreate(payload), {
    onSuccess: (data: User, variables) => {
      successRecords.value?.push({ ...variables, error: '' });
    },
    onError: (err: AxiosError<any, any>, variables) => {
      failedRecords.value?.push({
        ...variables,
        error: err.response?.data.message
          ? err.response?.data.message
          : err.message
      });
    }
  });

async function makeParallelAPIReq(payloadArr: Record<string, unknown>[]) {
  if (payloadArr.length === 0) {
    return;
  }
  await Promise.allSettled(
    payloadArr.map(async (item) => {
      const { error, ...payload } = item;
      await createTeamMember(payload as unknown as CreateUserPayload);
    })
  );
}

function removeFieldError(field: Ref<EmptyRecord>): void {
  duplicateEmails.value = getDuplicates(values.users, 'email');
  duplicateEmails.value = [...new Set(duplicateEmails.value)];
  if (!field.value.error)
    return;
  field.value.error = '';
}

function handleResetForm() {
  resetForm();
  duplicateEmails.value = [];
}

const onSubmit = handleSubmit(async (val: any) => {
  await makeParallelAPIReq((val).users);
  refetchKey.value++;

  if (successRecords.value.length > 0) {
    showToast({
      severity: 'success',
      summary: 'Create Team Member',
      detail: `Total of <strong>${successRecords.value.length}</strong> ${
        successRecords.value.length > 1 ? 'Team Members are' : 'Team Member'
      } successfully created.`
    });
    successRecords.value = [];
    if (!failedRecords.value.length) {
      resetForm();
    }
  }

  if (failedRecords.value.length > 0) {
    showToast({
      severity: 'error',
      summary: 'Create Team Member',
      detail: `Total of <strong>${failedRecords.value.length}</strong> ${
        failedRecords.value.length > 1 ? 'records are' : 'record'
      } failed to create team members.`
    });
    setValues({ users: [...failedRecords.value] });
    failedRecords.value = [];
  }
});
function goToDesignation(data: Designation) {
  if (data.id === 'add-new') {
    router.push({ name: 'admin-roles-and-designations' });
  }
}
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
                Role <span class="text-red-600">*</span>
              </th>
              <th role="cell" :style="tableCellStyles">
                Designation <span class="text-red-600">*</span>
                <i
                  v-tooltip="
                    'Go To Administrator to create custom Designation.'
                  "
                  class="pi pi-info-circle ml-1"
                />
              </th>
              <th role="cell" :style="tableCellStyles">
                Report To <span class="text-red-600">*</span>
              </th>
              <th role="cell" :style="tableCellStyles">
                Email <span class="text-red-600">*</span>
              </th>
              <th role="cell" :style="tableActionStyles">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="p-datatable-tbody relative" role="rowgroup">
            <tr
              v-for="(field, idx) in fields"
              :key="field.key"
              role="row"
              class="relative"
              :class="[
                {
                  'border-red-400 border-2': (
                    field.value as unknown as EmptyRecord
                  ).error,
                },
              ]"
            >
              <td
                role="cell"
                valign="top"
                :style="tableCellStyles"
                :class="[
                  {
                    'pb-4':
                      (field.value as unknown as EmptyRecord).error && isMedium,
                  },
                ]"
              >
                <label
                  :for="`name_${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                >Team Member</label>
                <VField
                  :id="`name_${idx}`"
                  :name="`users[${idx}].firstName`"
                  class="w-full"
                  :as="InputText"
                  placeholder="Firstname Lastname"
                  @input="
                    removeFieldError(field as unknown as Ref<EmptyRecord>)
                  "
                />
                <transition mode="out-in" name="field-slide-down">
                  <FormFeedbackMessage
                    :errors="errors"
                    :values="values"
                    :error-key="`users[${idx}].firstName`"
                  />
                </transition>
                <div
                  v-if="(field.value as unknown as EmptyRecord).error"
                  class="p-error api-error"
                >
                  {{ (field.value as unknown as EmptyRecord).error }}
                </div>
              </td>
              <td role="cell" valign="top" :style="tableCellStyles">
                <label
                  :for="`role_${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                >Role</label>
                <VField
                  :id="`role_${idx}`"
                  v-slot="{ handleChange, value, validate }"
                  :name="`users[${idx}].orgUserRoleId`"
                >
                  <Dropdown
                    class="w-full"
                    :model-value="value"
                    :options="roles"
                    option-label="name"
                    option-value="id"
                    placeholder="Select a Role"
                    @update:model-value="handleChange"
                    @blur="validate()"
                    @change="
                      removeFieldError(field as unknown as Ref<EmptyRecord>)
                    "
                  />
                  <transition mode="out-in" name="field-slide-down">
                    <FormFeedbackMessage
                      :errors="errors"
                      :values="values"
                      :error-key="`users[${idx}].orgUserRoleId`"
                    />
                  </transition>
                </VField>
              </td>
              <td role="cell" valign="top" :style="tableCellStyles">
                <label
                  :for="`designation_${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                >Designation</label>
                <VField
                  :id="`designation_${idx}`"
                  v-slot="{ handleChange, value, validate }"
                  :name="`users[${idx}].designationId`"
                >
                  <Dropdown
                    class="w-full"
                    :model-value="value"
                    :options="designations"
                    option-label="name"
                    option-value="id"
                    :filter="true"
                    placeholder="Select a Designation"
                    @update:model-value="handleChange"
                    @blur="validate()"
                    @change="
                      removeFieldError(field as unknown as Ref<EmptyRecord>)
                    "
                  >
                    <template #header>
                      <RouterLink
                        :to="{ name: 'admin-roles-and-designations' }"
                        class="flex align-items-center py-2 px-3 font-medium text-sm text-gray-500 hover:text-gray-700"
                      >
                        Add New Designation
                        <Icon
                          icon="mdi:external-link"
                          class="ml-1 h-1.5rem w-1.5rem"
                        />
                      </RouterLink>
                    </template>
                    <template #option="slotProps">
                      <div
                        class="flex justify-content-between"
                        @click="goToDesignation(slotProps.option)"
                      >
                        <div>{{ slotProps.option.name }}</div>
                        <div v-if="slotProps.option.org === null">
                          <span class="text-orange-500">Predefined</span>
                        </div>
                      </div>
                    </template>
                  </Dropdown>
                </VField>
                <transition mode="out-in" name="field-slide-down">
                  <FormFeedbackMessage
                    :errors="errors"
                    :values="values"
                    :error-key="`users[${idx}].designationId`"
                  />
                </transition>
              </td>
              <td role="cell" valign="top" :style="tableCellStyles">
                <label
                  :for="`report-to${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                >Report To</label>
                <VField
                  :id="`report-to_${idx}`"
                  v-slot="{ handleChange, value, validate }"
                  :name="`users[${idx}].managerId`"
                >
                  <Dropdown
                    class="w-full"
                    :model-value="value"
                    :options="usersListOptions"
                    option-label="name"
                    option-value="id"
                    :filter="true"
                    placeholder="Select a Reporter"
                    @update:model-value="handleChange"
                    @blur="validate()"
                    @change="
                      removeFieldError(field as unknown as Ref<EmptyRecord>)
                    "
                  />
                </VField>
                <transition mode="out-in" name="field-slide-down">
                  <FormFeedbackMessage
                    :errors="errors"
                    :values="values"
                    :error-key="`users[${idx}].managerId`"
                  />
                </transition>
              </td>
              <td role="cell" valign="top" :style="tableCellStyles">
                <label
                  :for="`email_${idx}`"
                  class="mb-2"
                  :class="isMedium ? 'hidden' : 'block'"
                >Email</label>
                <VField
                  :id="`email_${idx}`"
                  :name="`users[${idx}].email`"
                  type="email"
                  class="w-full"
                  :as="InputText"
                  placeholder="Email"
                  @input="
                    removeFieldError(field as unknown as Ref<EmptyRecord>)
                  "
                />
                <transition mode="out-in" name="field-slide-down">
                  <FormFeedbackMessage
                    :errors="errors"
                    :values="values"
                    :error-key="`users[${idx}].email`"
                  />
                </transition>
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
                  class="p-button-sm p-button-rounded p-button-danger mr-2"
                  @click="remove(idx)"
                />
                <span
                  v-if="idx === fields.length - 1"
                  v-tooltip.top="
                    `${
                      availableLimit
                      && fields.length >= availableLimit
                      && !customerDetails?.onTrial
                        ? `Can't add more than available limit ${availableLimit}`
                        : !customerDetails?.onTrial
                          && !(fields.length >= availableLimit)
                          ? `Available limit of ${teamUserLimits?.[0]?.limit} users already created`
                          : 'Add row'
                    }`
                  "
                  class="inline-block"
                >
                  <Button
                    :disabled="
                      !customerDetails?.onTrial
                        && fields.length >= availableLimit
                    "
                    icon="pi pi-plus"
                    aria-label="add-record"
                    class="p-button-sm p-button-rounded p-button-primary"
                    @click="addNewRecord"
                  />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="duplicateEmails.length > 0">
      <div
        class="text-red-500"
        v-html="
          `Duplicate email(s) found. <i><strong >${duplicateEmails.join(
            ', ',
          )}</strong></i>. Please remove duplicate emails to submit the form.`
        "
      />
    </div>

    <div class="flex justify-content-between mt-4">
      <Button
        label="Reset"
        class="p-button-danger"
        @click="confirmResetDialog = true"
      />
      <span
        v-tooltip.top="
          `${
            !customerDetails?.onTrial && availableLimit === 0
              ? `Please upgrade your account to add more users`
              : ''
          }`
        "
      >
        <Button
          label="Submit & Send invitation"
          type="submit"
          class="p-button ml-2"
          :disabled="
            !meta.valid
              || (!customerDetails?.onTrial && availableLimit === 0)
              || duplicateEmails.length > 0
          "
          :loading="createBulkIsLoading"
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
    Are you sure you want to reset the form? You will lose all entered Team
    Member data.
  </CommonConfirmRemoveDialog>
</template>
