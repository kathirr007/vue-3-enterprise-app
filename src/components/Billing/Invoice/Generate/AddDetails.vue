<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import type {
  ClientBillingProfile,
  CreateProfileDetailsPayload
} from '@/types/client-billing.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import { useMutation, useQueries, useQuery, useQueryClient } from 'vue-query';
import { GenerateInvoiceDetailsSchema } from '@/types/client-billing-invoices.type';
import type {
  ClientBillingInvoice,
  GenerateInvoicePayload,
  InvoiceLineItemsPayload
} from '@/types/client-billing-invoices.type';
import Divider from 'primevue/divider';
import Dropdown from 'primevue/dropdown';
import type { Project } from '@/types/project.type';
import type { Client } from '@/types/client.type';
import dayjs from 'dayjs';
import Textarea from 'primevue/textarea';
import type { Task } from '@/types/tasks.type';

type EmptyRecord = InvoiceLineItemsPayload & { error: string };

const props = withDefaults(defineProps<{
  projects?: Project[];
  tasks?: Task[];
  client?: Client;
  billingProfile?: ClientBillingProfile;
  clientBillingInvoice?: ClientBillingInvoice;
  create?: boolean;
  apiKey?: number;
  loading?: boolean;
  hideBackButton?: boolean;
  btnText?: boolean;
}>(), {
  projects: () => [],
  tasks: () => []
});

const emit = defineEmits<{
  (e: 'emitStep', step: string): void;
  (e: 'back', step: 'form'): void;
  (e: 'skip', step: 'form'): void;
  (e: 'form', value: CreateProfileDetailsPayload, id?: string): void;
  (e: 'success'): void;
}>();

const emptyRecord: EmptyRecord = {
  projectName: '',
  amount: null,
  rate: null,
  quantity: 1,
  description: '',
  error: ''
};

const {
  billingProfile: detailBillingProp,
  projects: projectsProp,
  tasks: tasksProp,
  client: clientProp,
  clientBillingInvoice: clientBillingInvoiceProp
} = toRefs(props);

const { getOne: getBillingProfile } = useClientBilling();
const { update: updateInvoice, createOne, getTaskBillingDetails } = useClientBillingInvoices();
const { fullName, initials, titleCase } = useVueFilters();
const { initToast } = useToasts();
const queryClient = useQueryClient();
const route = useRoute();
const { currentUser } = useCurrentUserData();

const currentClientBillingId = ref<string>(route.params.id as string);
const updatedProfileDetails = ref<ClientBillingProfile>(
  detailBillingProp?.value as unknown as ClientBillingProfile
);
const logoId = ref();
const openLogoDialog = ref(false);
const formRef = ref<SchemaFormRef>();
const country = ref('');
const discountType = ref<'%' | '$'>('$');
const taxType = ref<'%' | '$'>('$');
const taxDiscountOptions = reactive(['%', '$']);
const countryEnabled = computed(() => !!country.value);
const subTotal = ref(0);
const projectSubTotal = ref(0);
const discountAmount = ref(0);
const taxAmount = ref(0);
const otherCharges = ref();
const projectBillingRate = ref(0);
const projectBillableAmount = ref(0);
const submitType = ref<'draft' | 'send'>();
const reminderOptions = reactive([
  { name: 'true', value: true, radioLabel: 'Yes' },
  { name: 'false', value: false, radioLabel: 'No' }
]);
const projectQuantity = ref<number>(1);
const projectDetailsBodyStyle = ref({ 'vertical-align': 'top' });

const projectsAndTasksLength = computed(() => [...(projectsProp.value as Project[]), ...(tasksProp.value as Task[])].length);
const projectsLength = computed(() => [...(projectsProp.value as Project[])]?.length);

const discountCalculated = computed(() => {
  return discountType.value === '%'
    ? (discountAmount.value / 100) * subTotal.value
    : discountAmount.value;
});
const taxCalculated = computed(() => {
  return taxType.value === '%'
    ? (taxAmount.value / 100) * (subTotal.value - discountCalculated.value)
    : taxAmount.value;
});
const afterTaxAndDiscount = computed(() => {
  return subTotal.value + taxCalculated.value - discountCalculated.value;
});
const finalAmount = computed(() => {
  return afterTaxAndDiscount.value + (otherCharges.value || 0);
});

