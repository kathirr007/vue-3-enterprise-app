<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import Dropdown from 'primevue/dropdown';
import { useCommonListQueries } from '@/composables/common';
import { useQuery, useQueryClient } from 'vue-query';
import type { Project } from '@/types/project.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { SelectClientForInvoiceSchema } from '@/types/client-billing.type';
import type { ClientBillingProfile } from '@/types/client-billing.type';
import type { Client } from '@/types/client.type';
import type { MetaObj, PaginatedResponse } from '@/types/common.type';
import MultiSelect, { type MultiSelectChangeEvent } from 'primevue/multiselect';
import type { Task } from '@/types/tasks.type';

const props = defineProps<{
  projects?: Project[];
  project?: Project;
  client?: Client;
  billingProfile?: ClientBillingProfile;
  isClientPage?: boolean;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (
    e: 'select-client',
    data: {
      client: Client;
      projects: Project[];
      billingProfile: ClientBillingProfile;
    }
  ): void;
}>();

const { isClientPage: isClientPageProp, project: projectProp, projects: projectsProp } = toRefs(props);
const currentRoute = useRoute();
const { getClients } = useCommonListQueries();
const { metaFilter, isFalsy } = useUtilityFns();
const { pluralize } = useVueFilters();
const { start } = useTimer();
const queryClient = useQueryClient();
const formKey = ref(0);
const { initToast } = useToasts();
const route = useRoute();
const currentRouteId = ref(route.params.id as string);
const { data: filterData, applyFilter } = useFilterColumns();
const { getAll: getAllBillingProfiles } = useClientBilling();
const { getTasksForBillingProfile } = useClientBillingInvoices();

const formRef = ref<SchemaFormRef>();
const selectedClientId = ref();
const selectedProjectIds = ref<string[]>([]);
const selectedTaskIds = ref<string[]>([]);
const selectedProfileId = ref(props.billingProfile?.id as string);
const showNoClientAttached = ref(false);
const projectRaisedAmount = ref(0);
const isProjectClientInBillingProfile = ref(false);
const clientsListOptions = ref<Client[]>([]);
const projectListOptions = ref<Project[]>([]);
// const profileTasksListOptions = ref<Task[]>([]);

const initialFilters = computed(() => {
  if (selectedClientId.value) {
    applyFilter('Client', [selectedClientId.value]);
    return useEncodeFilterData(filterData);
  }
});

const { data: filterDataClient, applyFilter: applyFilterClient }
  = useFilterColumns();
applyFilterClient('Is Active', 'true');
const clientFilters = useEncodeFilterData(filterDataClient);

// const {
//   data: clientList,
//   isLoading: loadingClients,
//   isFetching: fetchingClients,
// } = getClients(true, clientFilters);

const {
  data: clientsList,
  isLoading: loadingClients,
  isFetching: fetchingClients
} = useQuery(['clients-list'], () => useClientListV2({}), {
  onSuccess: (data: PaginatedResponse<Client>) => {
    clientsListOptions.value = data.results;
  }
});

const {
  data: projectList,
  isLoading: loadingProjects,
  isFetching: fetchingProjects
} = useQuery(
  ['projects-list', selectedClientId],
  () => useProjectListV2({ filters: initialFilters.value }),
  {
    onSuccess: (data: PaginatedResponse<Project>) => {
      if (data) {
        projectListOptions.value = data.results.filter(
          (item: Project) => item.billingType !== 'NONE'
        );
      }
    }
  }
);

const {
  data: profileTasksList,
  isLoading: loadingTasksList,
  isFetching: fetchingTasksList
} = useQuery(
  ['profile-tasks-list', selectedProfileId],
  () => getTasksForBillingProfile(selectedProfileId.value as string)
);

const profileTasksListOptions = computed(() => {
  if (profileTasksList.value)
    return profileTasksList.value.map((task: Task) => ({
      ...task,
      name: metaFilter(task.meta as MetaObj[], 'title'),
      title: metaFilter(task.meta as MetaObj[], 'title')
    }));
  return [];
});

function getClientOrProjectOrProfile(arr: any[],
  id: string | string[],
  type: 'client' | 'projects' | 'billingProfile') {
  return id
    ? type === 'projects' ? arr.filter(item => id.includes(item.id)) : arr.filter(item => item.id === id)[0]
    : props[type] || undefined;
}

async function setFormValues() {
  formRef.value?.setValues({
    ...formRef.value.schemaFormValues,
    client: getClientOrProjectOrProfile(
      clientsListOptions.value || [],
      projectsProp?.value?.[0]?.client?.id || selectedClientId.value,
      'client'
    ),
    projects: getClientOrProjectOrProfile(
      projectList.value?.results || [],
      projectsProp?.value ? projectsProp?.value?.map((project: Project) => project.id) : selectedProjectIds.value,
      'projects'
    ),
    billingProfile: getClientOrProjectOrProfile(
      billingProfiles.value?.results || [],
      projectsProp?.value?.[0]?.client?.clientBillingProfile[0].billingProfileId
      || selectedProfileId.value,
      'billingProfile'
    )
  });
}

