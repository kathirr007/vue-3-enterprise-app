<script setup lang="ts">
import type { HandleStepFunc } from '@/types/client.type';
import type { Step } from '@/types/common.type';
import type {
  ExtendUnScheduledProjectPayload,
  Project,
  ProjectStatus,
  ScheduleProjectPayload,
  ScheduleProjectStep,
  UnPlannedProject,
  UnScheduledProjectEntity,
  UnScheduledProjectEntityPayload
} from '@/types/project.type';

import { useMutation } from 'vue-query';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import type { Service } from '@/types/service.type';

interface UpdateTitle {
  step: ScheduleProjectStep;
  typeofSchedule: 'Schedule' | 'Extend' | '';
  serviceToSchedule: UnPlannedProject | undefined;
}

const props = withDefaults(
  defineProps<{
    serviceToSchedule: UnPlannedProject | undefined;
    typeofSchedule: 'Schedule' | 'Extend' | '';
  }>(),
  {
    serviceToSchedule: undefined,
    typeofSchedule: ''
  }
);
const emit = defineEmits<{
  (e: 'back'): void;
  (
    e: 'update-title-desc',
    { serviceToSchedule, step, typeofSchedule }: UpdateTitle
  ): void;
}>();
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const handleStep = inject<HandleStepFunc>('handleStep', () => {});

const { initToast } = useToasts();
const route = useRoute();
const router = useRouter();
const clientId = ref(route.params.id as string);
const { getProperValidationDate } = useUtilityFns();
const { getProjectStatuses } = useCommonListQueries();

const { data: projectStatuses, isLoading } = getProjectStatuses();

const unScheduledProjects = ref<Omit<UnScheduledProjectEntity, 'name'>[]>();
const projectDetails = ref<Partial<ScheduleProjectPayload>>();
const serviceDetails = ref<Service>();
const entities = ref<UnScheduledProjectEntityPayload[]>();
const entityTemplatesModified = ref<Record<string, any>[]>();
const step = ref<ScheduleProjectStep>('select clients');
const clientSelectValues = ref<Record<string, any>>();

const clientsSelected = computed(() => {
  if (clientSelectValues.value) {
    return Array.isArray(clientSelectValues.value.clientsSelected)
      ? [...clientSelectValues.value.clientsSelected]
      : [...Array(clientSelectValues.value.clientsSelected)];
  }
  return [];
});

const clientDueDate = computed(() => {
  if (clientsSelected.value.length) {
    const selecttedClients = clientId.value
      ? [clientId.value]
      : clientsSelected.value.map(client => client.clientId);

    const dueDate = selecttedClients?.reduce((acc, curr) => {
      const projectMeta = props.serviceToSchedule?.projectMeta.find(
        meta => meta.clientId === curr
      );
      if (!acc) {
        return getProperValidationDate(projectMeta?.dueDate as string);
      }
      else if (dayjs(acc).isSameOrAfter(projectMeta?.dueDate)) {
        return getProperValidationDate(projectMeta?.dueDate as string);
      }
      return undefined;
    }, undefined);

    return dayjs(dueDate).toDate();
  }
  return '';
});
const clientsMinDueDate = computed(() => {
  if (clientsSelected.value.length) {
    const selecttedClients = clientId.value
      ? [clientId.value]
      : clientsSelected.value.map(client => client.clientId);

    const dueDate = selecttedClients?.reduce((acc, curr) => {
      const projectMeta = props.serviceToSchedule?.projectMeta.find(
        meta => meta.clientId === curr
      );
      if (!acc) {
        return getProperValidationDate(projectMeta?.dueDate as string);
      }
      else if (dayjs(acc).isSameOrBefore(projectMeta?.dueDate)) {
        return getProperValidationDate(projectMeta?.dueDate as string);
      }
      return undefined;
    }, undefined);

    return dayjs(dueDate).toDate();
  }
  return '';
});
const clientProjectManager = computed(() => {
  if (clientsSelected.value.length) {
    const selecttedClients = clientId.value
      ? [clientId.value]
      : clientsSelected.value.map(client => client.clientId);

    const projectManager = selecttedClients?.reduce((acc, curr) => {
      const projectMeta = props.serviceToSchedule?.projectMeta.find(
        meta => meta.clientId === curr
      );
      if (!acc) {
        return projectMeta?.projectManagerId;
      }
      else if (acc === projectMeta?.projectManagerId) {
        return projectMeta?.projectManagerId;
      }
      else return undefined;
    }, undefined);
    return projectManager;
  }
  return undefined;
});