const { isFalsy } = useUtilityFns();
const { getCountriesList, getStatesList, getUsers } = useCommonListQueries();
const { data: countriesList, isFetching: fetchingCountries }
  = getCountriesList();
const { data: statesList, isFetching: fetchingStates } = getStatesList(
  country,
  countryEnabled,
  'states-list'
);
const { data: usersList, isLoading: loadingUsers } = getUsers();

const projectsQueriesOptions = computed(() => {
  if (!(projectsProp.value as Project[])?.length) { return []; }
  return (projectsProp.value as Project[])?.map((project: Project) => {
    return {
      queryKey: ['project', project.id],
      queryFn: () => useProjectDetails(project.id)
    };
  });
}
);
const projectsQueries = useQueries(projectsQueriesOptions as ComputedRef<{ queryKey: string[]; queryFn: () => Promise<Project> }[]>);
const isLoadingProjects = computed(() => projectsQueries.some((item: any) => item.isLoading || item.isFetching));
const projectsQueriesData = computed(() => projectsQueries.map((item: any) => {
  const { data } = item;
  return { ...data, rate: data.billingRate, quantity: data.billableQuantity, amount: data.billingRate * data.billableQuantity };
}));
const tasksQueriesOptions = computed(() => {
  if (!(tasksProp.value as Task[])?.length) {
    return [];
  }
  return (tasksProp.value as Task[])?.map((task: Task) => {
    return {
      queryKey: ['task', task.id],
      queryFn: () => getTaskBillingDetails(task.id)
    };
  });
}
);
const tasksQueries = useQueries(tasksQueriesOptions as ComputedRef<{ queryKey: string[]; queryFn: () => Promise<Task> }[]>);
const isLoadingTasks = computed(() => tasksQueries.some((item: any) => item.isLoading || item.isFetching));
const tasksQueriesData = computed(() => tasksQueries.map((item: any) => {
  const { data } = item;
  return { ...data, amount: data.billableAmount, rate: data.billableAmount, quantity: data.billableQuantity, name: data.title };
}));

const { data: clientDetails, isLoading: loadingClientDetails } = useQuery(
  ['client-details', clientProp],
  () => {
    if (!clientProp?.value)
      return;
    return useClientDetails(clientProp?.value.id as string);
  },
  {
    onSuccess: (data: Client) => {
      if (data) {
        const { address, city, state, country: clientCountry, zipcode } = data;
        country.value
          = (clientCountry as string) || formRef.value?.schemaFormValues.country;
        formRef.value?.setValues({
          ...formRef.value?.schemaFormValues,
          clientName: data.name || formRef.value?.schemaFormValues.clientName,
          clientId: data.id || formRef.value?.schemaFormValues.clientId,
          address: address || formRef.value?.schemaFormValues.address,
          city: city || formRef.value?.schemaFormValues.city,
          state: state || formRef.value?.schemaFormValues.state,
          country: clientCountry || formRef.value?.schemaFormValues.country,
          zipcode: zipcode || formRef.value?.schemaFormValues.zipcode
        });
      }
    },
    enabled: !!clientProp?.value
  }
);

const { data: billingProfileDetails } = useQuery(
  ['billing-profile-details', detailBillingProp],
  () => {
    if (!detailBillingProp?.value)
      return;
    return getBillingProfile(detailBillingProp?.value?.id as string);
  },
  {
    onSuccess: (data: ClientBillingProfile) => {
      if (data) {
        const { address, city, state, country, zipcode, ...rest } = data;
        formRef.value?.setValues({
          ...formRef.value?.schemaFormValues,
          ...rest,
          endDate: dayjs()
            .add((data.dueInDays as number) || 7, 'day')
            .toISOString()
        });
      }
    },
    enabled: !!detailBillingProp?.value
  }
);

