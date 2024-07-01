<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import { useMutation, useQueryClient } from 'vue-query';
import type { InferType } from 'yup';
import type { Ref } from 'vue';
import type {
  CommonClientService,
  AccountingPeriod,
  ClientServices,
} from '@/types/client.type';
import { UpdateClientServicesSchema } from '@/types/client.type';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';

import { useClientServiceDelete } from '@/composables/client';
export type UpdateClientStates = InferType<typeof UpdateClientServicesSchema>;
const props = defineProps<{
  services: Partial<CommonClientService>[];
  stateId: string;
  review: boolean;
  federal: boolean;
  loading: boolean;
  fetching: boolean;
  isWithoutState?: boolean;
}>();
const {
  review,
  federal,
  loading,
  fetching,
  services,
  isWithoutState: isWithoutStateProp,
} = toRefs(props);
const queryClient = useQueryClient();
const route = useRoute();
const clientId = ref(route.params.id as string);
const emit = defineEmits<{
  (e: 'back', value: string[]): void;
  (e: 'refresh'): void;
  (e: 'automation'): void;
}>();
type EmptyRecord = CommonClientService & { error?: string };
const serviceTbody = ref<HTMLElement | undefined>(undefined);
const { initToast } = useToasts();
const formKey = ref(0);
const { isMedium } = useCommonBreakPoints();
const {
  accountingPeriodOptions,
  accoutingPeriodLimits,
  getExampleDates,
  defaultRemainderDays,
} = useAccountingPeriod();
const { getServices, getUsers } = useCommonListQueries();
const { data: serviceList } = getServices();
const { data: filterDataUser, applyFilter: applyFilterUser } =
  useFilterColumns();

applyFilterUser('Is Active', 'true');
const userFilters = useEncodeFilterData(filterDataUser);
const { data: usersListOptions } = getUsers(true, true, userFilters);
const tableCellStyles = { 'min-width': '15rem' };
const tableActionStyles = { 'min-width': '11rem' };
const emptyRecord: EmptyRecord = {
  accountingPeriod: 'WEEKLY',
  serviceId: '',
  projectManagerId: '',
  reminderDays: defaultRemainderDays['WEEKLY'],
  dueInDays: accoutingPeriodLimits['WEEKLY'],
  disableService: true,
};
const isActionDailogOpen = ref(false);
const selectedService = ref<EmptyRecord>();
const {
  values: serviceValues,
  errors: serviceErrors,
  validateField,
  setValues,
  validate,
} = useForm({
  validationSchema: UpdateClientServicesSchema,
  validateOnMount: false,
  initialValues: {
    services: props.services
      ? props.services.map((service: any) => ({
          ...emptyRecord,
          serviceId: service.serviceId,
        }))
      : [],
  },
});
const { fields: servicesFields, push, remove } = useFieldArray('services');

const { mutateAsync: createClientServices, isLoading: createBulkIsLoading } =
  useMutation(
    ({
      clientId,
      payload,
    }: {
      clientId: string;
      payload: { clientServices: ClientServices[] };
    }) => {
      return useCreateClientServices(clientId as string, payload);
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Create',
          severity: 'success',
          summary: 'Success',
          detail: 'Client Project Templates Created Successfully',
        });
        emit('automation');
      },
    }
  );
const { mutateAsync: createOneClientService, isLoading: createOneIsLoading } =
  useMutation(
    ({
      clientId,
      payload,
    }: {
      clientId: string;
      payload: CommonClientService;
    }) => {
      return useCreateOneClientService(clientId as string, payload);
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Create',
          severity: 'success',
          summary: 'Success',
          detail: 'Client Project Template Created Successfully',
        });
        queryClient.invalidateQueries('client-services-list');
        emit('refresh');
      },
    }
  );
