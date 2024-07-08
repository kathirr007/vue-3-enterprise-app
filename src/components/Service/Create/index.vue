<script setup lang="ts">
import type {
  CreateServicePayload,
  OrderedPipelineStages,
  ProjectStage,
  Service
} from '@/types/service.type';
import type {
  TaskTemplate
} from '@/types/task-template.type';
import { useMutation, useQuery } from 'vue-query';
import ServiceCreateTemplate from '@/components/Service/Create/Template.vue';
import ServiceAddDetailsForm from '@/components/Service/AddDetailsForm.vue';
import ServiceAddTaskForm from '@/components/Service/AddTaskForm.vue';
import ServiceAddStageForm from '@/components/Service/AddStageForm.vue';
import type { Step } from '@/types/common.type';
import type { GenerateTasksPayload, GeneratedTask } from '@/types/project.type';

// vue functions
const props = defineProps<{
  template?: boolean;
  revisit?: boolean;
  service?: Service;
}>();
const emit = defineEmits(['back', 'success']);

const { initToast } = useToasts();
// variables
const emptyData = ref<boolean>(false);
const templateRef = ref();
const formRef = ref();
const taskRef = ref();
const createPayload = ref<CreateServicePayload>();
const selectedTemplate = ref<string>();
const selectedStages = ref<OrderedPipelineStages[]>();
const TemplateDetails = ref<{ taskTemplates: TaskTemplate[] }>();
const currentStep = ref<'template' | 'form' | 'task' | 'stage'>(
  props.template ? 'template' : 'form'
);
const apiKey = ref(0);
const generatingTasks = ref(false);
const steps: Record<'template' | 'form' | 'task' | 'stage', unknown> = {
  template: ServiceCreateTemplate,
  form: ServiceAddDetailsForm,
  stage: ServiceAddStageForm,
  task: ServiceAddTaskForm
};

const stepItems = computed(() => {
  const steps: Step[] = [
    {
      name: 'template',
      label: 'Select Template'
    },
    {
      name: 'form',
      label: `${props.revisit ? 'Update/View' : 'Add'} Basic Details`
    },
    {
      name: 'stage',
      label: `${props.revisit ? 'Update/View' : 'Add'} Stages`
    },
    {
      name: 'task',
      label: `${props.revisit ? 'Update/View' : 'Add'} Task Templates`
    }
  ];
  return steps.filter((step: Step) => {
    if (step.name === 'template' && !props.template) {
      return false;
    }
    return true;
  });
});

// query & mutations
const { isLoading: templateIsLoading } = useQuery(
  ['template-details', selectedTemplate],
  () => {
    if (!selectedTemplate.value)
      return;
    return useServiceDetails(selectedTemplate.value);
  },
  {
    onSuccess: (data: Service) => {
      if (data) {
        apiKey.value++;
        TemplateDetails.value = data;
        selectedStages.value = data?.OrderedPipelineStages;
        createPayload.value = {
          name: `Copy of ${data.name}`,
          billingType: data.billingType,
          billingRate: Number(data?.billingRate)
        } as CreateServicePayload;
        currentStep.value = 'form';
      }
    }
  }
);

const { mutateAsync: createService, isLoading: createServiceIsLoading }
  = useMutation((payload: CreateServicePayload) => useServiceCreate(payload), {
    onSuccess: (data) => {
      initToast({
        actionType: 'Create',
        severity: 'success',
        summary: 'Success',
        detail: 'Project Template created successfully'
      });
      emit('success');
      if (Array.isArray(data) && !data.length) {
        emptyData.value = true;
      }
    },
    onError: () => {
      emptyData.value = true;
    }
  });
const { mutateAsync: updateService, isLoading: updateServiceIsLoading }
  = useMutation(
    (payload: Partial<Service>) =>
      useServiceUpdate(`${props?.service?.id}`, payload),
    {
      onSuccess: () => {
        initToast({
          actionType: 'Update',
          severity: 'success',
          summary: 'Success',
          detail: 'Project Template updated successfully'
        });
        if (currentStep.value === 'stage')
          currentStep.value = 'task';
        else currentStep.value = 'stage';
      },
      onError: () => {
        emptyData.value = true;
      }
    }
  );

const isAddDetailsFormLoading = computed(
  () => updateServiceIsLoading.value || generatingTasks.value
);

