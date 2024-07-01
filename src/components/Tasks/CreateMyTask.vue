<script setup lang="ts">
import type { EntityType, UpdateTaskPayload } from '@/types/tasks.type';
import InputText from 'primevue/inputtext';
import { useMutation, useQueryClient } from 'vue-query';
import { taskCreateUpdateSchemaPayload } from '@/types/tasks.type';
import CommonSchemaForm from '@/components/Common/SchemaForm.vue';
import type { SchemaFormRef } from '@/types/schemaform.type';

const props = defineProps<{
  taskId?: string;
  entityType?: EntityType;
  projectId?: string;
  hideButtons?: boolean;
  project?: boolean;
  clientId?: string;
  notesTask?: any;
  isNotesTask?: boolean;
}>();
const emit = defineEmits(['close', 'taskDetails']);
const formKey = ref(0);
const clientId = ref(props.clientId) || ref('');
const taskCreateUpdateRef = ref<SchemaFormRef | null>(null);

defineExpose({ taskCreateUpdateRef });
const route = useRoute();
const projectIdParam
  = route.name === 'admin-projects-id' ? ref(route.params.id as string) : ref('');
const queryClient = useQueryClient();
const { initToast } = useToasts();

const { mutateAsync: createTask, isLoading: createIsLoading } = useMutation(
  'createTask',
  async (payload: { data: UpdateTaskPayload }) => {
    return useTaskCreate(
      payload,
      payload.data.type || (props.entityType as EntityType)
    );
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        severity: 'success',
        summary: 'Success',
        detail: 'Task Created Successfully'
      });
      queryClient.invalidateQueries('tasks-list');
      emit('close');
    }
  }
);

function setInitialValues() {
  return {
    clientId: props.clientId,
    projectId: props.projectId,
    type: 'TASK'
  };
}

const formData = {
  fields: [
    {
      as: InputText,
      name: 'name',
      label: 'Add Task',
      required: true,
      placeholder: 'Enter Title'
    }
  ],
  validationSchema: taskCreateUpdateSchemaPayload,
  secondaryBtnText: 'Cancel',
  btnText: 'Submit',
  initialValues: setInitialValues(),
  hideButtons: props.hideButtons
};

function handleBack() {
  // if (!props.project) {
  //   router.push({ name: 'admin-tasks' });
  // }
  emit('close');
}

async function onSubmit(values: Record<string, unknown>) {
  const payload = values as UpdateTaskPayload;
  if (clientId.value) {
    payload.clientId = clientId.value;
  }
  if (props.isNotesTask) {
    payload.notesId = props.notesTask.notesId;
    payload.description = props.notesTask.description;
  }
  if (!props.project) {
    payload.type = 'TASK';
  }
  if (projectIdParam?.value) {
    payload.projectId = projectIdParam.value as string;
  }

  payload.title = payload.name as string;

  delete payload.name;
  payload.description = {
    content: (payload.description as unknown as string) || ''
  };

  if (payload.isNotificationEnabled !== undefined) {
    payload.isNotificationEnabled = payload.isNotificationEnabled.toString();
  }
  else payload.isNotificationEnabled = 'false';
  if (payload.isBillingEnabled) {
    payload.isBillingEnabled = payload.isBillingEnabled.toString();
  }
  else payload.isBillingEnabled = 'false';

  if (payload.estimatedTime) {
    payload.estimatedTime = +payload.estimatedTime;
  }

  await createTask({ data: payload });
  emit('close');
}
</script>

<template>
  <CommonSchemaForm
    ref="taskCreateUpdateRef"
    :key="formKey"
    :data="formData"
    :primary-btn-loading="createIsLoading"
    @submit="onSubmit"
    @secondary-btn-click="handleBack()"
  />
</template>
