<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import type { Feedback, FeedbackCreatePayload } from '@/types/feedback.type';
import { feedbackCreatePayloadSchema } from '@/types/feedback.type';
import Dropdown from 'primevue/dropdown';
import { useCommonListQueries } from '@/composables/common';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

import type { Project, ProjectStatus } from '@/types/project.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import InputText from 'primevue/inputtext';
import type { Client } from '@/types/client.type';
import type { APIActions } from '@/types/common.type';
import MultiSelect from 'primevue/multiselect';

const props = defineProps<{
  project?: string;
  client?: string;
  feedback?: Feedback;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'success', data: Feedback): void;
  (e: 'modalClose'): void;
}>();

const { feedback: feedbackProp } = toRefs(props);

const currentRoute = useRoute();
const { getClients } = useCommonListQueries();
const { metaFilter, isFalsy } = useUtilityFns();
const { pluralize } = useVueFilters();
const { start } = useTimer();
const { createFeedback, updateFeedback } = useFeedback();
const { isPortalUser } = useCurrentUserData();
const queryClient = useQueryClient();
const formKey = ref(0);
const { initToast } = useToasts();
const route = useRoute();
const currentRouteId = ref(route.params.id as string);

const formRef = ref<SchemaFormRef>();
const selectedClientId = ref();
const selectedClient = ref<Client>();
const selectedProjectId = ref();
const selectedProject = ref<Project>();
const closedProjectStatus = ref<ProjectStatus>();

const { queryKeys } = useDataTableUtils();

const {
  applyFilter,
  applyDynamicFilter,
  data: filterData
} = useFilterColumns();
const { getAllStatuses } = useProjectStatus();

const { data: projectStatuses } = useQuery(
  ['project-statuses', ...queryKeys],
  () => {
    return getAllStatuses();
  },
  {
    onSuccess: (data: ProjectStatus[]) => {
      if (data) {
        closedProjectStatus.value = data.find(
          (status: ProjectStatus) => status.status === 3
        );
      }
    }
  }
);

const initialFilters = computed(() => {
  if (closedProjectStatus.value || selectedClientId.value) {
    if (selectedClientId.value) {
      applyFilter('Client', [selectedClientId.value]);
    }
    else {
      applyFilter('Client', []);
    }
    return useEncodeFilterData(filterData);
  }
  return '';
});

const { data: filterDataClient, applyFilter: applyFilterClient }
  = useFilterColumns();
applyFilterClient('Is Active', 'true');
const clientFilters = useEncodeFilterData(filterDataClient);

const {
  data: clientList,
  isLoading: loadingClients,
  isFetching: fetchingClients
} = getClients(true, clientFilters);

const computedTitle = computed(() => {
  const staticTitle = 'Feedback for ';
  if (selectedClient.value || selectedProject.value) {
    if (selectedClient.value && !selectedProject.value) {
      return `${staticTitle}Client (${selectedClient.value?.name})`;
    }
    if (selectedClient.value && selectedProject.value) {
      return `${staticTitle}Client (${selectedClient.value?.name}) - Project (${selectedProject.value?.name})`;
    }
  }
  else {
    return feedbackProp.value ? feedbackProp.value.title : '';
  }
});

async function setFormValues() {
  formRef.value?.setValues({
    ...formRef.value.schemaFormValues,
    clientId:
      selectedClientId.value || props.client
        ? selectedClientId.value || props.client
        : undefined,
    projectIds:
      selectedProjectId.value || props.project
        ? [selectedProjectId.value || props.project]
        : undefined,
    feedbackTitle: computedTitle.value
  });
  formRef.value?.validate({ mode: 'silent' });
}

const {
  data: projectList,
  isLoading: loadingProjects,
  isFetching: fetchingProjects
} = useQuery(
  ['timer-project-list', selectedClientId, initialFilters],
  () =>
    useProjectListV2({
      projectsWithoutFeedback: 'true',
      status: closedProjectStatus.value?.name,
      filters: initialFilters.value ? initialFilters.value : undefined
    })
);

const projectListData = computed(() => {
  if (projectList.value) { return projectList.value?.results; }
  return [];
});

const { data: projectDetails } = useQuery(
  ['project-details', selectedProjectId],
  () => {
    // if (!selectedProjectId.value) return;
    return useProjectDetails(selectedProjectId.value as string);
  },
  {
    enabled: computed(() => !!selectedProjectId.value),
    onSuccess: (data: Project) => {
      if (data) {
        selectedClientId.value = data.client.id;
        setFormValues();
      }
    }
  }
);

function handleAction(actionType: APIActions, data: Feedback) {
  initToast({
    actionType,
    summary: `${actionType} Feedback'`,
    detail: `Feedback ${actionType}d Successfully.`
  });
  emit('success', data as Feedback);
}

