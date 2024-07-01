<script setup lang="ts">
import type { ContentJSON } from '@/types/common.type';
import { AddDescriptionSchema } from '@/types/service.type';
import { useField, useForm, Field as VField } from 'vee-validate';

const props = defineProps<{
  currentDesc?: string;
}>();

const emits = defineEmits(['success']);
const { isJsonStringValid } = useUtilityFns();

const { handleSubmit, errors, isSubmitting, meta, validate, values } = useForm({
  initialValues: {
    description: isJsonStringValid(props.currentDesc)
      ? JSON.parse(props.currentDesc as string)?.content
      : props.currentDesc,
  },
  validationSchema: AddDescriptionSchema,
});

const { value: description } = useField<string>('description');

const onSubmit = handleSubmit(async (values) => {
  emits('success', values.description);
});
</script>

<template>
  <form @submit="onSubmit" class="grid p-fluid formgrid">
    <div class="field col-12 md:col-12">
      <label for="description" class="block font-medium text-900">
        Description
        <span class="text-red-500">*</span>
      </label>
      <VField name="description" v-slot="{ handleChange, value }">
        <Editor
          @update:model-value="handleChange"
          @text-change="(e: any) => handleChange(e.htmlValue, true)"
          :model-value="`${value ? value : ''}`"
          editor-style="height: 150px"
          @blur="validate()"
        >
          <template #toolbar>
            <span class="ql-formats">
              <button class="ql-bold"></button>
              <button class="ql-italic"></button>
              <button class="ql-underline"></button>
              <button class="ql-strike"></button>
            </span>
            <span class="ql-formats">
              <button class="ql-list" value="ordered"></button>
              <button class="ql-list" value="bullet"></button>
            </span>
          </template>
        </Editor>
      </VField>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :success-class="'font-medium'"
          :errors="errors"
          :feedback="false"
          :values="values"
          :errorKey="'description'"
        />
      </transition>
    </div>

    <div class="flex justify-content-end ml-auto col-12">
      <Button
        class="p-button-primary block max-w-max"
        type="submit"
        label="Submit"
        :disabled="!meta.valid"
        :loading="isSubmitting"
      ></Button>
    </div>
  </form>
</template>