function handleSuccess(scheduleType: 'Schedule' | 'Extend') {
  initToast({
    actionType: 'Update',
    title: scheduleType,
    summary: `Project ${scheduleType}`,
    detail: `Project ${scheduleType.toLowerCase()}${
      props.typeofSchedule === 'Extend' ? 'e' : ''
    }d successfully`
  });
  backToList();
}

const { scheduleProject, extendProject } = useUnplannedProjects();

const {
  mutateAsync: scheduleUnscheduledProject,
  isLoading: schedulingProject
} = useMutation('schedule-project', async (payload: ScheduleProjectPayload) => {
  return scheduleProject(payload);
});

const { mutateAsync: extendUnscheduledProject, isLoading: extendingProject }
  = useMutation(
    'extend-project',
    async (payload: ExtendUnScheduledProjectPayload) => {
      return extendProject(payload);
    }
  );

function prepareForPrevStep(stepName: ScheduleProjectStep,
  formValues?: Record<string, any>) {
  step.value = stepName;
  if (formValues?.entities) {
    entities.value = formValues.entities;
    entityTemplatesModified.value = formValues.entityTemplatesModified;
  }
}

function prepareForNextStep(formValues: Record<string, any>,
  stepName?: ScheduleProjectStep) {
  if (formValues.reminderDate && props.typeofSchedule === 'Extend') {
    onSubmit(formValues as Partial<ExtendUnScheduledProjectPayload>);
    return;
  }
  step.value = stepName as ScheduleProjectStep;

  if (formValues.clientsSelected) {
    const removeName = (data: UnScheduledProjectEntity[]) => {
      return data.map((item: UnScheduledProjectEntity) => {
        const { name, ...rest } = item;
        return rest;
      });
    };
    clientSelectValues.value = formValues;
    unScheduledProjects.value = Array.isArray(formValues.clientsSelected)
      ? [...removeName(formValues.clientsSelected)]
      : [...removeName(Array(formValues.clientsSelected))];
  }
  if (formValues.formValuesData) {
    projectDetails.value = formValues.formValuesData;
    serviceDetails.value = formValues.serviceDetails;
  }
}

watch(
  () => step.value,
  () => {
    if (step.value) {
      emit('update-title-desc', {
        step: step.value,
        typeofSchedule: props.typeofSchedule,
        serviceToSchedule: props.serviceToSchedule
      });
    }
  },
  { deep: true }
);

onMounted(() => {
  if (route.name === 'admin-clients-id') {
    // step.value = 'update project details';
    const allClients = [
      ...(props.serviceToSchedule
        ?.extendedClients as UnScheduledProjectEntity[]),
      ...(props.serviceToSchedule
        ?.unscheduledClients as UnScheduledProjectEntity[])
    ];
    const clientSelectionFormValues = {
      clientSelection: 'single',
      clientsSelected: allClients.find(
        (client: UnScheduledProjectEntity) => client.clientId === clientId.value
      )
    };
    prepareForNextStep(clientSelectionFormValues, 'update project details');
  }
});

