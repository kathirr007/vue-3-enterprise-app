<script setup lang="ts">
import type {
  BroadcastTemplate,
  CreateBroadcastTemplate
} from '@/types/broadcast.type';
import { BroadcastTemplateSchema } from '@/types/broadcast.type';
import type { SchemaForm } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

const props = defineProps<{
  template?: BroadcastTemplate;
  createIsLoading?: boolean;
  updateIsLoading?: boolean;
}>();
const emit = defineEmits<{
  (e: 'back', step: 'basic'): void;
  (e: 'basic', data?: CreateBroadcastTemplate): void;
}>();
const formKey = ref(0);
const formRef = ref();
const { template } = toRefs(props);
const formData = shallowRef<SchemaForm>({
  fields: [
    {
      as: InputText,
      name: 'name',
      label: 'Name',
      required: true,
      autocomplete: 'off'
    },
    {
      as: Textarea,
      name: 'description',
      required: true,
      label: 'Description',
      rows: 6
    }
  ],
  btnText: 'Next',
  validationSchema: BroadcastTemplateSchema,
  initialValues: template?.value ? template.value : undefined,
  secondaryBtnText: 'Back'
});

watch(
  () => template?.value,
  (val) => {
    if (val) {
      formRef.value?.setValues(val);
    }
  },
  { immediate: true }
);

function onSubmit(values: Record<string, any>) {
  emit('basic', { ...(values as unknown as CreateBroadcastTemplate) });
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
