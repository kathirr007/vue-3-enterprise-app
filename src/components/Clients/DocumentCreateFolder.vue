<script setup lang="ts">
import type {
  CreateFolderPayload,
  DocumentCreatePayload,
  DocumentFolder
} from '@/types/documents.type';
import { DocumentCreatePayloadSchema } from '@/types/documents.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import { useRouteQuery } from '@vueuse/router';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import { useMutation } from 'vue-query';

const props = defineProps<{
  folderToUpdate?: DocumentFolder;
}>();

const emit = defineEmits<{
  (e: 'success', data: DocumentFolder): void;
}>();
const folderId = useRouteQuery<string>('folderId');
const route = useRoute();
const clientId = ref(route.params.id as string);
const { isPortalUser } = useCurrentUserData();
const formRef = ref<SchemaFormRef>();

const { createFolder, updateFolder } = useDocuments();
const { mutateAsync: updateDocumentFolder, isLoading: updateIsLoading }
  = useMutation(
    ['document-update-folder'],
    (payload: CreateFolderPayload) => {
      return updateFolder({
        id: clientId.value as string,
        folderId: props.folderToUpdate?.id as string,
        payload,
        isPortal: isPortalUser.value
      });
    },
    {
      onSuccess: (data) => {
        emit('success', data);
      }
    }
  );
const { mutateAsync: createDocumentFolder, isLoading: createIsLoading }
  = useMutation(
    ['document-create-folder'],
    (payload: CreateFolderPayload) => {
      return createFolder(
        clientId.value as string,
        payload,
        isPortalUser.value
      );
    },
    {
      onSuccess: (data) => {
        emit('success', data);
      }
    }
  );

async function onSubmit(values: Record<string, any>) {
  if (props.folderToUpdate) {
    await updateDocumentFolder({
      ...values,
      name: values.name,
      parentId: folderId.value as string
    } as unknown as CreateFolderPayload);
  }
  else {
    await createDocumentFolder({
      ...values,
      name: values.name,
      parentId: folderId.value as string
    } as unknown as CreateFolderPayload);
  }
}

const formData: SchemaForm = {
  fields: [
    {
      as: InputText,
      name: 'name',
      label: 'Name',
      required: true,
      formGridClass: 'col-12 md:col-12',
      autocomplete: 'off',
      hide: !!props.folderToUpdate
    },
    {
      as: Checkbox,
      type: 'checkbox',
      name: 'clientExistingWritable',
      label: 'Client Existing Writable',
      direction: 'horizontal',
      formGridClass: 'col-6 md:col-6',
      hide: true
    },
    {
      as: Checkbox,
      type: 'checkbox',
      name: 'clientReadable',
      label: 'Client Readable',
      direction: 'horizontal',
      formGridClass: 'col-6 md:col-6'
      // hide: !props.folderToUpdate,
    },
    {
      as: Checkbox,
      type: 'checkbox',
      name: 'clientWritable',
      label: 'Client Writable',
      direction: 'horizontal',
      formGridClass: 'col-6 md:col-6'
      // hide: !props.folderToUpdate,
    },
    {
      as: Checkbox,
      type: 'checkbox',
      name: 'securedFolder',
      label: 'Secured Folder',
      direction: 'horizontal',
      formGridClass: 'col-6 md:col-6',
      hide: true
    }
  ],
  validationSchema: DocumentCreatePayloadSchema,
  initialValues: props.folderToUpdate
    ? { ...props.folderToUpdate }
    : {
        clientExistingWritable: false,
        clientReadable: isPortalUser.value,
        clientWritable: isPortalUser.value,
        securedFolder: false
      },
  btnText: 'Submit'
};

const { findFormIndex, updateFieldProp } = useSchemaForm(formData);

function onDropdownChange(formValues: Record<string, any>, name: string) {
  if (name === 'clientExistingWritable' || name === 'clientWritable') {
    if (formValues.clientExistingWritable || formValues.clientWritable) {
      formRef.value?.setValues({
        ...formValues,
        clientReadable: true
      });
      updateFieldProp('disabled', findFormIndex('clientReadable'), true);
    }
    else {
      formRef.value?.setValues({
        ...formValues,
        clientReadable: false
      });
      updateFieldProp('disabled', findFormIndex('clientReadable'), false);
    }
  }
}

onMounted(() => {
  if (props.folderToUpdate && props.folderToUpdate.clientWritable)
    onDropdownChange(
      props.folderToUpdate as unknown as DocumentCreatePayload,
      'clientWritable'
    );
});
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :primary-btn-loading="createIsLoading"
    @submit="onSubmit"
    @dropdown-change="onDropdownChange"
  />
</template>
