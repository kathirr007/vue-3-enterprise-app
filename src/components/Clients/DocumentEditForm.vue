<script setup lang="ts">
import type {
  CreateFilePayload,
  CreateFolderPayload,
  DocOrDirUpdateParams,
  DocumentFile,
  DocumentFolder,
} from '@/types/documents.type';
import type { EntityType, Task } from '@/types/tasks.type';
import { useRouteParams, useRouteQuery } from '@vueuse/router';
import { useMutation } from 'vue-query';
import { object, string } from 'yup';

const props = defineProps<{
  editType?: 'permissions' | 'rename' | 'move' | 'copy' | number;
  dataToModify?: DocumentFolder | DocumentFile;
  editDataType?: 'File' | 'Folder';
}>();

const emits = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

const { isPortalUser } = useCurrentUserData();
const { initToast } = useToasts();
const fileId = useRouteQuery<string>('fileId');
const folderId = useRouteQuery<string>('folderId');
const route = useRoute();
const clientId = ref(route.params.id as string);
const extension = ref<string | undefined>();
const validationSchemas: Record<string, unknown> = {
  assignedUserId: object({
    assignedUserId: string().required().label('Assign User'),
  }),
  rename: object({
    updatedName: string().required().label('Folder Name'),
  }),
  entityPriorityId: object({
    entityPriorityId: string().required().label('Priority'),
  }),
  dueDate: object({
    dueDate: string().required().label('Due Date'),
  }),
  startDate: object({
    startDate: string().required().label('Start Date'),
  }),
};

const { handleSubmit, errors, validate, meta, setFieldValue } = useForm({
  validationSchema: validationSchemas[props.editType as string],
});

const { value: assignedUserId } = useField<string>('assignedUserId');
const { value: updatedName } = useField<string>('updatedName');
const { value: entityPriorityId } = useField<string>('entityPriorityId');
const { value: dueDate } = useField<string>('dueDate');
const { value: startDate } = useField<string>('startDate');
const { updateFile, updateFolder } = useDocuments();

const handleSuccess = () => {
  initToast({
    actionType: 'Update',
    summary: `${props.editDataType} Update`,
    detail: `${props.editDataType} updated successfully.`,
  });
  emits('success');
};

const { mutateAsync: updateDoc, isLoading: updatingDoc } = useMutation(
  ['docment-update'],
  ({ id, folderId, payload, fileId }: Partial<DocOrDirUpdateParams>) => {
    return updateFile({
      id: id as string,
      fileId: fileId as string,
      folderId: folderId as string,
      payload: payload as CreateFilePayload,
      isPortal: isPortalUser.value,
    });
  },
  {
    onSuccess: () => {
      handleSuccess();
    },
  }
);
const { mutateAsync: updateDir, isLoading: updatingDir } = useMutation(
  ['docment-update'],
  ({ id, folderId, payload }: Partial<DocOrDirUpdateParams>) => {
    return updateFolder({
      id: id as string,
      folderId: folderId as string,
      payload: payload as CreateFolderPayload,
      isPortal: isPortalUser.value,
    });
  },
  {
    onSuccess: () => {
      handleSuccess();
    },
  }
);

const onSubmit = handleSubmit(async (values) => {
  if (props.editDataType === 'File') {
    await updateDoc({
      id: clientId.value as string,
      fileId: props.dataToModify?.id as string,
      payload: {
        ...props.dataToModify,
        name: values.updatedName + extension.value,
        folderId: folderId.value as string,
      } as unknown as CreateFilePayload,
    });
  } else {
    await updateDir({
      id: clientId.value as string,
      folderId: props.dataToModify?.id as string,
      payload: {
        ...props.dataToModify,
        name: values.updatedName,
      } as unknown as CreateFilePayload,
    });
  }
});

onMounted(() => {
  extension.value = '.' + props.dataToModify?.name.split('.').pop();
  const filename =
    props.editDataType === 'File'
      ? props.dataToModify?.name.split('.').slice(0, -1).join('')
      : props.dataToModify?.name;
  setFieldValue('updatedName', filename);
});
</script>

<template>
  <div class="p-4">
    <form @submit="onSubmit" class="grid p-fluid formgrid">
      <div
        v-if="editType === 'rename'"
        class="field col-12 md:col-12 sm:col-12"
      >
        <label class="text-900 font-semibold" for="updatedName">
          New {{ editDataType }} Name
          <span class="text-red-600">*</span>
        </label>
        <InputText
          id="updatedName"
          v-model="updatedName"
          type="updatedName"
          class="w-full"
          :class="{ 'p-invalid': errors['updatedName'] }"
          @blur="validate()"
        />
        <p class="p-error" v-if="errors.updatedName">
          {{ errors.updatedName }}
        </p>
      </div>
      <div class="col-12">
        <Button
          class="p-button-primary w-8rem ml-auto block"
          type="submit"
          label="Submit"
          :disabled="!meta.valid"
          :loading="updatingDoc || updatingDir"
        ></Button>
      </div>
    </form>
  </div>
</template>