const { mutateAsync: updateClientServices } = useMutation(
  ({
    clientId,
    id,
    payload,
  }: {
    clientId: string;
    id: string;
    payload: CommonClientService;
  }) => {
    return useUpdateClientServices(clientId as string, id, payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        severity: 'success',
        summary: 'Success',
        detail: 'Client Project Templates Updated Successfully',
      });
    },
  }
);
const { mutateAsync: deleteService } = useMutation(
  ({ clientId, id }: { clientId: string; id: string }) => {
    return useClientServiceDelete(clientId as string, id);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Delete',
        severity: 'error',
        summary: 'Delete Client Project Template',
        detail: 'Client Project Template Deleted Successfully',
      });
      queryClient.invalidateQueries('client-services-list');
    },
  }
);
const removeFieldError = (field: Ref<EmptyRecord>): void => {
  if (!field.value.error) return;
  field.value.error = '';
};

watch(
  () => services,
  () => {
    if (review.value) {
      setValues({
        services: services.value.map((service: any) => {
          return {
            ...service,
            disableService: true,
            disableAll: true,
          };
        }) as unknown as EmptyRecord[],
      });
    } else {
      setValues({
        services: services.value.map((service: any) => ({
          ...emptyRecord,
          serviceId: service.serviceId,
        })) as unknown as EmptyRecord[],
      });
      formKey.value += 1;
    }
  },
  {
    immediate: true,
    deep: true,
  }
);

const handleSubmit = async () => {
  const { valid } = await validate();
  if (!valid) return;
  const payload: ClientServices[] = serviceValues.services.map(
    (service: any) => {
      let servicePayload;
      if (isWithoutStateProp.value) {
        servicePayload = { ...service, isFederal: false };
      } else if (!federal.value) {
        servicePayload = {
          ...service,
          stateId: props.stateId,
          isFederal: false,
        };
      } else {
        servicePayload = { ...service, isFederal: true };
      }
      delete servicePayload.disableService;
      return servicePayload;
    }
  ) as unknown as ClientServices[];
  await createClientServices({
    clientId: clientId.value as string,
    payload: { clientServices: payload },
  });
};
const handleDayValidation = async (
  field: Ref<EmptyRecord>,
  idx: number,
  isremoveFieldError = true,
  onlyReminder = false
) => {
  if (isremoveFieldError) {
    removeFieldError(field);
  }
  const { accountingPeriod } = field.value;
  field.value.dueInDays =
    accoutingPeriodLimits[accountingPeriod as AccountingPeriod];
  field.value.reminderDays =
    defaultRemainderDays[accountingPeriod as AccountingPeriod];
  const tdIndex = review.value || isWithoutStateProp.value ? 6 * idx : 5 * idx;
  const dueInDaysEle: HTMLTableElement = serviceTbody.value?.querySelectorAll(
    'td'
  )[2 + tdIndex] as unknown as HTMLTableElement;
  const reminderDaysEle: HTMLTableElement =
    serviceTbody.value?.querySelectorAll('td')[
      3 + tdIndex
    ] as unknown as HTMLTableElement;
  const dueInDaysInput: HTMLInputElement = dueInDaysEle.querySelector(
    'input'
  ) as unknown as HTMLInputElement;
  const reminderDaysInput: HTMLInputElement = reminderDaysEle.querySelector(
    'input'
  ) as unknown as HTMLInputElement;
  if (onlyReminder) {
    reminderDaysInput.focus();
    setTimeout(() => {
      reminderDaysInput.blur();
    }, 100);
    return;
  }
  dueInDaysInput.focus();
  setTimeout(() => {
    dueInDaysInput.blur();
    reminderDaysInput.focus();
    setTimeout(() => {
      reminderDaysInput.blur();
    }, 50);
  }, 50);
};

