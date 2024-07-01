<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import type {
  CreateProject,
  Project,
  ProjectStatus
} from '@/types/project.type';
import { ProjectCreatePayloadSchema } from '@/types/project.type';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Divider from 'primevue/divider';
import {
  useGenerateTasks,
  useProjectDetails,
  useProjectUpdate
} from '@/composables/project';
import Dropdown from 'primevue/dropdown';
import { useCommonListQueries } from '@/composables/common';
import Textarea from 'primevue/textarea';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import Calender from 'primevue/calendar';
import type { APIActions } from '@/types/common.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import dayjs from 'dayjs';
import type { Client, ClientState } from '@/types/client.type';
import type { Ref } from 'vue';
import type { Service } from '@/types/service.type';

type ClientStateOptions = Pick<ClientState, 'id'> &
  Pick<ClientState['state'], 'name'>;

interface billingOption {
  name?: string;
  value?: string;
  id?: string;
}

const props = defineProps<{
  clientId?: string;
  templateDetails?: Service;
  disableBrightAssist?: boolean;
}>();
const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'success', data: Project): void;
  (e: 'brightAssist', data: boolean): void;
  (e: 'tasks', data: any): void;
  (e: 'pipeline', data: any): void;
  (e: 'emitStep'): void;
  (e: 'modalClose'): void;
  (e: 'back', step: 'template'): void;
  (e: 'template', value: string): void;
}>();

const router = useRouter();
const route = useRoute();
const { featureSubscribed, canAccessAllMenu } = usePermissions();

const subscribeDialog = ref(false);
const showNoBillingAttached = ref(false);
const projectName = ref<string>();
const formValues = ref();
const startDateValue = ref('');
const formKey = ref(0);
const formRef = ref<SchemaFormRef | null>(null);
const brightAssistValue = ref(
  featureSubscribed('ai_features', 'generate_task')
);
const projectId = ref(route.params.id as string);
const selectedClientId = ref(props.clientId || '');
const selectedClient = ref<Client>();
const clientStateOptions = ref<ClientStateOptions[]>([]);

const { isPortalUser } = useCurrentUserData();
const { ISODatestringToDate } = useVueFilters();
const { isRobotDialog, notValidData, failedMsg, showDialog } = useAiInfo();
const queryClient = useQueryClient();
const { initToast } = useToasts();
const { focusFirstInput, focusAndBlurInput, isFalsy } = useUtilityFns();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);

const dueDateChecker = computed(() => {
  return formRef.value?.schemaFormValues.dueDate;
});

const managerChecker = computed(() => {
  return formRef.value?.schemaFormValues.projectManagerId;
});

const {
  data: isAvailableCheckQuery,
  isLoading: checkingAvailability,
  isFetching: fetchingAvailability
} = useQuery(
  ['check-availability', dueDateChecker, managerChecker],
  async () =>
    checkAvailability({
      date: dueDateChecker.value,
      userId: managerChecker.value
    }),
  {
    enabled: !isPortalUser.value
  }
);

const {
  usersListOptions,
  isFetching: fetchingUsersList,
  isLoading: loadingUsersList
} = useUserListOptions(true, initialFilters);
const { getClients, getProjectStatuses } = useCommonListQueries();

const {
  data: clientList,
  isLoading: loadingClients,
  isFetching: fetchingClients
} = getClients(true, initialFilters);

const billingTypeValue = computed<billingOption[]>(() => {
  const billingTypeOptions = [
    { name: 'None', value: 'NONE', id: '01' },
    { name: 'Fixed', value: 'FIXED', id: '02' },
    { name: 'Per Unit (1 Unit = 60 minute(s))', value: 'HOURLY', id: '03' }
  ];
  if (selectedClient.value) {
    const unitInMinutes = selectedClient.value?.clientBillingProfile?.[0]?.billingProfile?.unitInMinutes;
    const billingTypeHourlyIndex = billingTypeOptions.findIndex((item: billingOption) => item.value === 'HOURLY');
    if (billingTypeHourlyIndex !== -1) {
      billingTypeOptions[billingTypeHourlyIndex] = { ...billingTypeOptions[billingTypeHourlyIndex], name: `Per Unit (1 Unit = ${unitInMinutes || 60} minute(s))` };
    }
  }

  return billingTypeOptions;
});