async function onSubmit(val:
  | UnScheduledProjectEntityPayload[]
  | Partial<ExtendUnScheduledProjectPayload>) {
  let payload: ScheduleProjectPayload | ExtendUnScheduledProjectPayload;
  if (props.typeofSchedule === 'Schedule') {
    payload = {
      ...projectDetails.value,
      statusId: projectStatuses.value?.filter(
        (status: ProjectStatus) => status.name === 'Scheduled'
      )[0].id,
      isFederal: !!props.serviceToSchedule?.isFederal,
      entities: [...(val as UnScheduledProjectEntityPayload[])],
      unScheduledProjects: unScheduledProjects.value,
      stateId: props.serviceToSchedule?.stateId
    } as unknown as ScheduleProjectPayload;

    await scheduleUnscheduledProject(payload);
    handleSuccess('Schedule');
  }
  else {
    payload = {
      ...(val as Partial<ExtendUnScheduledProjectPayload>),
      unscheduledProjectIds: unScheduledProjects.value?.map(
        item => item.unScheduledProjectId
      ) as unknown as string[]
    } as ExtendUnScheduledProjectPayload;
    await extendUnscheduledProject(payload as ExtendUnScheduledProjectPayload);
    handleSuccess('Extend');
  }
}

const stepItems = computed(() => {
  const steps: Step[] = [
    {
      name: 'select clients',
      label: 'Select Client(s)'
    },
    {
      name: 'update project details',
      label:
        props.typeofSchedule === 'Schedule'
          ? 'Update Project Details'
          : 'Select Reminder Date & Due Date'
    },
    {
      name: 'pipeline',
      label: 'View Stages'
    },
    {
      name: 'update tasks',
      label: 'Update Tasks'
    }
  ];
  return props.typeofSchedule === 'Extend'
    ? steps.filter((e) => {
      const stepsToExclude = ['pipeline', 'update tasks'];
      return !stepsToExclude.includes(e.name);
    })
    : steps;
});

function backToList() {
  if (clientId.value) {
    handleStep('Automation');
  }
  else {
    router.push({
      name: 'admin-projects',
      query: {
        activeIndex: 1
      }
    });
  }
}
</script>

<template>
  <div :class="{ 'md:w-8 xl:w-6 mx-auto': step !== 'update tasks' }">
    <CommonSteps
      id="abc"
      :key="step"
      readonly
      :items="stepItems"
      class="mb-4"
      :current="step"
      :class="step === 'update tasks' ? 'w-6 mx-auto' : ''"
    />
    <template v-if="step === 'select clients'">
      <ProjectScheduleClientSelection
        :typeof-schedule="typeofSchedule"
        :service-to-schedule="serviceToSchedule as UnPlannedProject"
        :form-values="clientSelectValues"
        class="card border-2 border-round default-border-color border-round-lg"
        @secondary-btn-click="$emit('back')"
        @submit="prepareForNextStep"
      />
    </template>
    <template v-else-if="step === 'update project details'">
      <ProjectScheduleUpdateProject
        :typeof-schedule="typeofSchedule"
        :service-to-schedule="serviceToSchedule as UnPlannedProject"
        :form-values="projectDetails"
        :clients-selected="clientsSelected"
        :due-date="clientDueDate"
        class="card border-2 border-round default-border-color border-round-lg"
        @secondary-btn-click="prepareForPrevStep('select clients')"
        @submit="prepareForNextStep"
      />
    </template>
    <ServiceAddStageForm
      v-else-if="step === 'pipeline'"
      class="card border-2 mx-auto border-round default-border-color border-round-lg"
      :stages="serviceDetails?.OrderedPipelineStages"
      :is-project-create="true"
      :is-project-schedule="true"
      @stage-schedule="prepareForNextStep"
      @back="prepareForPrevStep('update project details')"
    />
    <template v-else>
      <ProjectScheduleUpdateTasks
        :typeof-schedule="typeofSchedule"
        :service-to-schedule="serviceToSchedule"
        :project-details="projectDetails as unknown as Project"
        :clients-selected="clientsSelected"
        :entities="entities"
        :entity-templates-modified="entityTemplatesModified"
        :is-loading="schedulingProject || extendingProject"
        :due-date="clientsMinDueDate as Date"
        :project-manager="clientProjectManager"
        @secondary-btn-click="prepareForPrevStep"
        @submit="onSubmit"
      />
    </template>
    <span
      v-if="step !== stepItems[0].name"
      key="backToList"
      class="inline-block underline font-medium mt-3 text-lg cursor-pointer text-blue-600 hover:text-blue-800"
      @click="backToList"
    >Back to List</span>
  </div>
</template>
