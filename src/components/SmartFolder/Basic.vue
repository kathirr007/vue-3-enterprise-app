<script setup lang="ts">
import {
  type CreateSmartFolder,
  type SmartFolder,
  SmartFolderCreatePayloadSchema
} from '@/types/smart-folder.type';
import type { SchemaForm } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import Textarea from 'primevue/textarea';

const props = defineProps<{
  createIsLoading?: boolean;
  updateIsLoading?: boolean;
  smartFolderDetails?: SmartFolder;
}>();
const emit = defineEmits<{
  (e: 'back', step: string): void;
  (e: 'basic', data?: CreateSmartFolder): void;
}>();

const formKey = ref(0);
const formRef = ref();
const formData = shallowRef<SchemaForm>({
  fields: [
    {
      as: InputText,
      name: 'name',
      label: 'Folder Name',
      required: true,
      autocomplete: 'off'
    },
    {
      as: Textarea,
      name: 'description',
      label: 'Folder Description',
      rows: 4
    },
    {
      as: Checkbox,
      type: 'checkbox',
      name: 'clientReadable',
      label: 'Client Readable',
      direction: 'horizontal',
      formGridClass: 'md:col-6'
      // hide: !props.folderToUpdate,
    }
  ],
  btnText: 'Next',
  validationSchema: SmartFolderCreatePayloadSchema,
  initialValues: props.smartFolderDetails
    ? { ...props.smartFolderDetails }
    : {},
  secondaryBtnText: 'Back'
});

function onSubmit(values: any) {
  emit('basic', { ...values });
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :key="formKey"
    :data="formData"
    :primary-btn-loading="createIsLoading || updateIsLoading"
    @submit="onSubmit"
    @secondary-btn-click="() => emit('back', 'basic')"
  />
</template>

<style lang="scss" scoped></style>