function handleAction(data: Project, actionType: APIActions) {
  initToast({
    actionType,
    title: 'Project',
    actionObj: { ...data }
  });
  emit('success', data as Project);
  if (actionType === 'Create') {
    router.push({
      name: 'admin-projects-id',
      params: { id: data.id }
    });
    queryClient.invalidateQueries('project-list');
  }
  if (actionType === 'Update') {
    queryClient.invalidateQueries('project-details');
  }
}

const { data: projectStatuses, isLoading } = getProjectStatuses();

const { data: allStates } = useQuery(
  'all-states',
  () => {
    return useCountryStatesList({ country: 'USA' });
  },
  {
    onSuccess: (data) => {
      clientStateOptions.value = data;
      updateOptions(
        getGroupedStateOptions(
          clientStateOptions.value as ClientStateOptions[]
        ),
        stateIndex
      );
    }
  }
);

const { data: projectDetails } = useQuery(
  'project-details',
  () => {
    if (!projectId.value || route.name !== 'admin-projects-id')
      return;
    return useProjectDetails(projectId.value as string);
  },
  {
    onSuccess: (data: Project) => {
      if (data) {
        formValues.value = { ...data };
        selectedClientId.value = data.clientId;
        /* if (data.dueDate) {
          updateFieldProp('disabled', dueDateIndex, false);
        }
        if (data?.clientId) {
          updateFieldProp('disabled', clientIndex, true);
          updateFieldProp('showClear', clientIndex, false);
          updateFieldProp('disabled', stateIndex, true);
          updateFieldProp('showClear', stateIndex, false);
        }
        if (data?.billingType) {
          if (formValues.value['billingType'] === 'HOURLY') {
            updateFieldProp('inputGroupSuffix', rateIndex, '/ Hour');
          } else {
            updateFieldProp('inputGroupSuffix', rateIndex, '');
          }
        } */
      }
    }
  }
);

function getGroupedStateOptions(states: ClientStateOptions[]) {
  const federalOption = {
    label: 'Federal',
    options: [
      {
        id: 'federal',
        name: 'Federal'
      }
    ]
  };
  const stateOptions = computed(() => {
    if (states?.length) {
      return [
        federalOption,
        {
          label: 'States',
          options: states
        }
      ];
    }
    return [federalOption];
  });
  return stateOptions;
}