const {
  data: billingProfiles,
  isLoading: loadingBillingProfiles,
  isFetching: fetchingBillingProfiles
} = useQuery(['billing-profiles'], () => getAllBillingProfiles({}));

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'billingProfile',
        label: `Billing Profile`,
        optionLabel: 'name',
        autocomplete: 'off',
        required: true,
        placeholder: 'Select Billing Profile',
        formGridClass: 'md:col-12 ',
        options: billingProfiles.value?.results || [],
        loading: loadingBillingProfiles.value || fetchingBillingProfiles.value,
        disabled:
          !!isClientPageProp?.value
          || route.name === 'admin-client-billing-id'
          || route.name === 'admin-projects-id'
          || route.name === 'admin-billing'
      },
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'client',
        label: `${$tConfig('CLIENT')}`,
        optionLabel: 'name',
        autocomplete: 'off',
        placeholder: `Select ${$tConfig('CLIENT').toLowerCase()}`,
        showClear: true,
        required: true,
        options: clientsListOptions.value || [],
        loading: loadingClients.value || fetchingClients.value,
        disabled:
          !!isClientPageProp?.value || route.name === 'admin-projects-id'
      },
      {
        type: 'multi-select',
        as: MultiSelect,
        name: 'projects',
        label: `Projects `,
        optionLabel: 'name',
        autocomplete: 'off',
        placeholder: 'Select project',
        showClear: true,
        options: projectListOptions.value,
        loading: loadingProjects.value || fetchingProjects.value,
        showSlot: true,
        disabled: route.name === 'admin-projects-id' || !formRef.value?.schemaFormValues.client,
        helpText: `(Optional: Selecting "project" auto-calculates total time and amount.) `
      },
      {
        type: 'multi-select',
        as: MultiSelect,
        name: 'tasks',
        label: `Tasks `,
        optionLabel: 'name',
        autocomplete: 'off',
        placeholder: 'Select task',
        showClear: true,
        options: profileTasksListOptions.value || [],
        loading: loadingTasksList.value || fetchingTasksList.value,
        disabled: !formRef.value?.schemaFormValues.client,
        showSlot: true,
        helpText: `(Optional: Selecting "task" auto-calculates total time and amount.) `
      }
    ],
    validationSchema: SelectClientForInvoiceSchema,
    initialValues: {
      client: getClientOrProjectOrProfile(
        clientsListOptions.value || [],
        selectedClientId.value,
        'client'
      ),
      projects: getClientOrProjectOrProfile(
        projectList.value?.results || [],
        selectedProjectIds.value,
        'projects'
      ),
      billingProfile: props.billingProfile ? props.billingProfile : undefined
    },
    btnText: 'Continue',
    secondaryBtnText: 'Cancel'
  } as SchemaForm;
});
function handleCancel() {
  emit('back');
}

async function onSubmit(values: any) {
  emit('select-client', { ...values });
}
async function handleDropdownChange(val: any, name: string) {
  switch (name) {
    case 'client':
      selectedClientId.value = val.client?.id;
      showNoClientAttached.value = false;
      selectedProjectIds.value = [];
      break;
    case 'projects':
      selectedClientId.value = val.projects?.[0]?.client?.id;
      selectedProjectIds.value = val.projects?.map((project: Project) => project.id);
      break;
    case 'billingProfile':
      selectedClientId.value = undefined;
      selectedProfileId.value = val.billingProfile?.id;
      break;
    default:
      break;
  }
}

function handleProjectChange(val: MultiSelectChangeEvent) {
  isProjectClientInBillingProfile.value
    = val.value?.[0]?.client
    && clientsListOptions.value
      .map((client: Client) => client.id)
      .includes(val.value?.[0]?.client.id);
  if (
    (val.value[0] && !val.value?.[0]?.client)
    || (val.value?.[0]?.client && !isProjectClientInBillingProfile.value)
  ) {
    showNoClientAttached.value = true;
  }
  else {
    showNoClientAttached.value = false;
  }
  handleDropdownChange(formRef.value?.schemaFormValues, 'projects');
}

function totalRaisedAmount(killBillData: any[]) {
  return killBillData.reduce((acc: any, curr: any) => {
    return (
      acc + (curr.data.amount || 0) + (curr.data.taxAmount || 0) - (curr.data.discountAmount || 0)
    );
  }, 0);
}

