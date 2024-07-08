<script setup lang="ts">
import { useMutation } from 'vue-query';
import type { AxiosError } from 'axios';
import type { Project } from '@/types/project.type';

const props = withDefaults(
  defineProps<{
    projects: Project[];
    isLoading?: boolean;
  }>(),
  {
    projects: () => []
  }
);

const emit = defineEmits<{
  (e: 'bulk-update'): void;
  (e: 'cancel'): void;
}>();

const failedRecords = ref<{ id: string; error: string }[] | any[]>([]);
const successRecords = ref<{ id: string; error: string }[] | any[]>([]);
const refetchKey = ref(0);
const { initToast } = useToasts();

const { mutateAsync: handleProjectRestore, isLoading: restoringProject }
  = useMutation(
    ['restore-project'],
    (id: string) => {
      return useProjectRestore(id) as unknown as Promise<Project>;
    },
    {
      onSuccess: (data: Project, variables) => {
        successRecords.value?.push({ id: variables, error: '' });
      },
      onError: (err: AxiosError<any, any>, variables) => {
        failedRecords.value?.push({
          id: variables,
          error: err.response?.data.message
            ? err.response?.data.message
            : err.message
        });
      }
    }
  );

async function makeParallelAPIReq(payloadArr: Project[]) {
  if (payloadArr.length === 0) {
    return;
  }
  await Promise.allSettled(
    payloadArr.map(async (project: Project) => {
      await handleProjectRestore(project.id);
    })
  );
}

async function restoreBulkProjects() {
  await makeParallelAPIReq(props.projects);
  refetchKey.value++;

  if (successRecords.value.length > 0) {
    initToast({
      actionType: 'Restore',
      summary: 'Bulk Restore Projects',
      detail: `Total of <strong>${successRecords.value.length}</strong> ${
        successRecords.value.length > 1 ? 'Projects are' : 'Project'
      } successfully restored.`
    });
    successRecords.value = [];
  }
  if (failedRecords.value.length > 0) {
    initToast({
      actionType: 'Error',
      summary: 'Create Team Member',
      detail: `Total of <strong>${failedRecords.value.length}</strong> ${
        failedRecords.value.length > 1 ? 'Projects are' : 'Project'
      } failed to restore.`
    });
    failedRecords.value = [];
  }
  emit('bulk-update');
}
</script>

<template>
  <Button
    icon="pi pi-undo"
    class="p-button-sm p-button-rounded"
    :disabled="restoringProject"
    @click.prevent="restoreBulkProjects"
  >
    <i v-if="restoringProject" class="pi pi-spin pi-spinner" />
  </Button>
</template>
