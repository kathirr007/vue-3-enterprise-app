<script setup lang="ts">
import type { ProjectStage } from '@/types/service.type';
import draggable from 'vuedraggable';

const props = withDefaults(
  defineProps<{
    stages: ProjectStage[];
    name?: string;
    allStages: ProjectStage[];
    status: number;
    disableDrag?: boolean;
  }>(),
  {
    stages: () => []
  }
);

const emits = defineEmits<{
  (e: 'update', stages: ProjectStage[]): void;
}>();

const reorderedStages = ref<(ProjectStage | { isAdding: boolean })[]>(
  props.stages
);

watchEffect(() => {
  if (reorderedStages.value)
    emits('update', reorderedStages.value as ProjectStage[]);
});

watch(
  () => props.stages,
  (stages) => {
    reorderedStages.value = stages;
  },
  { deep: true }
);

onMounted(() => {
  emits('update', reorderedStages.value as ProjectStage[]);
});

const dragOptions = computed(() => {
  return {
    animation: 200,
    group: 'projectStages',
    disabled: false,
    ghostClass: 'ghost'
  };
});

const remainingStageOptions = computed(() => {
  return props.allStages.filter((stage) => {
    return !reorderedStages.value.find(
      s => (s as ProjectStage).name === stage.name
    );
  });
});
</script>

<template>
  <h5 class="mt-0">
    {{ name }}
  </h5>
  <draggable
    v-if="reorderedStages.length > 0"
    :key="name"
    :sort="true"
    :item-key="name || ''"
    :list="reorderedStages"
    class="list-group min-h-full flex flex-column gap-2"
    :class="name"
    v-bind="dragOptions"
    :group="{ name, pull: false, put: false }"
    :disabled="disableDrag"
  >
    <template #item="{ element: item, index }">
      <div
        class="p-3 border-2 border-round-md flex justify-content-between align-items-center"
        :class="{ 'cursor-move': !disableDrag }"
      >
        <div class="flex align-items-center gap-2">
          <i v-if="!disableDrag" class="pi pi-bars text-primary" />
          <Dropdown
            v-if="item.isAdding"
            :options="remainingStageOptions"
            class="w-16rem"
            placeholder="Select a stage"
            option-label="name"
            @change="
              ($event: any) => {
                reorderedStages[index] = $event.value;
              }
            "
          >
            <template #header>
              <RouterLink
                :to="{ name: 'admin-services', query: { activeIndex: 1 } }"
                class="flex align-items-center py-2 px-3 font-medium text-sm text-gray-500 hover:text-gray-700"
              >
                Add New Project Stage
                <Icon icon="mdi:external-link" class="ml-1 h-1.5rem w-1.5rem" />
              </RouterLink>
            </template>
          </Dropdown>
          <span v-else class="font-medium">{{ item.name }}</span>
        </div>
        <div v-if="!disableDrag" class="flex gap-2">
          <i
            v-if="index === stages.length - 1 && (status === 1 || status === 2)"
            class="pi pi-plus text-primary cursor-pointer"
            @click="reorderedStages.push({ isAdding: true })"
          />
          <i
            v-if="stages.length > 1 && (!item.isDefault || status === 2)"
            class="pi pi-trash text-red-500 cursor-pointer"
            @click="reorderedStages.splice(index, 1)"
          />
        </div>
      </div>
    </template>
  </draggable>
</template>

<style lang="scss" scoped></style>