watch(
  () => [currentRoute, selectedClientId],
  ([currentRouteVal]) => {
    const currentRouteName = (currentRouteVal as RouteLocationNormalizedLoaded)
      .name;
    switch (currentRouteName) {
      case 'admin-clients-id':
        selectedClientId.value = currentRouteId.value as string;
        selectedProfileId.value = props.client
          ? props.client.clientBillingProfile[0]?.billingProfileId as string
          : '';
        break;
      case 'admin-projects-id':
        selectedProjectIds.value = [currentRouteId.value as string];
        break;
      case 'admin-client-billing-id':
        selectedProfileId.value = currentRouteId.value as string;
        break;
      case 'admin-billing':
        selectedProfileId.value = route.query.billingId as string;
        break;

      default:
        break;
    }
  },
  { immediate: true }
);

watchEffect(() => {
  if (
    clientsListOptions.value
    || projectList.value
    || selectedProjectIds.value
    || selectedClientId.value
    || selectedProfileId.value
  ) {
    setFormValues();
  }
  if (!isFalsy(selectedProfileId.value)) {
    const billingProfileClientsIds = formRef.value?.schemaFormValues.billingProfile?.clientBillingProfiles.map((client: any) => client.clientId);
    clientsListOptions.value = clientsListOptions.value?.filter(
      (client: Client) => billingProfileClientsIds?.includes(client.id)
    );
  }
  else {
    clientsListOptions.value = clientsList.value?.results as Client[];
  }
  if (projectsProp?.value) {
    setFormValues();
    // emit('select-client', formRef.value?.schemaFormValues);
  }
});

onMounted(() => {
  if (formRef.value) {
    setFormValues();
  }
});
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :form-key="formKey"
    @secondary-btn-click="handleCancel"
    @submit="onSubmit"
    @dropdown-change="handleDropdownChange"
  >
    <template #projects="{ ...attrs }">
      <div class="field mb-0">
        <label class="block font-medium text-900" for="projects">
          {{ attrs.label }}
          <span v-if="attrs.required" class="text-red-600">*</span>
        </label>
        <div v-if="attrs.helpText" class="text-sm mb-2 -mt-2" v-html="attrs.helpText" />
        <VField v-slot="{ handleChange, value, validate }" name="projects">
          <MultiSelect
            :tabindex="0"
            class="w-full p-fluid"
            :model-value="value"
            v-bind="attrs"
            option-label="name"
            :options="projectListOptions"
            :loading="loadingProjects || fetchingProjects"
            @update:model-value="handleChange"
            @change="handleProjectChange"
            @blur="validate()"
          >
            <template #option="slotProps">
              <div class="flex justify-content-between gap-2">
                <div>{{ slotProps.option.name }}</div>
                <strong>{{
                  `Raised - $${
                    totalRaisedAmount(slotProps.option.killBillInvoices)}`
                }}</strong>
              </div>
            </template>
          </MultiSelect>
        </VField>
        <transition mode="out-in" name="field-slide-down">
          <div v-if="showNoClientAttached" class="p-error">
            {{
              `${
                !isProjectClientInBillingProfile
                  ? `The ${$tConfig('CLIENT').toLowerCase()}
              associated to the project is not part of ${pluralize($tConfig('CLIENT').toLowerCase())} in selected
              billing profile`
                  : `Selected project is not associated with any ${$tConfig('CLIENT').toLowerCase()}`
              }, please assign ${$tConfig('CLIENT').toLowerCase()} first and then come back to
              generate invoice.`
            }}
          </div>
          <FormFeedbackMessage
            v-else
            :errors="(attrs.errors as ComputedRef).value"
            :values="(attrs.values as ComputedRef).value"
            error-key="projects"
            :feedback="true"
          />
        </transition>
      </div>
    </template>
    <template #tasks="{ ...attrs }">
      <div class="field mb-0">
        <label class="block font-medium text-900" for="tasks">
          {{ attrs.label }}
          <span v-if="attrs.required" class="text-red-600">*</span>
        </label>
        <div v-if="attrs.helpText" class="text-sm mb-2 -mt-2" v-html="attrs.helpText" />
        <VField v-slot="{ handleChange, value, validate }" name="tasks">
          <MultiSelect
            :tabindex="0"
            class="w-full p-fluid"
            :model-value="value"
            v-bind="attrs"
            option-label="name"
            name="tasks"
            :options="profileTasksListOptions"
            :loading="loadingTasksList || fetchingTasksList"
            @update:model-value="handleChange"
            @blur="validate()"
          >
            <template #option="slotProps">
              <div class="flex justify-content-between">
                <div>{{ slotProps.option.name }}</div>
              </div>
            </template>
          </MultiSelect>
        </VField>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="(attrs.errors as ComputedRef).value"
            :values="(attrs.values as ComputedRef).value"
            error-key="tasks"
            :feedback="true"
          />
        </transition>
      </div>
    </template>
  </CommonSchemaForm>
</template>

<style lang="scss" scoped>
:deep(.p-multiselect) {
  .p-multiselect-item {
    white-space: normal;
  }
}
</style>
