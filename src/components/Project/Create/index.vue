<script setup lang="ts">
import type { Step } from '@/types/common.type';
import type {
  GeneratedTask,
  Project,
  ProjectCreateStep
} from '@/types/project.type';
import type { CreateServicePayload, Service } from '@/types/service.type';
import { useQuery } from 'vue-query';
import type { TaskTemplate } from '@/types/task-template.type';

const props = defineProps<{
  clientId?: string;
  isTemplate?: boolean;
  isRevisit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'modalClose'): void;
  (e: 'back', step: 'template'): void;
}>();

const { isFalsy } = useUtilityFns();

const isBrightAssist = ref(true);
const projectDetails = ref<Project>();
const generatedTasks = ref<GeneratedTask[]>();
const selectedTemplate = ref<string>();
const apiKey = ref(0);
const templateDetails = ref<{ taskTemplates: TaskTemplate[] } | Service>();
const createPayload = ref<CreateServicePayload>();

const { isLoading: templateIsLoading } = useQuery(
  ['template-details', selectedTemplate],
  () => {
    if (!selectedTemplate.value)
      return;
    return useServiceDetails(selectedTemplate.value);
  },
  {
    onSuccess: (data: Service) => {
      const billingRate = !isFalsy(data?.billingRate)
        ? Number(data?.billingRate)
        : undefined;
      if (data) {
        apiKey.value++;
        templateDetails.value = {
          ...data,
          billingRate
        } as unknown as Service;
        createPayload.value = {
          name: data.name,
          billingType: data.billingType,
          billingRate
        } as CreateServicePayload;
        currentStep.value = 'form';
      }
    }
  }
);

const currentStep = ref<ProjectCreateStep>(
  props.isTemplate ? 'template' : 'form'
);

function handleSwitchChange(value: boolean) {
  isBrightAssist.value = value;
}
function handleTemplate(template: string) {
  if (template === selectedTemplate.value)
    currentStep.value = 'form';
  selectedTemplate.value = template;
}

const stepItems = computed(() => {
  const steps: Step[] = [
    {
      name: 'form',
      label: 'Create Project'
    },
    {
      name: 'tasks',
      label: 'Add Tasks'
    }
  ];
  if (props.isTemplate) {
    const pipelineStep = {
      name: 'pipeline',
      label: 'View Stages'
    };
    steps.unshift({
      name: 'template',
      label: 'Select Template'
    });
    steps.splice(steps.length - 1, 0, pipelineStep);
  }
  return steps;
});

/* const handlePipeline = (data: { data: Project; tasks: GeneratedTask[] }) => {
  projectDetails.value = data.data;
  generatedTasks.value = data.tasks;
  currentStep.value = 'pipeline';
}; */

function handleTasks(data: {
  data: Project;
  tasks: GeneratedTask[];
  isFromTemplate?: boolean;
}) {
  projectDetails.value = data.data;
  generatedTasks.value = data.tasks;
  currentStep.value = data.isFromTemplate ? 'pipeline' : 'tasks';
}

function handleStages() {
  currentStep.value = 'tasks';
}

function handleBack() {
  if (currentStep.value === 'template')
    emit('modalClose');
  if (currentStep.value === 'form') {
    if (props.isTemplate)
      currentStep.value = 'template';
    else emit('modalClose');
  }
  if (currentStep.value === 'pipeline')
    currentStep.value = 'form';
  if (currentStep.value === 'tasks')
    currentStep.value = 'pipeline';
}
</script>

<template>
  <div :class="currentStep === 'template' ? 'lg:w-8 xl:w-6 mx-auto' : ''">
    <CommonSteps
      v-if="isBrightAssist || isTemplate"
      id="abc"
      readonly
      :items="stepItems"
      class="mb-4"
      :current="currentStep"
    />
    <div v-if="currentStep === 'template'">
      <ProjectCreateTemplateProject
        :loading="templateIsLoading"
        @template="handleTemplate"
        @modal-close="emit('modalClose')"
      />
    </div>
    <div
      v-if="currentStep === 'form'"
      class="card border-2 w-8 mx-auto border-round default-border-color border-round-lg"
    >
      <ProjectAddProject
        :client-id="clientId"
        :template-details="(templateDetails as unknown as Service)"
        @bright-assist="handleSwitchChange"
        @tasks="handleTasks"
        @back="handleBack"
        @pipeline="handleTasks"
        @modal-close="emit('modalClose')"
      />
    </div>
    <ServiceAddStageForm
      v-if="currentStep === 'pipeline'"
      class="card border-2 w-8 mx-auto border-round default-border-color border-round-lg"
      :stages="(templateDetails as Service)?.OrderedPipelineStages"
      :is-project-create="true"
      @stage="handleStages"
      @back="handleBack"
    />
    <ProjectCreateTasks
      v-if="currentStep === 'tasks'"
      :project="(projectDetails as Project)"
      :tasks="(generatedTasks as GeneratedTask[])"
      @back="emit('modalClose')"
    />
  </div>
</template>

<style lang="scss" scoped></style>
