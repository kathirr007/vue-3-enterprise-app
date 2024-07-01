<script setup lang="ts">
import type { ProjectStage } from '@/types/service.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const { getAll, remove } = useProjectStages();
const { isLarge, defaultBreakpoints } = useCommonBreakPoints();
const queryClient = useQueryClient();

const selectedStage = ref<ProjectStage>();
const isStageUpdate = ref(false);
const isStageDelete = ref(false);

const { data: projectStages, isLoading: gettingStages } = useQuery(
  'project-stages',
  getAll
);

const { mutateAsync: removeStage } = useMutation((id: string) => remove(id), {
  onSuccess: () => {
    queryClient.invalidateQueries('project-stages');
  },
});

const handleEdit = (data: ProjectStage) => {
  selectedStage.value = data;
  isStageUpdate.value = true;
};

const handleDelete = (data: ProjectStage) => {
  selectedStage.value = data;
  isStageDelete.value = true;
};
</script>

<template>
  <DataTable
    :value="projectStages?.results"
    :loading="gettingStages"
    responsiveLayout="scroll"
    breakpoint="768px"
    :paginator="true"
    :rows="15"
    :alwaysShowPaginator="false"
    :page-link-size="isLarge ? 5 : 3"
  >
    <template #empty>
      <div class="text-center">No project stages found.</div>
    </template>
    <Column class="w-6" field="name" header="Name"></Column>
    <Column field="statusName" header="Status"> </Column>
    <Column class="w-2" header="Actions">
      <template #body="{ data }">
        <div v-if="data.orgId" class="flex gap-2">
          <Button
            icon="pi pi-pencil"
            class="p-button-rounded p-button-info p-button-sm"
            @click="handleEdit(data)"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-rounded p-button-danger p-button-sm"
            @click="handleDelete(data)"
          />
        </div>
        <span v-else class="text-orange-500">Predefined</span>
      </template>
    </Column>
  </DataTable>

  <Dialog
    :modal="true"
    appendTo="body"
    v-model:visible="isStageUpdate"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '40vw' }"
    :contentClass="'border-round-bottom-md'"
    header="Create Project Stage"
    @hide="isStageUpdate = false"
  >
    <ServiceStageCreateUpdate
      @success="isStageUpdate = false"
      :project-stage="selectedStage"
    />
  </Dialog>

  <CommonConfirmRemoveDialog
    v-if="isStageDelete"
    :visible="isStageDelete"
    title="Confirm Delete Project Stage"
    @confirm="removeStage(selectedStage?.id as string)"
    @hide="isStageDelete = false"
    >Are you sure you want to delete {{ selectedStage?.name }}?
  </CommonConfirmRemoveDialog>
</template>