const { mutateAsync: handleCreateUpdateFeedback, isLoading: creatingFeedback } = useMutation(
  (payload: Partial<FeedbackCreatePayload>) => {
    return feedbackProp.value ? updateFeedback({ id: feedbackProp.value?.id as string, payload }) : createFeedback(payload as FeedbackCreatePayload);
  },
  {
    onSuccess: (data) => {
      handleAction(feedbackProp.value ? 'Update' : 'Create', data);
    }
  }
);

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'clientId',
        label: `${$tConfig('CLIENT')}`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: `Select ${$tConfig('CLIENT').toLowerCase()}`,
        required: true,
        showClear: true,
        options: clientList.value || [],
        loading: loadingClients.value || fetchingClients.value,
        hide: !!feedbackProp.value,
        disabled: route.name === 'admin-clients-id'
      },
      {
        type: 'multiSelect',
        as: MultiSelect,
        name: 'projectIds',
        label: `Project`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: 'Select project',
        showClear: true,
        options: projectListData.value || [],
        loading: loadingProjects.value || fetchingProjects.value,
        selectionLimit: 1,
        hide: !!feedbackProp.value
      },
      {
        as: InputText,
        name: 'feedbackTitle',
        label: `Title`,
        autocomplete: 'off',
        required: true,
        showSlot: true
      }
    ],
    validationSchema: feedbackCreatePayloadSchema,
    initialValues: {
      clientId:
        selectedClientId.value || props.client
          ? selectedClientId.value || props.client
          : undefined,
      projectIds:
        selectedProjectId.value || props.project
          ? [selectedProjectId.value || props.project]
          : undefined
    },
    btnText: 'Submit',
    secondaryBtnText: 'Cancel'
  } as SchemaForm;
});

watch(
  () => [currentRoute, selectedClientId],
  ([currentRouteVal]) => {
    if (
      (currentRouteVal as RouteLocationNormalizedLoaded).name
      === 'admin-clients-id'
    ) {
      selectedClientId.value = currentRouteId.value as string;
    }
    else if (
      (currentRouteVal as RouteLocationNormalizedLoaded).name
      === 'admin-projects-id'
    ) {
      selectedProjectId.value = currentRouteId.value as string;
    }
  },
  { immediate: true }
);

function handleCancel() {
  emit('modalClose');
}

async function onSubmit(values: any) {
  const payload = { ...values, title: values.feedbackTitle };
  if (!isFalsy(values.projectIds)) {
    payload.projectIds = values.projectIds;
  }
  await handleCreateUpdateFeedback(payload as FeedbackCreatePayload);
  queryClient.invalidateQueries('feedbacks-list');
  emit('modalClose');
}
async function handleDropdownChange(val: any, name: string) {
  if (name === 'clientId') {
    selectedClientId.value = val.clientId;
    selectedProjectId.value = undefined;
    selectedProject.value = undefined;
    setFormValues();
  }
  if (name === 'projectIds') {
    selectedProjectId.value = !isFalsy(val.projectIds) ? val.projectIds[0] : [];
    setFormValues();
  }
}

watchEffect(() => {
  if (feedbackProp.value) {
    const { client: { id: clientId }, projects, title } = feedbackProp.value as Feedback;
    formRef.value?.setValues({
      clientId,
      projectIds: !isFalsy(projects) ? [projects[0].id] : [],
      feedbackTitle: title
    });
  }
  if (selectedClientId.value) {
    selectedClient.value = clientList.value?.find((client: Client) => client.id === selectedClientId.value);
  }
  else {
    selectedClient.value = undefined;
  }
  if (selectedProjectId.value) {
    selectedProject.value = projectList.value?.results.find((project: Project) => project.id === selectedProjectId.value);
  }
  if (computedTitle.value) {
    formRef.value?.setFieldValue('feedbackTitle', computedTitle.value);
  }
  else {
    formRef.value?.setFieldValue('feedbackTitle', '');
  }
});
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :form-key="formKey"
    :primary-btn-loading="creatingFeedback"
    @secondary-btn-click="handleCancel"
    @submit="onSubmit"
    @dropdown-change="handleDropdownChange"
  >
    <template #feedbackTitle="{ ...attrs }">
      <div class="field mb-0">
        <label for="feedbackTitle" class="cursor-pointer block font-medium text-900">
          {{ attrs.label }}
          <span v-if="attrs.required" class="text-red-600">*</span>
        </label>
        <VField
          v-slot="{ handleChange, value, validate }"
          name="feedbackTitle"
        >
          <InputText
            :value="value"
            :model-value="(value as string)"
            input-id="feedbackTitle"
            class="w-full"
            @update:model-value="handleChange"
            @blur="validate()"
          />
        </VField>
        <FormFeedbackMessage
          :errors="(attrs.errors as ComputedRef).value"
          :values="(attrs.values as ComputedRef).value"
          error-key="feedbackTitle"
          :feedback="true"
        />
      </div>
    </template>
  </CommonSchemaForm>
</template>

<style lang="scss" scoped></style>