function setInitialValues() {
  const generatePreviousInvoiceDetails = (val: ClientBillingInvoice) => {
    const { data, client, project, raisedBy, amount } = val;
    // subTotal.value = data.amount as number;
    discountAmount.value = data.discount
      ? data.discount
      : (data.discountAmount as number);
    discountType.value = data.discount ? '%' : '$';
    taxAmount.value = data.tax ? data.tax : (data.taxAmount as number);
    taxType.value = data.tax ? '%' : '$';
    otherCharges.value = data.otherCharges as number;
    country.value = data.country as string;
    // projectBillableAmount.value = (project.billingRate as number) || 0;
    // projectBillingRate.value = (project.billingRate as number) || 0;
    return {
      ...data,
      amount: amount as number,
      clientName: client.name,
      raisedBy: raisedBy.id as string,
      currency: 'USD',
      reminderEnabled: false
    };
  };
  return !isFalsy(clientBillingInvoiceProp?.value)
    ? generatePreviousInvoiceDetails(
      clientBillingInvoiceProp?.value as ClientBillingInvoice
    )
    : {
        ...billingProfileDetails.value,
        clientName: projectsProp?.value?.[0]?.client.name,
        currency: 'USD',
        clientId: projectsProp?.value?.[0]?.client.id,
        raisedBy: currentUser.value?.id,
        startDate: dayjs().toISOString(),
        endDate: dayjs().add(
          (billingProfileDetails.value?.dueInDays as number) || 7,
          'D'
        ),
        lineItems: (tasksProp.value.length || projectsProp.value.length) ? [...(projectsQueriesData.value as Project[]), ...(tasksQueriesData.value as Task[])] : [{ ...emptyRecord }],
        reminderEnabled: false
      };
}

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'clientName',
        label: `${$tConfig('CLIENT')} Name`,
        required: true,
        disabled: true
      },
      {
        as: InputText,
        name: 'clientId',
        label: 'Client ID',
        disabled: true,
        hide: true
      },
      {
        as: InputText,
        name: 'currency',
        label: 'Currency',
        disabled: true,
        hide: true
      },
      {
        as: InputText,
        name: 'address',
        label: 'Street',
        placeholder: 'Street',
        formGridClass: 'md:col-6',
        required: true
      },
      {
        as: InputText,
        name: 'city',
        label: 'City',
        placeholder: 'City',
        formGridClass: 'md:col-6',
        required: true
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'country',
        label: 'Country',
        optionLabel: 'country',
        optionValue: 'country',
        placeholder: 'Select Country',
        formGridClass: 'md:col-6',
        required: true,
        options: countriesList.value || []
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'state',
        label: 'State',
        optionLabel: 'name',
        optionValue: 'id',
        required: true,
        options: statesList.value || [],
        placeholder: 'Select State',
        formGridClass: 'md:col-6',
        disabled: isFalsy(formRef.value?.schemaFormValues.country)
      },
      {
        as: InputText,
        name: 'zipcode',
        label: 'Zipcode',
        required: true,
        placeholder: 'Enter Zipcode',
        formGridClass: 'md:col-6'
      },
      {
        name: 'taxNo',
        label: 'Tax No',
        as: InputText,
        placeholder: 'Enter Tax No',
        formGridClass: 'md:col-6'
      },
      /* {
        name: 'invoiceNumber',
        label: 'Invoice No',
        as: InputText,
        placeholder: 'Enter Invoice No',
        formGridClass: 'md:col-6',
      }, */
      {
        as: Calendar,
        type: 'calender',
        name: 'startDate',
        label: 'Invoice Date',
        placeholder: 'Invoice Date',
        formGridClass: 'md:col-6',
        dateFormat: 'dd M yy',
        minDate: dayjs().toDate(),
        required: true,
        disabled: true
      },
      {
        as: Calendar,
        type: 'calender',
        name: 'endDate',
        label: 'Due Date',
        placeholder: 'Due Date',
        formGridClass: 'md:col-6',
        dateFormat: 'dd M yy',
        minDate: dayjs().toDate(),
        required: true
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'raisedBy',
        label: 'Raised By',
        optionLabel: 'name',
        optionValue: 'id',
        options: usersList.value || [],
        formGridClass: 'md:col-6',
        required: true
      },
      {
        as: Divider,
        name: 'divider',
        label: 'divider',
        dividerClass: 'my-1'
      },
      {
        as: InputText,
        name: 'subject',
        label: 'Subject',
        formGridClass: ''
      },
      {
        as: Textarea,
        name: 'notes',
        label: 'Customer Notes',
        formGridClass: 'md:col-6'
      },
      {
        as: Textarea,
        name: 'terms',
        label: 'Terms and Conditions',
        formGridClass: 'md:col-6'
      },
      {
        name: 'reminderEnabled',
        label: 'Reminder',
        showSlot: true
      },
      {
        as: InputText,
        name: 'projectName',
        label: 'Project Name',
        formGridClass: 'md:col-8',
        disabled: true,
        hide: true
      },
      {
        as: InputText,
        name: 'description',
        label: 'Description',
        disabled: true,
        hide: true
      },
      {
        as: InputText,
        name: 'projectId',
        label: 'Project ID',
        disabled: true,
        hide: true
      },
      {
        name: 'projectDetails',
        showSlot: true
      },
      {
        name: 'amountDetails',
        showSlot: true
      }
    ],
    hideButtons: true,
    btnText: !props.btnText ? 'Next' : 'Submit',
    secondaryBtnText: !props.hideBackButton ? 'Back' : '',
    validationSchema: GenerateInvoiceDetailsSchema,
    initialValues: setInitialValues()
  } as SchemaForm;
});

