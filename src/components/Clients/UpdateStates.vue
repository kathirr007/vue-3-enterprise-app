<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { InferType } from 'yup';
import type {
  Client,
  ClientStatesPayload,
  CommonClientState
} from '@/types/client.type';
import { UpdateClientStatesSchema } from '@/types/client.type';
import type { Ref } from 'vue';

import Dropdown from 'primevue/dropdown';

export type UpdateClientStates = InferType<typeof UpdateClientStatesSchema>;
type EmptyRecord = CommonClientState & { error?: string };

const props = defineProps<{
  id?: string;
}>();

const disabledTooltip = inject('disabledTooltip');
const canDoActions = inject('canDoActions');
const clientDetails = inject<Client>('clientDetails');

const formKey = ref(0);
const { id } = toRefs(props);
const country = ref('');
const selectedState = ref<CommonClientState>();
const previousLyAddedCountry = ref('');
const isActionDailogOpen = ref(false);
const currentAction = ref<'disable' | 'enable'>('disable');

const { canDo } = usePermissions();
const route = useRoute();
const clientId = ref(route.params.id as string);
const { dateToHumanShort, titleCase } = useVueFilters();
const queryClient = useQueryClient();
const { initToast } = useToasts();
const { isMedium } = useCommonBreakPoints();
const instance = getCurrentInstance();
const { getCountriesList, getStatesList } = useCommonListQueries();
const { handleTooltip } = useTooltip();

const enabled = computed(() => !!country.value);

const { data: countriesList } = getCountriesList();
const { data: statesList } = getStatesList(country, enabled, 'states-list');
const tableCellStyles = { 'min-width': '10rem' };
const tableActionStyles = { 'min-width': '11rem' };

const emptyRecord: EmptyRecord = {
  country: '',
  state: [],
  error: ''
};

const {
  values: stateValues,
  errors: stateErrors,
  validateField,
  setValues
} = useForm({
  validationSchema: UpdateClientStatesSchema,
  validateOnMount: false,
  initialValues: {
    states: [{ ...emptyRecord }]
  }
});
const { remove, push: usePush, fields: userFields } = useFieldArray('states');
setValues({ states: [{ ...emptyRecord }] });

// functions
async function handleCountryChange(field: Ref<EmptyRecord>,
  idx: number,
  removeError = true) {
  if (removeError) {
    removeFieldError(field);
  }
  country.value = stateValues.states[idx].country;
  await queryClient.invalidateQueries('states-list');
  useDebounceFn(() => {
    setValues({
      states: [
        ...stateValues.states.slice(0, idx),
        {
          ...field.value,
          stateOptions: statesList.value?.filter(
            s => !states.value?.map(e => e.state).includes(s.id)
          )
        },
        ...stateValues.states.slice(idx + 1)
      ] as unknown as EmptyRecord[]
    });
    formKey.value++;
  }, 500)();
  await nextTick(() => {
    instance?.proxy?.$forceUpdate();
  });
}
async function handleCreateEdit(idx: string) {
  const fields = ['country', 'state'];
  let allFieldsValid = false;
  for (let i = 0; i < fields.length; i++) {
    const field = `states[${idx}].${fields[i]}`;
    const { valid } = await validateField(field as 'states');
    allFieldsValid = valid;
  }

  if (allFieldsValid) {
    const payload = { ...stateValues.states[+idx] };
    createClientStates({
      clientId: id?.value as string,
      payload: { stateIds: payload.state as string[] }
    });
  }
}
function removeFieldError(field: Ref<EmptyRecord>): void {
  if (!field.value.error)
    return;
  field.value.error = '';
}

// queries
const { mutateAsync: createClientStates, isLoading: createIsLoading }
  = useMutation(
    ({
      clientId,
      payload
    }: {
      clientId: string;
      payload: ClientStatesPayload;
    }) => {
      return useCreateClientStates(
        clientId as string,
        payload
      ) as Promise<CommonClientState>;
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Create',
          severity: 'success',
          summary: 'Success',
          detail: `${$tConfig('CLIENT')} States Created Successfully`
        });
        queryClient.invalidateQueries('client-states-list');
      }
    }
  );
const { mutateAsync: enableDisableState } = useMutation(
  ({ clientId, id }: { clientId: string; id: string }) => {
    return currentAction.value === 'disable'
      ? useClientStateDisable(clientId, id)
      : useClientStateEnable(clientId, id);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: currentAction.value === 'disable' ? 'Disable' : 'Enable',
        title: 'State',
        detail: `${$tConfig('CLIENT')} State ${titleCase(currentAction.value)}d Successfully`
      });
      queryClient.invalidateQueries('client-states-list');
    }
  }
);
const { data: states, isLoading: statesIsLoading } = useQuery(
  'client-states-list',
  () => {
    return useClientStates(clientId.value as string);
  }
);
// watchers
watch(
  () => states.value,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      setValues({ states: [...newVal] });
      let previousStates: string[] = [];
      newVal?.forEach((e, i) => {
        if (i > 0 && newVal[i].country === newVal[i - 1].country) {
          previousStates = statesList.value as unknown as string[];
        }
        handleCountryChange(ref(e) as unknown as Ref<EmptyRecord>, i, false);
      });
      previousLyAddedCountry.value = newVal[newVal.length - 1].country;
    }
  },
  { immediate: true }
);

