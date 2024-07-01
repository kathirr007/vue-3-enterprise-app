<script setup lang="ts">
import type { ScheduleProjectStep } from '@/types/project.type';
import type { CreatePipelineStage, ProjectStage } from '@/types/service.type';
import { useQuery } from 'vue-query';

const props = defineProps<{
  stages?: CreatePipelineStage[];
  loading?: boolean;
  isUpdate?: boolean;
  hideSKip?: boolean;
  isProjectCreate?: boolean;
  isProjectSchedule?: boolean;
}>();

const emits = defineEmits<{
  (e: 'stage', stages: ProjectStage[]): void;
  (
    e: 'stage-schedule',
    formValues: Record<string, any>,
    stepName?: ScheduleProjectStep
  ): void;
  (e: 'back', type: 'stage'): void;
  (e: 'skip'): void;
}>();

const { getAll } = useProjectStages();

const { data: projectStages, isLoading: gettingStages } = useQuery(
  'project-stages',
  getAll
);

const projectStatusesName = ref<(string | undefined)[]>([]);
const reOrderedStageZero = ref<ProjectStage[]>([]);
const reOrderedStageOne = ref<ProjectStage[]>([]);
const reOrderedStageTwo = ref<ProjectStage[]>([]);
const reOrderedStageThree = ref<ProjectStage[]>([]);

const projectStageTemplates = computed<ProjectStage[]>(() => {
  const pipeLineIds = props.stages?.map(stage => stage.pipelineStageId);
  if (pipeLineIds?.length) {
    return pipeLineIds.map((id) => {
      const projectStage = projectStages.value?.results?.find((stage) => {
        return stage.id === id;
      });
      return {
        ...projectStage,
        isDefault: !projectStage?.orgId
      };
    }) as ProjectStage[];
  }
  return projectStages.value?.results
    ?.filter((stage) => {
      return !stage.orgId;
    })
    .map((stage) => {
      return {
        ...stage,
        isDefault: !stage.orgId
      };
    }) as ProjectStage[];
});

const statusZeroStages = computed(() => {
  projectStatusesName.value[0] = projectStageTemplates.value?.find((stage) => {
    return stage.projectStatus?.status === 0;
  })?.statusName;
  return projectStageTemplates.value?.filter((stage) => {
    return stage.projectStatus?.status === 0;
  });
});

const statusOneStages = computed(() => {
  projectStatusesName.value[1] = projectStageTemplates.value?.find((stage) => {
    return stage.projectStatus?.status === 1;
  })?.statusName;
  return projectStageTemplates.value?.filter((stage) => {
    return stage.projectStatus?.status === 1;
  });
});

const statusTwoStages = computed(() => {
  projectStatusesName.value[2] = projectStageTemplates.value?.find((stage) => {
    return stage.projectStatus?.status === 2;
  })?.statusName;
  return projectStageTemplates.value?.filter((stage) => {
    return stage.projectStatus?.status === 2;
  });
});

const statusThreeStages = computed(() => {
  projectStatusesName.value[3] = projectStageTemplates.value?.find((stage) => {
    return stage.projectStatus?.status === 3;
  })?.statusName;
  return projectStageTemplates.value?.filter((stage) => {
    return stage.projectStatus?.status === 3;
  });
});

function handleSubmit() {
  const stages = [
    ...reOrderedStageZero.value,
    ...reOrderedStageOne.value,
    ...reOrderedStageTwo.value,
    ...reOrderedStageThree.value
  ];
  if (props.isProjectSchedule) {
    emits('stage-schedule', stages, 'update tasks');
    return;
  }

  emits('stage', stages);
}
</script>

<template>
  <CommonLoading v-if="gettingStages" />
  <div v-else>
    <ServiceDraggableList
      :stages="statusZeroStages"
      :status="0"
      :name="projectStatusesName[0]"
      :all-stages="
        projectStages?.results.filter(
          (stage) => stage.orgId && stage.projectStatus?.status === 0,
        ) || []
      "
      :disable-drag="isProjectCreate"
      @update="
        (stages: ProjectStage[]) => {
          reOrderedStageZero = stages;
        }
      "
    />
    <Divider v-if="statusZeroStages?.length" />
    <ServiceDraggableList
      :stages="statusOneStages"
      :status="1"
      :name="projectStatusesName[1]"
      :all-stages="
        projectStages?.results.filter(
          (stage) => stage.orgId && stage.projectStatus?.status === 1,
        ) || []
      "
      :disable-drag="isProjectCreate"
      @update="
        (stages: ProjectStage[]) => {
          reOrderedStageOne = stages;
        }
      "
    />
    <Divider v-if="statusOneStages?.length" />
    <ServiceDraggableList
      :stages="statusTwoStages"
      :status="2"
      :name="projectStatusesName[2]"
      :all-stages="
        projectStages?.results.filter(
          (stage) => stage.projectStatus?.status === 2,
        ) || []
      "
      :disable-drag="isProjectCreate"
      @update="
        (stages: ProjectStage[]) => {
          reOrderedStageTwo = stages;
        }
      "
    />
    <Divider v-if="statusTwoStages?.length" />
    <ServiceDraggableList
      :stages="statusThreeStages"
      :status="3"
      :name="projectStatusesName[3]"
      :all-stages="
        projectStages?.results.filter(
          (stage) => stage.orgId && stage.projectStatus?.status === 3,
        ) || []
      "
      :disable-drag="isProjectCreate"
      @update="
        (stages: ProjectStage[]) => {
          reOrderedStageThree = stages;
        }
      "
    />
    <div class="mt-3 flex justify-content-between">
      <Button
        v-if="!isUpdate"
        icon="pi pi-chevron-left"
        class="mr-auto p-button-text"
        label="Back"
        @click="emits('back', 'stage')"
      />
      <div class="flex gap-2 ml-auto">
        <Button
          v-if="!isUpdate && props.stages && props.hideSKip"
          label="Skip"
          @click="emits('skip')"
        />
        <Button
          :label="
            isUpdate ? 'Submit' : isProjectSchedule ? 'Update Tasks' : 'Next'
          "
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