const formData = computed<SchemaForm>(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'name',
        label: 'Project Title',
        required: true,
        autocomplete: 'off',
        formGridClass: 'md:col-12  ',
        placeholder: 'Enter Title of the new Project'
      },
      {
        name: 'brightAssistSwitch',
        as: InputText,
        showSlot: true,
        hide:
          (!!projectId.value && props.clientId === undefined)
          || !!props.templateDetails
      },

      {
        as: Textarea,
        name: 'description',
        label: 'Description',
        rows: 6,
        placeholder: 'Enter a brief Project Description.',
        required:
          (!projectId.value
          || !props.templateDetails
          || props.clientId !== undefined)
          && brightAssistValue.value,
        showLabelSlot:
          (!projectId.value || props.clientId !== undefined)
          && brightAssistValue.value
      },
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'clientId',
        label: `${$tConfig('CLIENT')}`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: `Select ${$tConfig('CLIENT')}`,
        formGridClass: 'md:col-6 ',
        disabled: !!props.clientId || !!projectDetails.value?.clientId,
        showClear: !props.clientId,
        options: clientList.value || [],
        loading: fetchingClients.value || loadingClients.value
      },
      {
        type: 'dropdown',
        as: Dropdown,
        required: false,
        name: 'stateId',
        label: `Federal/State`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: 'Select Federal/State',
        formGridClass: 'md:col-6',
        optionGroupLabel: 'label',
        optionGroupChildren: 'options',
        showClear: true,
        options: clientStateOptions.value
          ? getGroupedStateOptions(
            clientStateOptions.value as ClientStateOptions[]
          ).value
          : [],
        disabled:
          !!projectDetails.value?.stateId
          || !formRef.value?.schemaFormValues?.clientId
      },
      {
        as: Calender,
        type: 'calender',
        required: true,
        name: 'startDate',
        label: 'Start Date',
        placeholder: 'Enter Start Date',
        formGridClass: 'md:col-6',
        dateFormat: 'dd M yy',
        minDate: dayjs().toDate()
      },
      {
        as: Calender,
        type: 'calender',
        required: true,
        name: 'dueDate',
        label: 'Due Date',
        placeholder: 'Enter Due Date',
        formGridClass: 'md:col-6',
        dateFormat: 'dd M yy',
        minDate: dayjs().toDate(),
        showSlot: true
        // disabled: isFalsy(formRef.value?.schemaFormValues?.startDate),
      },
      {
        as: Divider,
        name: 'divider',
        label: 'divider'
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'billingType',
        label: `Billing Details`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'value',
        placeholder: 'Select Billing Type',
        formGridClass: 'md:col-6 ',
        filter: false,
        options: billingTypeValue.value,
        required: !!formRef.value?.schemaFormValues?.clientId,
        disabled: !formRef.value?.schemaFormValues?.clientId
      },
      {
        as: InputNumber,
        name: 'billingRate',
        label: 'Billing Amount',
        mode: 'currency',
        currency: 'USD',
        locale: 'en-US',
        inputGroup: true,
        disabled: !formRef.value?.schemaFormValues?.clientId,
        inputGroupPrefix: '$',
        inputGroupSuffix:
          formRef.value?.schemaFormValues?.billingType === 'HOURLY'
          || (formValues.value && formValues.value.billingType === 'HOURLY')
            ? '/ Unit'
            : '',
        autocomplete: 'off',
        formGridClass: 'md:col-6',
        placeholder: '$0.00',
        type: 'input-number',
        inputId: 'billingRate',
        hide:
          formRef.value?.schemaFormValues?.billingType === null
          || formRef.value?.schemaFormValues?.billingType === 'NONE',
        required: !!formRef.value?.schemaFormValues?.clientId,
        value: props.templateDetails?.billingRate
          ? +props.templateDetails.billingRate
          : null
      },
      {
        name: 'showNoBillingAttached',
        showSlot: true,
        formGridClass: 'py-0'
      },
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'projectManagerId',
        label: `Project Manager`,
        required: true,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: 'Select Project Manager',
        formGridClass: 'md:col-6 ',
        options: usersListOptions.value || [],
        loading: fetchingUsersList.value || loadingUsersList.value
      },
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'reviewerId',
        label: `Reviewer`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: 'Select Reviewer',
        formGridClass: 'md:col-6 ',
        options: usersListOptions.value || [],
        loading: fetchingUsersList.value || loadingUsersList.value
      }
    ],
    validationSchema: ProjectCreatePayloadSchema,
    initialValues: props.templateDetails || formValues,
    btnText:
      ((!projectId.value || props.clientId !== undefined)
      && brightAssistValue.value)
      || props.templateDetails
        ? 'Continue'
        : 'Submit',
    secondaryBtnText: props.templateDetails ? 'Back' : 'Cancel'
  } as SchemaForm;
});
const { mutateAsync: createProjectData, isLoading: creatingProject }
  = useMutation(
    async (payload: CreateProject) => {
      let tasks;
      if (brightAssistValue.value) {
        tasks = await useGenerateTasks(
          {
            description: payload.description as string,
            title: payload.name
          },
          true
        );
      }
      else if (props.templateDetails) {
        tasks = props.templateDetails.taskTemplates;
      }
      const data = await useCreateProject(payload);
      return { data, tasks };
    },
    {
      onSuccess: (res) => {
        if (brightAssistValue.value || props.templateDetails) {
          initToast({
            actionType: 'Create',
            title: 'Project',
            actionObj: { ...res.data }
          });
          if ((props.templateDetails as Service)?.id) {
            emit('pipeline', { ...res, isFromTemplate: true });
          }
          else {
            emit('tasks', res);
          }
        }
        else handleAction(res.data as Project, 'Create');
        if (Array.isArray(res.data) && !res.data.length) {
          notValidData.value = true;
        }
      },
      onError: () => {
        if (brightAssistValue.value) {
          notValidData.value = true;
        }
      }
    }
  );