function disableOrEnable(data: EmptyRecord) {
  selectedState.value = data;
  currentAction.value = data.isActive ? 'disable' : 'enable';
  isActionDailogOpen.value = true;
}
function handleDisableEnable() {
  enableDisableState({
    clientId: id?.value as string,
    id: selectedState.value?.state as string
  });
}

function getButtonAttrs(data: EmptyRecord) {
  return {
    icon: data.id
      ? data.isActive
        ? 'ban'
        : ' pi-check-circle p-button-icon'
      : 'trash',
    tooltip: data.id ? (data.isActive ? 'Disable' : 'Enable') : 'Delete',
    class: !data.id || data.isActive ? 'p-button-danger' : 'p-button-success'
  };
}
</script>

<template>
  <CommonLoading v-if="statesIsLoading" />
  <div v-else-if="states?.length" class="grid formgrid p-fluid">
    <form :key="formKey" class="col-12">
      <div class="col-12">
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
                  <th v-if="false" role="cell" :style="tableCellStyles">
                    Country <span class="text-red-500">*</span>
                  </th>
                  <th role="cell" :style="tableCellStyles">
                    State <span class="text-red-500">*</span>
                  </th>
                  <th role="cell" :style="tableCellStyles">
                    Working Since
                  </th>
                  <th role="cell" :style="tableCellStyles" class="text-center">
                    Project Template
                  </th>
                  <th role="cell" :style="tableCellStyles" class="text-center">
                    Active/Scheduled Projects
                  </th>
                  <th role="cell" :style="tableCellStyles" class="text-center">
                    Completed Projects
                  </th>
                  <th role="cell" :style="tableActionStyles">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="p-datatable-tbody relative" role="rowgroup">
                <tr
                  v-for="(field, idx) in userFields"
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
                    v-if="false"
                    role="cell"
                    valign="top"
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error
                          && isMedium,
                      },
                    ]"
                  >
                    <label
                      :for="`name_${idx}`"
                      class="mb-2"
                      :class="isMedium ? 'hidden' : 'block'"
                    >Contry</label>
                    <VField
                      :id="`country_${idx}`"
                      v-slot="{ handleChange, value, validate }"
                      :name="`states[${idx}].country`"
                    >
                      <Dropdown
                        class="w-full"
                        :model-value="value"
                        :options="countriesList"
                        option-label="country"
                        option-value="country"
                        placeholder="Select a Country"
                        :disabled="true"
                        @update:model-value="handleChange"
                        @blur="validate()"
                        @change="
                          handleCountryChange(
                            field as unknown as Ref<EmptyRecord>,
                            idx,
                          )
                        "
                      />
                    </VField>

                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="stateErrors"
                        :values="stateValues"
                        :error-key="`states[${idx}].country`"
                      />
                    </transition>
                    <div
                      v-if="(field.value as unknown as EmptyRecord).error"
                      class="p-error api-error"
                    >
                      {{ (field.value as unknown as EmptyRecord).error }}
                    </div>
                  </td>
                  <td
                    role="cell"
                    valign="top"
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error
                          && isMedium,
                      },
                    ]"
                  >
                    <label
                      v-if="!(field.value as unknown as EmptyRecord).id"
                      :for="`state_${idx}`"
                      class="mb-2"
                      :class="isMedium ? 'hidden' : 'block'"
                    >State</label>

                    <VField
                      v-if="!(field.value as unknown as EmptyRecord).id"
                      :id="`state_${idx}`"
                      v-slot="{ handleChange, value, validate }"
                      :name="`states[${idx}].state`"
                    >
                      <MultiSelect
                        class="w-full"
                        :model-value="value"
                        :options="
                          (field.value as unknown as EmptyRecord).stateOptions
                        "
                        option-label="name"
                        option-value="id"
                        placeholder="Select states"
                        :disabled="!!(field.value as unknown as EmptyRecord).id"
                        :max-selected-labels="2"
                        @update:model-value="handleChange"
                        @blur="validate()"
                        @change="
                          removeFieldError(field as unknown as Ref<EmptyRecord>)
                        "
                      />
                      <transition mode="out-in" name="field-slide-down">
                        <FormFeedbackMessage
                          :errors="stateErrors"
                          :values="stateValues"
                          :error-key="`users[${idx}].orgUserRoleId`"
                        />
                      </transition>
                    </VField>
                    <span v-else>
                      {{ (field.value as unknown as EmptyRecord).stateName }}
                    </span>
                    <transition
                      v-if="!(field.value as unknown as EmptyRecord).id"
                      mode="out-in"
                      name="field-slide-down"
                    >
                      <FormFeedbackMessage
                        :errors="stateErrors"
                        :values="stateValues"
                        :error-key="`states[${idx}].state`"
                      />
                    </transition>
                    <div
                      v-if="
                        !(field.value as unknown as EmptyRecord).id
                          && (field.value as unknown as EmptyRecord).error
                      "
                      class="p-error api-error"
                    >
                      {{ (field.value as unknown as EmptyRecord).error }}
                    </div>
                  </td>
                  <td
                    role="cell"
                    valign="top"
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error
                          && isMedium,
                      },
                    ]"
                  >
                    {{
                      (field.value as unknown as EmptyRecord).createdAt
                        === undefined
                        ? '-'
                        : dateToHumanShort(
                          (field.value as unknown as EmptyRecord)
                            .createdAt as string,
                        )
                    }}
                  </td>
                  <td
                    role="cell"
                    valign="top"
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error
                          && isMedium,
                      },
                    ]"
                    class="text-center"
                  >
                    {{
                      (field.value as unknown as EmptyRecord).serviceCount
                        === undefined
                        ? '-'
                        : (field.value as unknown as EmptyRecord).serviceCount
                    }}
                  </td>
                  <td
                    role="cell"
                    valign="top"
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error
                          && isMedium,
                      },
                    ]"
                    class="text-center"
                  >
                    {{
                      (field.value as unknown as EmptyRecord)
                        .activeProjectCount === undefined
                        ? '-'
                        : (field.value as unknown as EmptyRecord)
                          .activeProjectCount
                    }}
                  </td>
                  <td
                    role="cell"
                    valign="top"
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error
                          && isMedium,
                      },
                    ]"
                    class="text-center"
                  >
                    {{
                      (field.value as unknown as EmptyRecord)
                        .completedProjectCount === undefined
                        ? '-'
                        : (field.value as unknown as EmptyRecord)
                          .completedProjectCount
                    }}
                  </td>

                  <td
                    role="cell"
                    valign="top"
                    :style="tableActionStyles"
                    class="text-right md:text-left flex align-items-center justify-content-end md:justify-content-start flex-wrap"
                  >
                    <Button
                      v-if="!(field.value as unknown as EmptyRecord).id"
                      type="button"
                      icon="pi pi-check"
                      :loading="createIsLoading"
                      aria-label="delete-record"
                      class="p-button-sm p-button-rounded mr-2"
                      @click="handleCreateEdit(idx.toString())"
                    />

                    <div
                      v-if="
                        idx === userFields.length - 1
                          && !!(field.value as unknown as EmptyRecord).id
                      "
                      v-tooltip.top="`${!canDoActions ? disabledTooltip : ''}`"
                      style="height: 2.357rem;"
                    >
                      <Button
                        v-if="canDo('clients', 'create')"
                        :disabled="!canDoActions"
                        icon="pi pi-plus"
                        aria-label="add-record"
                        class="p-button-sm p-button-rounded p-button-primary mr-2"
                        @click="
                          usePush({
                            ...emptyRecord,
                            country: previousLyAddedCountry,
                          });
                          handleCountryChange(
                            userFields[
                              userFields.length - 1
                            ] as unknown as Ref<EmptyRecord>,
                            userFields.length - 1,
                            false,
                          );
                        "
                      />
                    </div>
                    <div
                      v-if="userFields.length > 1"
                      v-tooltip.top="
                        handleTooltip(
                          !!canDoActions,
                          getButtonAttrs(field.value as unknown as EmptyRecord)
                            .tooltip as string,
                          disabledTooltip as string,
                        )
                      "
                      style="height: 2.357rem;"
                    >
                      <Button
                        v-if="canDo('clients', 'delete')"
                        :disabled="!canDoActions"
                        type="button"
                        :icon="`pi pi-${
                          getButtonAttrs(field.value as unknown as EmptyRecord)
                            .icon
                        }`"
                        aria-label="delete-record"
                        class="p-button-sm p-button-rounded"
                        :class="
                          getButtonAttrs(field.value as unknown as EmptyRecord)
                            .class
                        "
                        @click="
                          !!(field.value as unknown as EmptyRecord).id
                            ? disableOrEnable(
                              field.value as unknown as EmptyRecord,
                            )
                            : remove(idx)
                        "
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </form>
  </div>
  <div v-else>
    <ClientsBulkStates />
  </div>

  <CommonConfirmRemoveDialog
    v-if="isActionDailogOpen"
    :visible="isActionDailogOpen"
    :title="`Confirm ${
      currentAction === 'disable' ? 'Disable' : 'Enable'
    }' State`"
    @confirm="handleDisableEnable"
    @hide="isActionDailogOpen = false"
  >
    <div>
      <div>
        Are you sure you want to
        {{ currentAction === 'disable' ? 'Disable' : 'Enable' }} the State?
      </div>
      <div v-if="currentAction === 'disable'" class="mt-1">
        This will stop recurring projects for
        <strong>{{ selectedState?.name || 'State' }}</strong> of
        <strong>{{ clientDetails?.name || `${$tConfig('CLIENT')}` }}</strong> .
      </div>
    </div>
  </CommonConfirmRemoveDialog>
</template>