function addNewRecord() {
  formRef.value?.push(emptyRecord);
  formRef.value?.validate({
    mode: 'silent'
  });
}
function removeRecord(index: number) {
  formRef.value?.remove(index);
  formRef.value?.validate({
    mode: 'silent'
  });
}

async function handleDropdownChange(val: Record<string, any>, name: string) {
  if (name === 'country') {
    country.value = '';
    await nextTick();
    country.value = val.country;
    formRef.value?.validateField('zipcode');
  }
}

const {
  isLoading: createOrUpdatingInvoice,
  mutateAsync: createOrUpdateInvoice
} = useMutation(
  ({
    payload,
    id
  }: {
    payload: Partial<GenerateInvoicePayload>;
    id?: string;
  }) => {
    if (id) {
      return submitType.value === 'send'
        ? updateInvoice(id, payload, true)
        : updateInvoice(id, payload);
    }
    else {
      return submitType.value === 'send'
        ? createOne(payload as GenerateInvoicePayload, true)
        : createOne(payload as GenerateInvoicePayload);
    }
  },
  {
    onSuccess(data) {
      initToast({
        actionType: 'Update',
        summary:
          submitType.value === 'send'
            ? 'Save and Send Invoice'
            : 'Save Invoice',
        detail:
          submitType.value === 'send'
            ? 'Invoice has been saved and sent successfully'
            : 'Invoice has been saved successfully'
      });
      queryClient.invalidateQueries('client-billing-invoices');
      queryClient.invalidateQueries('invoice-limit');
      emit('success');
    }
  }
);

function handleAmountChange(val: number, index: number) {
  formRef.value?.setFieldValue(`lineItems[${index}].amount`, val);
}

function handleSubmit(formSubmitType: 'draft' | 'send') {
  submitType.value = formSubmitType;
}

async function onSubmit(formValues: Record<string, any>) {
  const { logo, name, lineItems, projectName, ...restValues } = formValues;
  const updatedLineItems = lineItems.map((lineItem: EmptyRecord) => {
    const { error, projectName, amount, quantity, rate, description, ...rest } = lineItem;
    return { projectName, amount, rate, quantity, description };
  });
  const payload = {
    ...restValues,
    lineItems: updatedLineItems,
    projectIds: projectsProp.value?.map((project: Project) => project.id) || [],
    taskIds: tasksProp.value?.map((task: Task) => task.id) || [],
    startDate: dayjs(restValues.startDate).format('YYYY-MM-DD'),
    endDate: dayjs(restValues.endDate).format('YYYY-MM-DD'),
    billingProfileId:
      detailBillingProp?.value?.id
      || clientBillingInvoiceProp?.value?.data.billingProfileId,
    tax: taxType.value === '%' ? taxAmount.value : 0,
    discount: discountType.value === '%' ? discountAmount.value : 0,
    taxAmount: taxCalculated.value,
    discountAmount: discountCalculated.value,
    otherCharges: otherCharges.value,
    zipcode: `${restValues.zipcode}`
  };

  if (!isFalsy(clientBillingInvoiceProp?.value)) {
    await createOrUpdateInvoice({
      payload,
      id: clientBillingInvoiceProp?.value?.id as string
    });
  }
  else {
    await createOrUpdateInvoice({ payload });
  }
}