const { mutateAsync: updateProject, isLoading: updatingProject } = useMutation(
  (payload: Partial<CreateProject>) => {
    return useProjectUpdate(projectDetails.value?.id as string, payload);
  },
  {
    onSuccess: (data) => {
      if ((props.templateDetails as Service)?.id) {
        emit('pipeline', { ...data, isFromTemplate: true });
      }
      handleAction(data as unknown as Project, 'Update');
      if (Array.isArray(data) && !data.length) {
        notValidData.value = true;
      }
    },
    onError: () => {
      notValidData.value = true;
    }
  }
);

const {
  findFormIndex,
  updateFieldProp,
  updateOptions,
  updateStartDueDateValidation
} = useSchemaForm(formData);
const billingIndex: number = findFormIndex('billingType');
const clientIndex: number = findFormIndex('clientId');
const projectIndex: number = findFormIndex('projectManagerId');
const reviewerIndex: number = findFormIndex('reviewerId');
const dueDateIndex: number = findFormIndex('dueDate');
const rateIndex: number = findFormIndex('billingRate');
const stateIndex: number = findFormIndex('stateId');

function handleDropdownChange(val: Record<string, unknown>, name: string) {
  formValues.value = { ...val };
  if (name === 'clientId') {
    if (!val.clientId) {
      formRef.value?.setFieldValue('billingType', undefined);
      formRef.value?.setFieldValue('billingRate', undefined);
      formValues.value = { ...val, billingType: undefined, billingRate: undefined };
      showNoBillingAttached.value = false;
    }
    selectedClientId.value = val.clientId as string;
    /* if (val.clientId) {
      // updateFieldProp('disabled', stateIndex, false);
      // updateFieldProp('required', stateIndex, true);
    } else {
      // updateFieldProp('disabled', stateIndex, true);
      // updateFieldProp('required', stateIndex, false);
      selectedClientId.value = '';
    } */
    formRef.value?.setFieldValue('stateId', null);
    formRef.value?.setFieldError('stateId', '');
    updateOptions(
      getGroupedStateOptions(allStates.value as ClientStateOptions[]),
      stateIndex
    );
  }
  if (name === 'billingType') {
    const billingType = val.billingType;
    if (billingType && billingType !== 'NONE') {
      useTimeoutFn(() => {
        focusAndBlurInput(
          formRef as unknown as Ref<SchemaFormRef>,
          'billingRate',
          'input',
          false
        );
      }, 300); // wait for the field to show up
    }
  }
}

function handleCalendar(val: Record<string, unknown>, name: string) {
  if (val.startDate) {
    updateStartDueDateValidation(val, formRef as unknown as Ref<SchemaFormRef>);
    updateFieldProp('disabled', dueDateIndex, false);
  }
}

function handleCancel() {
  if (props.templateDetails) {
    emit('back', 'template');
  }
  else {
    emit('modalClose');
  }
}

