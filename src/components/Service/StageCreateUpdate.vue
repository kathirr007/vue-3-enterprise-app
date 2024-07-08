<script setup lang="ts">
import type { SchemaForm } from '@/types/schemaform.type';
import {
  type ProjectStage,
  type ProjectStageCreateUpdatePayload,
  ProjectStageCreateUpdateSchema
} from '@/types/service.type';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const props = defineProps<{
  projectStage?: ProjectStage;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { create, update } = useProjectStages();
const { getAllStatuses } = useProjectStatus();
const { initToast } = useToasts();
const queryClient = useQueryClient();

const { data: statuses } = useQuery('statuses', getAllStatuses);

const filteredStatuses = computed(() => {
  return statuses.value?.filter(
    status => status.status === 1 || status.status === 2
  );
});

const { mutateAsync: createUpdateStage, isLoading: createIsLoading }
  = useMutation(
    (payload: ProjectStageCreateUpdatePayload) => {
      if (props.projectStage) {
        return update(
          props.projectStage?.id,
          payload as Partial<ProjectStageCreateUpdatePayload>
        );
      }
      return create(payload);
    },
    {
      onSuccess: (data) => {
        if (data) {
          initToast({
            actionType: props.projectStage ? 'Update' : 'Create',
            summary: props.projectStage ? 'Update' : 'Create',
            detail: props.projectStage
              ? 'Project Stage updated successfully'
              : 'Project Stage created successfully'
          });
        }
        queryClient.invalidateQueries('project-stages');
        emit('success');
      }
    }
  );
async function onSubmit(values: Record<string, any>) {
  await createUpdateStage({
    name: values.name,
    projectStatusId: values.projectStatusId
  } as unknown as ProjectStageCreateUpdatePayload);
}

const formData = computed<SchemaForm>(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'name',
        label: 'Name',
        required: true,
        autocomplete: 'off'
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'projectStatusId',
        label: 'Project Status',
        required: true,
        autocomplete: 'off',
        options: filteredStatuses.value,
        optionLabel: 'statusName',
        optionValue: 'id'
      }
    ],
    validationSchema: ProjectStageCreateUpdateSchema,
    initialValues: props.projectStage
      ? {
          ...props.projectStage,
          projectStatusId: props.projectStage.projectStatus.id
        }
      : undefined,
    btnText: 'Submit'
  };
});
</script>

<template>
  <CommonSchemaForm
    :data="formData"
    :primary-btn-loading="createIsLoading"
    @submit="onSubmit"
  />
</template>