const handleCreateEdit = async (idx: string) => {
  const fields = [
    'serviceId',
    'accountingPeriod',
    'dueInDays',
    'reminderDays',
    'projectManagerId',
  ];
  let validateCount = 0;
  for (let i = 0; i < fields.length; i++) {
    const field = `services[${idx}].${fields[i]}`;
    const { valid } = await validateField(field as 'services');
    if (valid) {
      validateCount++;
    }
  }
  if (validateCount !== fields.length) return;

  // console.log('serviceValue.services', serviceValues.services);
  const payload = { ...serviceValues.services[+idx] };

  delete payload.disableService;
  if (payload.id) {
    const id = payload.id;
    delete payload.id;

    const createdService: CommonClientService = await updateClientServices({
      clientId: clientId.value as string,
      id: id as string,
      payload: payload as CommonClientService,
    });
    serviceValues.services[+idx] = {
      ...createdService,
      disableAll: true,
      disableService: true,
    } as CommonClientService;
  } else {
    if (federal.value) {
      payload.isFederal = true;
    } else {
      payload.stateId = props.stateId;
    }
    const createdService: CommonClientService = await createOneClientService({
      clientId: clientId.value as string,
      payload: payload as CommonClientService,
    });
    serviceValues.services[+idx] = {
      ...createdService,
      disableAll: true,
      disableService: true,
    } as CommonClientService;
  }
};
const handleAdd = () => {
  push({ ...emptyRecord, disableService: false });
};

const getAccountingPeriodName = (value: string) => {
  const accountingPeriod = accountingPeriodOptions.find(
    (accountingPeriod) => accountingPeriod.value === value
  );
  return accountingPeriod?.name;
};