watchEffect(() => {
  if (!props.projects && projectBillingRate.value >= 0) {
    subTotal.value
      = (projectQuantity.value as number) * projectBillingRate.value;
    projectSubTotal.value
      = (projectQuantity.value as number) * projectBillingRate.value;
  }
  if (formRef.value?.schemaFormValues) {
    const sumTotal = formRef.value?.schemaFormValues.lineItems.reduce((acc: number, curr: EmptyRecord, currIndex: number) => {
      return (projectsProp.value || tasksProp.value) && currIndex <= projectsAndTasksLength.value - 1 ? acc + (curr?.amount || curr?.billableAmount as number) : acc + (curr.rate as number) * (curr.quantity as number);
    }, 0);
    subTotal.value = sumTotal;
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonLoading v-if="loading || isLoadingProjects || isLoadingTasks" />
  <CommonSchemaForm
    v-else
    ref="formRef"
    :data="formData"
    :primary-btn-loading="loading || createOrUpdatingInvoice"
    use-field-array-key="lineItems"
    @submit="onSubmit"
    @secondary-btn-click="emit('back', 'form')"
    @dropdown-change="handleDropdownChange"
  >
    <template #projectDetails>
      <div class="field">
        <DataTable :value="(formRef?.fields as unknown as any[])">
          <Column :body-style="projectDetailsBodyStyle">
            <template #header>
              Services <span class="text-red-600">*</span>
            </template>
            <template #body="{ data, index }">
              <span v-if="index <= projectsAndTasksLength - 1">
                {{ formRef?.setFieldValue(`lineItems[${index}].projectName`, `${!isFalsy(clientBillingInvoice)
                  ? clientBillingInvoice?.project?.name
                  : (data?.value?.name || data?.value?.title) || 'NA'}`) }}
                {{
                  !isFalsy(clientBillingInvoice)
                    ? clientBillingInvoice?.project?.name
                    : (data?.value?.name || data?.value?.title) || 'NA'
                }}
              </span>
              <template v-else>
                <VField
                  v-slot="{ handleChange, value, validate }"
                  :name="`lineItems[${index}].projectName`"
                >
                  <InputText
                    class="w-12rem"
                    :input-id="`lineItems[${index}].projectName`"
                    :model-value="`${!isFalsy(clientBillingInvoice)
                      ? (data?.value?.projectName) : (value as string)}` "
                    @update:model-value="handleChange"
                    @blur="validate()"
                  />
                </VField>
                <FormFeedbackMessage
                  :errors="formRef?.errors"
                  :values="formRef?.schemaFormValues"
                  :error-key="`lineItems[${index}].projectName`"
                  :feedback="true"
                />
              </template>
            </template>
          </Column>
          <Column :body-style="projectDetailsBodyStyle" class="text-center">
            <template #header>
              Unit
            </template>
            <template #body="{ data, index }">
              <span v-if="index <= projectsAndTasksLength - 1">
                {{
                  clientBillingInvoice ? clientBillingInvoice?.data?.quantity : data.value.billableQuantity || 1
                }}
              </span>
              <template v-else>
                <VField
                  v-slot="{ handleChange, value, validate }"
                  :name="`lineItems[${index}].quantity`"
                >
                  <InputNumber
                    :input-id="`lineItems[${index}].quantity`"
                    :model-value="(value as number)"
                    input-class="w-4rem"
                    class="w-4rem"
                    :min="1"
                    @update:model-value="handleChange"
                    @blur="validate()"
                  />
                </VField>
                <FormFeedbackMessage
                  :errors="formRef?.errors"
                  :values="formRef?.schemaFormValues"
                  :error-key="`lineItems[${index}].quantity`"
                  :feedback="true"
                />
              </template>
            </template>
          </Column>
          <Column :body-style="projectDetailsBodyStyle" class="text-center">
            <template #header>
              Rate
            </template>
            <template #body="{ data, index }">
              <VField
                v-slot="{ handleChange, value, validate }"
                :name="`lineItems[${index}].rate`"
              >
                <template v-if="index <= projectsLength - 1">
                  {{ formRef?.setFieldValue(`lineItems[${index}].rate`, data.value.billingRate || 0) }}
                  <InputNumber
                    v-model="data.value.billingRate"
                    placeholder="$0.00"
                    mode="currency"
                    currency="USD"
                    locale="en-US"
                    input-class="w-4rem"
                    :disabled="index <= projectsLength - 1"
                  />
                </template>
                <InputNumber
                  v-else
                  :input-id="`lineItems[${index}].rate`"
                  :model-value="(value as number)"
                  placeholder="$0.00"
                  mode="currency"
                  currency="USD"
                  locale="en-US"
                  input-class="w-4rem"
                  @update:model-value="handleChange"
                  @blur="validate()"
                />
              </VField>
              <FormFeedbackMessage
                :errors="formRef?.errors"
                :values="formRef?.schemaFormValues"
                :error-key="`lineItems[${index}].rate`"
                :feedback="true"
              />
            </template>
          </Column>
          <Column :body-style="projectDetailsBodyStyle" class="text-center">
            <template #header>
              Amount
              <!-- <i
                v-if="projectDetails"
                v-tooltip="
                  `Amount is calculated as per the billing type of project. For more details check the project.`
                "
                class="pi pi-info-circle text-black ml-1 mt-1"
              /> -->
            </template>
            <template #body="{ data, index }">
              <VField
                v-slot="{ handleChange, value, validate }"
                :name="`lineItems[${index}].amount`"
              >
                <template v-if="index <= projectsLength - 1">
                  <InputNumber
                    :model-value="(value as number) || data.value.billableAmount"
                    :name="`lineItems[${index}].amount`"
                    placeholder="$0.00"
                    mode="currency"
                    currency="USD"
                    locale="en-US"
                    input-class="w-4rem"
                    :disabled="index > projectsLength - 1"
                    @update:model-value="handleAmountChange($event, index)"
                    @blur="validate()"
                  />
                </template>

                <template v-else>
                  {{ formRef?.setFieldValue(`lineItems[${index}].amount`, formRef?.schemaFormValues?.lineItems[index].quantity * formRef?.schemaFormValues?.lineItems[index].rate) }}

                  <InputNumber
                    :input-id="`lineItems[${index}].amount`"
                    :model-value="formRef?.schemaFormValues?.lineItems[index].quantity * formRef?.schemaFormValues?.lineItems[index].rate"
                    placeholder="$0.00"
                    mode="currency"
                    currency="USD"
                    locale="en-US"
                    input-class="w-4rem"
                    disabled
                    @update:model-value="handleChange"
                    @blur="validate()"
                  />
                </template>
              </VField>
              <FormFeedbackMessage
                :errors="formRef?.errors"
                :values="formRef?.schemaFormValues"
                :error-key="`lineItems[${index}].amount`"
                :feedback="true"
              />
            </template>
          </Column>
          <Column :body-style="projectDetailsBodyStyle" header="Actions" class="text-right">
            <template #body="{ index }">
              <div class="flex flex-wrap gap-2 justify-content-end">
                <Button
                  v-if="formRef?.schemaFormValues?.lineItems.length > 1"
                  type="button"
                  icon="pi pi-trash"
                  aria-label="delete-record"
                  class="p-button-sm p-button-rounded p-button-danger"
                  @click="removeRecord(index)"
                />
                <Button
                  v-if="index === formRef?.schemaFormValues?.lineItems.length - 1"
                  icon="pi pi-plus"
                  aria-label="add-record"
                  class="p-button-sm p-button-rounded p-button-primary"
                  @click="addNewRecord"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
    <template #amountDetails>
      <div class="field w-10 xl:w-8 ml-auto">
        <div class="p-datatable p-component p-datatable-responsive-scroll">
          <div class="p-datatable-wrapper overflow-x-auto border-round-top-lg">
            <table
              class="bulk-create-table p-datatable-table w-full"
              role="table"
              cellspacing="0"
              cellpadding="0"
            >
              <tbody class="p-datatable-tbody relative" role="rowgroup">
                <template v-if="loading || isLoadingProjects || isLoadingTasks">
                  <tr>
                    <td colspan="3" class="text-center">
                      <CommonLoading />
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr role="row" class="relative">
                    <td role="cell" class="w-8 p-2 font-medium" valign="middle">
                      Subtotal
                    </td>
                    <td role="cell" class="w-2 p-2" valign="middle">
&nbsp;
                    </td>
                    <td
                      v-if="discountType === '%' || taxType === '%'"
                      role="cell"
                      class="w-2 p-2"
                      valign="middle"
                    >
                      &nbsp;
                    </td>
                    <td role="cell" class="w-2 p-2 text-right" valign="top">
                      <InputNumber
                        v-model="subTotal"
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                        class="w-8rem"
                        placeholder="Subtotal"
                        input-class="w-8rem"
                        :min="0"
                        disabled
                      />
                      <!-- {{ subTotal }} -->
                    </td>
                  </tr>
                  <tr role="row" class="relative">
                    <td role="cell" class="w-8 p-2 font-medium" valign="middle">
                      Discount
                    </td>
                    <td role="cell" class="w-2 p-2 text-right" valign="middle">
                      <Dropdown
                        v-model="discountType"
                        :options="taxDiscountOptions"
                        input-class="w-2rem"
                      />
                    </td>
                    <td
                      v-if="discountType === '%'"
                      role="cell"
                      class="w-2 p-2 text-right"
                      valign="top"
                    >
                      <InputNumber
                        v-model="discountAmount"
                        class="w-8rem"
                        placeholder="Discount"
                        input-class="w-8rem"
                        :min="0"
                      />
                    </td>
                    <td
                      v-else-if="taxType === '%'"
                      role="cell"
                      class="w-2 p-2"
                      valign="middle"
                    >
                      &nbsp;
                    </td>
                    <td role="cell" class="w-2 p-2 text-right" valign="top">
                      <InputNumber
                        v-if="discountType === '%'"
                        class="w-8rem"
                        :model-value="discountCalculated"
                        placeholder="Discount"
                        input-class="w-8rem"
                        :min="0"
                        disabled
                      />
                      <InputNumber
                        v-else
                        v-model="discountAmount"
                        class="w-8rem"
                        placeholder="Discount"
                        input-class="w-8rem"
                        :min="0"
                      />
                    </td>
                  </tr>
                  <tr role="row" class="relative">
                    <td role="cell" class="w-8 p-2 font-medium" valign="middle">
                      Tax
                    </td>
                    <td role="cell" class="w-2 p-2 text-right" valign="middle">
                      <Dropdown
                        v-model="taxType"
                        :options="taxDiscountOptions"
                        input-class="w-2rem"
                      />
                    </td>
                    <td
                      v-if="taxType === '%'"
                      role="cell"
                      class="w-2 p-2 text-right"
                      valign="top"
                    >
                      <InputNumber
                        v-model="taxAmount"
                        class="w-8rem"
                        placeholder="Tax"
                        input-class="w-8rem"
                        :min="0"
                      />
                    </td>
                    <td
                      v-else-if="discountType === '%'"
                      role="cell"
                      class="w-2 p-2"
                      valign="middle"
                    >
                      &nbsp;
                    </td>
                    <td role="cell" class="w-2 p-2 text-right" valign="top">
                      <InputNumber
                        v-if="taxType === '%'"
                        class="w-8rem"
                        :model-value="taxCalculated"
                        placeholder="Tax"
                        input-class="w-8rem"
                        :min="0"
                        disabled
                      />
                      <InputNumber
                        v-else
                        v-model="taxAmount"
                        class="w-8rem"
                        placeholder="Tax"
                        input-class="w-8rem"
                        :min="0"
                      />
                    </td>
                  </tr>
                  <tr role="row" class="relative">
                    <td
                      role="cell"
                      class="p-2"
                      colspan="3"
                      valign="middle"
                    />
                  </tr>

                  <tr role="row" class="relative">
                    <td role="cell" class="w-8 p-2 font-medium" valign="middle">
                      Amount after Tax & Discount
                    </td>
                    <td role="cell" class="w-2 p-2" valign="middle">
&nbsp;
                    </td>
                    <td
                      v-if="discountType === '%' || taxType === '%'"
                      role="cell"
                      class="w-2 p-2"
                      valign="middle"
                    >
                      &nbsp;
                    </td>

                    <td role="cell" class="w-2 p-2 text-right" valign="top">
                      <InputNumber
                        v-model="afterTaxAndDiscount"
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                        class="w-8rem"
                        placeholder="Discounted amount"
                        input-class="w-8rem"
                        :min="0"
                        disabled
                      />
                      <!-- {{ afterTaxAndDiscount }} -->
                    </td>
                  </tr>

                  <tr role="row" class="relative">
                    <td role="cell" class="w-8 p-2 font-medium" valign="middle">
                      Other Charges
                    </td>
                    <td role="cell" class="w-2 p-2" valign="middle">
&nbsp;
                    </td>
                    <td
                      v-if="discountType === '%' || taxType === '%'"
                      role="cell"
                      class="w-2 p-2"
                      valign="middle"
                    >
                      &nbsp;
                    </td>
                    <td role="cell" class="w-2 p-2 text-right" valign="top">
                      <InputNumber
                        v-model="otherCharges"
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                        class="w-8rem"
                        placeholder="$0.00"
                        input-class="w-8rem"
                        :min="0"
                      />
                    </td>
                  </tr>

                  <tr role="row" class="relative">
                    <td role="cell" class="w-8 p-2 font-medium" valign="middle">
                      Final Amount
                    </td>
                    <td role="cell" class="w-2 p-2" valign="middle">
&nbsp;
                    </td>
                    <td
                      v-if="discountType === '%' || taxType === '%'"
                      role="cell"
                      class="w-2 p-2"
                      valign="middle"
                    >
                      &nbsp;
                    </td>
                    <td role="cell" class="w-2 p-2 text-right" valign="top">
                      <InputNumber
                        v-model="finalAmount"
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                        class="w-8rem"
                        placeholder="Final Amount"
                        input-class="w-8rem"
                        :min="0"
                        disabled
                      />
                      <!-- {{ finalAmount }} -->
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
    <template #reminderEnabled="{ ...attrs }">
      <div class="field mb-0">
        <label for="source" class="block font-medium text-900">
          {{ attrs.label }}
          <span v-if="attrs.required" class="text-red-600">*</span>
        </label>
        <VField
          v-slot="{ handleChange, value, validate }"
          name="reminderEnabled"
        >
          <div class="flex gap-4 align-items-center">
            <div
              v-for="(option, index) in reminderOptions"
              :key="index"
              class="mb-3"
            >
              <RadioButton
                id="reminderEnabled"
                :input-id="`${option.name}_${index + 1}`"
                :value="option.value"
                :model-value="value"
                @update:model-value="handleChange"
                @blur="validate()"
              />
              <label
                class="ml-2 cursor-pointer"
                :for="`${option.name}_${index + 1}`"
              >
                {{ option.radioLabel }}
              </label>
            </div>
          </div>
        </VField>
        <FormFeedbackMessage
          :errors="(attrs.errors as ComputedRef).value"
          :values="(attrs.values as ComputedRef).value"
          error-key="reminderEnabled"
          :feedback="true"
        />
      </div>
    </template>
    <div
      class="buttons-wrapper flex w-full justify-content-between mt-3 ml-auto col-12"
    >
      <Button
        label="Back"
        class="max-w-max font-medium p-button-text"
        icon="pi pi-chevron-left"
        @click="emit('back', 'form')"
      />
      <div class="ml-auto">
        <span
          v-tooltip.top="``"
          class="inline-block mr-3"
          style="height: 2.357rem;"
        >
          <Button
            class="max-w-max font-medium"
            type="submit"
            :disabled="!formRef?.meta?.valid || createOrUpdatingInvoice"
            label="Save & Close"
            :loading="createOrUpdatingInvoice"
            @click.stop="handleSubmit('draft')"
          />
        </span>
        <span v-tooltip.top="``" class="inline-block" style="height: 2.357rem;">
          <Button
            class="max-w-max font-medium"
            type="submit"
            :disabled="!formRef?.meta?.valid || createOrUpdatingInvoice"
            label="Save & Send"
            :loading="createOrUpdatingInvoice"
            @click.stop="handleSubmit('send')"
          />
        </span>
      </div>
    </div>
  </CommonSchemaForm>
</template>

<style lang="scss" scoped>
.bulk-create-table {
  > tbody.p-datatable-tbody > tr {
    margin-bottom: 5px;
  }
}
</style>