const stepProps = computed(() => {
  if (currentStep.value === 'template') {
    return {
      template: selectedTemplate.value,
      loading: templateIsLoading.value
    };
  }
  if (currentStep.value === 'stage') {
    return {
      stages: selectedStages.value || props.service?.OrderedPipelineStages,
      loading: createServiceIsLoading.value,
      hideSkip: props.template
    };
  }
  if (currentStep.value === 'form') {
    return {
      service: createPayload.value || props.service,
      create: true,
      apiKey: apiKey.value,
      loading: isAddDetailsFormLoading.value,
      showAssist: !props.revisit && !props.template,
      noDataFound: emptyData.value
    };
  }
  if (currentStep.value === 'task') {
    return {
      taskTemplates: getTaskTemplates(),
      back: true,
      emitPayload: true,
      apiKey: apiKey.value,
      template: props.template,
      loading: createServiceIsLoading.value,
      revisit: props.revisit
    };
  }
});

function handleTemplate(template: string) {
  if (template === selectedTemplate.value)
    currentStep.value = 'form';
  selectedTemplate.value = template;
}
async function prepareForPayload(payload: CreateServicePayload,
  id: string,
  generateTaskPayload: { payload: GenerateTasksPayload }) {
  createPayload.value = payload;
  if (generateTaskPayload?.payload) {
    generatingTasks.value = true;
    const tasks = await useGenerateTasks(generateTaskPayload?.payload).catch(
      () => {
        generatingTasks.value = false;
      }
    );
    if (!(tasks as GeneratedTask[]).length) {
      emptyData.value = true;
      generatingTasks.value = false;
      return;
    }
    generatingTasks.value = false;
    TemplateDetails.value = {
      taskTemplates: tasks as unknown as TaskTemplate[]
    };
    currentStep.value = 'stage';
    return;
  }

  if (!props.revisit) {
    currentStep.value = 'stage';
  }
  else {
    updateService(createPayload.value as Partial<Service>);
  }
}
function handleTaskTemplates(payload: TaskTemplate[]) {
  const templates = payload.map((template) => {
    const refactoredTemplate = {
      ...template,
      attachments: template.attachmentIds
    };
    delete refactoredTemplate.attachmentIds;
    return refactoredTemplate;
  }) as unknown as TaskTemplate[];
  if (createPayload.value)
    createPayload.value.entityTemplates = templates;
  createService(createPayload.value as CreateServicePayload);
}
function getTaskTemplates() {
  return TemplateDetails.value?.taskTemplates?.map((task) => {
    const { id, ...restTask } = task;
    return restTask;
  });
}

function handleBack() {
  if (currentStep.value === 'template')
    emit('back');
  if (currentStep.value === 'form') {
    if (props.template)
      currentStep.value = 'template';
    else emit('back');
  }
  if (currentStep.value === 'stage')
    currentStep.value = 'form';
  if (currentStep.value === 'task')
    currentStep.value = 'stage';
}
function handleSkip(type?: 'form') {
  if (props.revisit && type === 'form') {
    currentStep.value = 'stage';
    return;
  }
  if (props.revisit && currentStep.value === 'stage') {
    currentStep.value = 'task';
    return;
  }
  if (props.revisit) {
    emit('success');
  }
  else createService(createPayload.value as CreateServicePayload);
}

function handleStages(stages: ProjectStage[]) {
  if (props.revisit) {
    updateService({
      pipelineStage: stages.map((stage, index) => {
        return { pipelineStageId: stage.id, order: index + 1 };
      })
    } as Partial<Service>);
    return;
  }
  if (createPayload.value)
    createPayload.value.pipelineStage = stages.map((stage, index) => {
      return { pipelineStageId: stage.id, order: index + 1 };
    });
  currentStep.value = 'task';
}

watch(
  () => props.service,
  () => {
    if (props.service) {
      apiKey.value++;
    }
  }
);
</script>

<template>
  <div :class="currentStep !== 'task' ? 'lg:w-8 xl:w-6 mx-auto' : ''">
    <CommonSteps
      id="abc"
      readonly
      :items="stepItems"
      class="mb-4"
      :current="currentStep"
      :class="currentStep === 'task' ? 'w-8 mx-auto' : ''"
    />
    <!-- <h2 class="text-2xl">
      <span v-if="currentStep === 'template'">Select Template</span>
      <span v-if="currentStep === 'form'"
        >{{ revisit ? 'Update/View' : 'Add' }} Basic Details</span
      >
      <span v-if="currentStep === 'task'"
        >{{ revisit ? 'Update/View' : 'Add' }} Task Templates</span
      >
    </h2> -->
    <div
      class="card border-2 border-round default-border-color border-round-lg"
      :class="currentStep === 'task' ? 'mx-4' : ''"
    >
      <KeepAlive>
        <component
          :is="steps[currentStep]"
          :key="currentStep"
          :ref="`${currentStep}Ref`"
          v-bind="stepProps"
          @back="handleBack"
          @skip="handleSkip"
          @template="handleTemplate"
          @form="prepareForPayload"
          @task="handleTaskTemplates"
          @stage="handleStages"
        />
      </KeepAlive>
    </div>
  </div>
</template>