const handleDelete = (service: EmptyRecord, idx: number) => {
  if (service.id) {
    selectedService.value = service;
    isActionDailogOpen.value = true;
  } else remove(idx);
};
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <div v-if="!loading && !fetching" class="grid formgrid p-fluid">
    <form class="col-12" :key="formKey">
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
                  <th role="cell" :style="tableCellStyles">
                    Project Template <span class="text-red-500">*</span>
                  </th>
                  <th role="cell" :style="tableCellStyles">
                    Frequency <span class="text-red-500">*</span>
                  </th>
                  <th role="cell" :style="tableCellStyles">
                    Due in Days <span class="text-red-500">*</span>
                  </th>
                  <th role="cell" :style="tableActionStyles">
                    Project Schedule <span class="text-red-500">*</span>

                    <i
                      class="pi pi pi-info-circle ml-1 cursor-pointer"
                      v-tooltip="
                        'Choose the date on which you would like to schedule the project.'
                      "
                    />
                  </th>
                  <th role="cell" :style="tableActionStyles">
                    Project Manager <span class="text-red-500">*</span>
                  </th>
                  <th
                    v-if="review || isWithoutState"
                    role="cell"
                    :style="tableActionStyles"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                class="p-datatable-tbody relative"
                role="rowgroup"
                ref="serviceTbody"
              >
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
                  v-for="(field, idx) in servicesFields"
                  :key="field.key"
                >
                  <td
                    role="cell"
                    valign="top"
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error &&
                          isMedium,
                      },
                    ]"
                  >
                    <label
                      :for="`name_${idx}`"
                      class="mb-2"
                      :class="isMedium ? 'hidden' : 'block'"
                      >Project Template</label
                    >
                    <VField
                      :id="`service_${idx}`"
                      :name="`services[${idx}].serviceId`"
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
                        :options="serviceList"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select Project Template"
                        :disabled="
                          (field.value as unknown as EmptyRecord).disableAll ||
                          (field.value as unknown as EmptyRecord).disableService
                        "
                      >
                        <template #header>
                          <RouterLink
                            :to="{ name: 'admin-services' }"
                            class="flex align-items-center py-2 px-3 font-medium text-sm text-gray-500 hover:text-gray-700"
                          >
                            Add New Project Template
                            <Icon
                              icon="mdi:external-link"
                              class="ml-1 h-1.5rem w-1.5rem"
                            />
                          </RouterLink>
                        </template>
                      </Dropdown>
                    </VField>
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="serviceErrors"
                        :values="serviceValues"
                        :errorKey="`services[${idx}].serviceId`"
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
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error &&
                          isMedium,
                      },
                    ]"
                  >
                    <label
                      :for="`accoutingPeriod_${idx}`"
                      class="mb-2"
                      :class="isMedium ? 'hidden' : 'block'"
                      >Accounting Period</label
                    >
                    <VField
                      :id="`accoutingPeriod_${idx}`"
                      :name="`services[${idx}].accountingPeriod`"
                      v-slot="{ handleChange, value, validate }"
                    >
                      <Dropdown
                        class="w-full"
                        @update:model-value="handleChange"
                        @blur="validate()"
                        @change="
                          handleDayValidation(
                            field as unknown as Ref<EmptyRecord>,
                            idx
                          )
                        "
                        :model-value="value"
                        optionLabel="label"
                        optionValue="value"
                        :options="accountingPeriodOptions"
                        placeholder="Select a Frequency"
                        :disabled="
                          (field.value as unknown as EmptyRecord).disableAll
                        "
                      />
                    </VField>
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="serviceErrors"
                        :values="serviceValues"
                        :errorKey="`services[${idx}].accountingPeriod`"
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
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error &&
                          isMedium,
                      },
                    ]"
                  >
                    <label
                      :for="`dueInDays_${idx}`"
                      class="mb-2"
                      :class="isMedium ? 'hidden' : 'block'"
                      >Due in Days</label
                    >
                    <div class="w-full flex align-items-center space-x-1.5">
                      <VField
                        :id="`dueInDays_${idx}`"
                        :name="`services[${idx}].dueInDays`"
                        v-slot="{ handleChange, value, validate }"
                      >
                        <InputNumber
                          class="w-4rem"
                          @update:model-value="handleChange"
                          @blur="
                            validate();
                            handleDayValidation(
                              field as unknown as Ref<EmptyRecord>,
                              idx,
                              true,
                              true
                            );
                          "
                          :model-value="value as number"
                          placeholder="Due In Days"
                          mode="decimal"
                          :disabled="
                            (field.value as unknown as EmptyRecord).disableAll
                          "
                          :min="
                            (field.value as unknown as EmptyRecord)
                              .accountingPeriod === 'WEEKLY'
                              ? 0
                              : 1
                          "
                          :max="
                            accoutingPeriodLimits[
                              (field.value as unknown as EmptyRecord)
                                .accountingPeriod as AccountingPeriod
                            ]
                          "
                        />
                      </VField>
                      <span>
                        Days of the Following
                        {{
                          getAccountingPeriodName(
                            (field.value as unknown as EmptyRecord)
                              .accountingPeriod
                          )
                        }}
                      </span>
                    </div>
                    <div class="text-sm font-italic">
                      {{
                        getExampleDates({
                          accountingPeriod: (
                            field.value as unknown as EmptyRecord
                          ).accountingPeriod,
                          dueInDays: (field.value as unknown as EmptyRecord)
                            .dueInDays,
                        })
                      }}
                    </div>
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="serviceErrors"
                        :values="serviceValues"
                        :errorKey="`services[${idx}].dueInDays`"
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
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error &&
                          isMedium,
                      },
                    ]"
                  >
                    <label
                      :for="`reminderDays_${idx}`"
                      class="mb-2"
                      :class="isMedium ? 'hidden' : 'block'"
                      >Reminder For Planning</label
                    >
                    <div class="w-full flex align-items-center space-x-1.5">
                      <VField
                        :id="`reminderDays_${idx}`"
                        :name="`services[${idx}].reminderDays`"
                        v-slot="{ handleChange, value, validate }"
                      >
                        <InputNumber
                          class="w-4rem"
                          @update:model-value="handleChange"
                          @blur="validate()"
                          :disabled="
                            (field.value as unknown as EmptyRecord)
                              .disableAll ||
                            (field.value as unknown as EmptyRecord)
                              .dueInDays === null
                          "
                          @input="
                            removeFieldError(
                              field as unknown as Ref<EmptyRecord>
                            )
                          "
                          :model-value="value as number"
                          placeholder="Reminder For Planning"
                          mode="decimal"
                          :min="
                            (field.value as unknown as EmptyRecord)
                              .accountingPeriod === 'WEEKLY'
                              ? 0
                              : 1
                          "
                          :max="
                            (field.value as unknown as EmptyRecord).dueInDays
                          "
                        />
                      </VField>
                      <span> Before Due date </span>
                    </div>
                    <div class="text-sm font-italic">
                      {{
                        getExampleDates({
                          accountingPeriod: (
                            field.value as unknown as EmptyRecord
                          ).accountingPeriod,
                          dueInDays: (field.value as unknown as EmptyRecord)
                            .dueInDays,
                          reminderDays: (field.value as unknown as EmptyRecord)
                            .reminderDays,
                        })
                      }}
                    </div>
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="serviceErrors"
                        :values="serviceValues"
                        :errorKey="`services[${idx}].reminderDays`"
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
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error &&
                          isMedium,
                      },
                    ]"
                  >
                    <label
                      :for="`projectManager_${idx}`"
                      class="mb-2"
                      :class="isMedium ? 'hidden' : 'block'"
                      >projectManager</label
                    >
                    <VField
                      :id="`projectManager_${idx}`"
                      :name="`services[${idx}].projectManagerId`"
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
                        optionLabel="name"
                        optionValue="id"
                        :options="usersListOptions"
                        placeholder="Select a Project Manager"
                        :disabled="
                          (field.value as unknown as EmptyRecord).disableAll
                        "
                      />
                    </VField>
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="serviceErrors"
                        :values="serviceValues"
                        :errorKey="`services[${idx}].projectManagerId`"
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
                    v-if="review || isWithoutState"
                  >
                    <Button
                      v-if="review"
                      type="button"
                      :icon="
                        (field.value as unknown as EmptyRecord).id &&
                        (field.value as unknown as EmptyRecord).disableAll
                          ? 'pi pi-pencil'
                          : 'pi pi-check'
                      "
                      aria-label="delete-record"
                      class="p-button-sm p-button-rounded mr-2"
                      @click="
                        !(field.value as unknown as EmptyRecord).disableAll
                          ? handleCreateEdit(idx.toString())
                          : ((
                              field.value as unknown as EmptyRecord
                            ).disableAll = false)
                      "
                      :loading="
                        !(field.value as unknown as EmptyRecord).id
                          ? createOneIsLoading
                          : false
                      "
                    />
                    <Button
                      v-if="
                        ((field.value as unknown as EmptyRecord).id &&
                          idx === servicesFields.length - 1) ||
                        (!review && idx === servicesFields.length - 1)
                      "
                      icon="pi pi-plus"
                      aria-label="add-record"
                      class="p-button-sm p-button-rounded p-button-primary mr-2"
                      @click="handleAdd"
                    />
                    <Button
                      v-if="review || servicesFields.length > 1"
                      type="button"
                      icon="pi pi-trash"
                      aria-label="delete-record"
                      class="p-button-sm p-button-rounded p-button-danger"
                      :class="{
                        '': !(field.value as unknown as EmptyRecord).id,
                      }"
                      @click="
                        handleDelete(field.value as unknown as EmptyRecord, idx)
                      "
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </form>
  </div>
  <CommonLoading v-else />
  <div v-if="!review" class="flex justify-content-between px-3 mt-3">
    <Button
      label="Back"
      icon="pi pi-chevron-left"
      @click="emit('back', services.map((e) => e.serviceId) as string[])"
      class="max-w-max p-button-text"
    ></Button>
    <Button
      label="Submit"
      class="max-w-max"
      @click="handleSubmit"
      :loading="createBulkIsLoading"
    ></Button>
  </div>

  <CommonConfirmRemoveDialog
    v-if="isActionDailogOpen"
    :visible="isActionDailogOpen"
    :title="'Confirm Delete Project Template'"
    @confirm="
      deleteService({
        clientId: clientId as string,
        id: selectedService?.id as string,
      })
    "
    @hide="isActionDailogOpen = false"
  >
    Are you sure you want to delete the Project Template?
  </CommonConfirmRemoveDialog>
</template>

<style lang="scss" scoped></style>