async function onSubmit(values: Record<string, any>) {
  const { ...rest } = values;
  const payload: Partial<CreateProject> = { ...rest, statusId: '' };
  payload.statusId = projectStatuses.value?.filter(
    (status: ProjectStatus) => status.name === 'Scheduled'
  )[0].id;
  if (payload.stateId && payload.stateId === 'federal') {
    payload.isFederal = true;
    delete payload.stateId;
  }
  if ((props.templateDetails as Service)?.id) {
    payload.serviceId = props.templateDetails?.id;
  }
  projectName.value = values.name;

  if (values.billingType === undefined) {
    payload.billingType = 'NONE';
    delete payload.billingRate;
  }

  if (projectId.value && route.name === 'admin-projects-id') {
    const { statusId, ...updatePayload } = payload;
    await updateProject(updatePayload as unknown as CreateProject);
  }
  else {
    await createProjectData(payload as unknown as CreateProject);
  }
  emit('modalClose');
}

function handleBrightAssist(value: boolean) {
  if (value && featureSubscribed('ai_features', 'generate_task') === false) {
    subscribeDialog.value = true;
    value = false;
    brightAssistValue.value = false;
  }
  formRef.value?.setValues({
    ...formRef.value.schemaFormValues,
    isBrightAssist: value
  });
  if (!value) {
    formRef.value?.setFieldError('description', '');
  }
  formRef.value?.validate({ mode: 'silent' });
  // forceudpate in vue 3
  const instance = getCurrentInstance();
  instance?.appContext.config.globalProperties.$forceUpdate();
  emit('brightAssist', value);
}

onMounted(() => {
  updateFieldProp('disabled', dueDateIndex, true);
  setTimeout(() => {
    if (
      !projectId.value
      || !props.templateDetails
      || props.clientId !== undefined
    ) {
      formRef.value?.setValues({
        ...formRef.value.schemaFormValues,
        isBrightAssist: featureSubscribed('ai_features', 'generate_task')
      });
    }
    if (props.templateDetails || props.disableBrightAssist) {
      brightAssistValue.value = false;
      formRef.value?.setValues({
        ...formRef.value.schemaFormValues,
        isBrightAssist: false
      });
    }
  }, 1000);
});

watchEffect(() => {
  if (!brightAssistValue.value) {
    isRobotDialog.value = false;
  }
  else {
    isRobotDialog.value = creatingProject.value;
  }
  // updateOptions(clientList, clientIndex);
  // updateOptions(billingTypeValue, billingIndex);
  // updateOptions(usersListOptions, projectIndex);
  // updateOptions(usersListOptions, reviewerIndex);
  /* if (
    (formValues.value &&
      formValues.value['billingType'] &&
      formValues.value['billingType'] !== 'NONE') ||
    props.templateDetails?.billingType !== 'NONE'
  ) {
    updateFieldProp('hide', rateIndex, false);
  }
  if (
    formValues.value &&
    (formValues.value['billingType'] === null ||
      formValues.value['billingType'] === 'NONE')
  ) {
    updateFieldProp('hide', rateIndex, true);
  } */
  if (startDateValue.value) {
    updateFieldProp('minDate', dueDateIndex, startDateValue.value);
  }
  if (selectedClientId.value) {
    formRef.value?.setValues({
      ...formRef.value.schemaFormValues,
      clientId: selectedClientId.value
    });
    // queryClient.invalidateQueries('client-details');
    // updateOptions(clientList, clientIndex);
    selectedClient.value = clientList.value?.find(
      (client: Client) => client.id === selectedClientId.value
    );
    showNoBillingAttached.value = !selectedClient.value?.clientBillingProfile.length;
    clientStateOptions.value = selectedClient.value?.clientStates?.map(
      (state: ClientState) => ({ id: state.id, name: state.state.name })
    ) as ClientStateOptions[];
    updateOptions(
      getGroupedStateOptions(clientStateOptions.value as ClientStateOptions[]),
      stateIndex
    );
    // if (formRef.value?.schemaFormValues?.clientId) {
    //   updateFieldProp('required', stateIndex, true);
    // } else updateFieldProp('required', stateIndex, false);
    if (props.clientId)
      updateFieldProp('disabled', stateIndex, false);
  }
});
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :primary-btn-loading="creatingProject || updatingProject"
    @dropdown-change="handleDropdownChange"
    @secondary-btn-click="handleCancel"
    @submit="onSubmit"
    @calendar-input="handleCalendar"
  >
    <template #brightAssistSwitch>
      <div class="flex align-items-center">
        <InputSwitch v-model="brightAssistValue" @input="handleBrightAssist" />
        <!-- <Icon
          icon="fluent-emoji:robot"
          class="ml-1"
          style="font-size: 2.2rem"
        /> -->
        <img
          src="/images/robot-icon.png"
          alt="bright assistant robot"
          class="w-3rem ml-1"
        >
      </div>
      <Message :closable="false" severity="info" class="mt-1 p-custom-message">
        {{
          brightAssistValue
            ? 'BrightAssistant, Powered by AI, generates tasks for this project based on the description provided in the box below.'
            : 'Enable BrightAssistant to automatically add tasks to this project.'
        }}
      </Message>
    </template>
    <template #dueDate="{ ...attrs }">
      <div class="field mb-0">
        <label class="block font-medium text-900" for="dueDate">
          {{ attrs.label }}
          <span v-if="attrs.required" class="text-red-600">*</span>
        </label>
        <VField v-slot="{ handleChange, value, validate }" name="dueDate">
          <Calendar
            v-bind="attrs"
            :id="attrs.name"
            class="w-full"
            :input-id="attrs.name"
            :disabled="!(attrs.values as any)?.startDate"
            :min-date="dayjs(`${(attrs.values as any)?.startDate}`).toDate()"
            :model-value="ISODatestringToDate(value as string)"
            @update:model-value="handleChange"
            @blur="validate()"
          />
        </VField>
        <span
          v-if="
            !isPortalUser
              && !(checkingAvailability || fetchingAvailability)
              && !isAvailableCheckQuery
          "
          class="font-normal text-orange-500"
        >Leaves/Holidays are conflicting with Project's Due date</span>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="(attrs.errors as ComputedRef).value"
            :values="(attrs.values as ComputedRef).value"
            error-key="dueDate"
            :feedback="true"
          />
        </transition>
      </div>
    </template>
    <template #description-label="values">
      <span>{{ values.label }}</span>
      <span v-if="values.required" class="text-red-600 ml-1">*</span>
      <i
        v-tooltip="
          'Provide detailed description with compliance/service name, location, and frequency for efficient task generation.'
        "
        class="pi pi-info-circle ml-1 cursor-pointer"
        tabindex="0"
      />
    </template>
    <template #showNoBillingAttached>
      <transition mode="out-in" name="field-slide-down">
        <div v-if="showNoBillingAttached" class="-mt-3 p-error">
          {{
            `Selected ${$tConfig('CLIENT').toLowerCase()}
              is not attached to any billing profile, please attach ${$tConfig('CLIENT').toLowerCase()} to billing profile,`
          }} <span>check <a href="#">here(link of knowledge base)</a>.</span>
        </div>
      </transition>
    </template>
  </CommonSchemaForm>

  <Dialog
    v-model:visible="showDialog"
    modal
    append-to="body"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
    content-class="border-round-bottom-md"
  >
    <CommonAiInfo
      title="Hi I am BrightAssistant, your AI Team"
      :show-loading="creatingProject || updatingProject"
    >
      <template #content>
        <p class="font-medium text-base mt-2">
          <template v-if="notValidData">
            {{ failedMsg }}
          </template>
          <span v-else>
            Awesome! Your instructions have been incredibly helpful. Now, sit
            back and relax while I handle creation of tasks for the project
            <strong>{{ projectName }}</strong> for you.
          </span>
        </p>
      </template>
    </CommonAiInfo>
  </Dialog>
  <CommonSubscribeDialog
    v-if="subscribeDialog"
    :visible="subscribeDialog"
    feature="bright assist"
    @hide="subscribeDialog = false"
  />
</template>
