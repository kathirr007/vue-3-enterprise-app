<script setup lang="ts">
import { AddDescriptionSchema } from '@/types/service.type';
import { Field as VField, useField, useForm } from 'vee-validate';

const props = defineProps<{
  currentDesc?: string;
}>();

const emits = defineEmits(['success']);
const { isJsonStringValid } = useUtilityFns();

const { handleSubmit, errors, isSubmitting, meta, validate, values } = useForm({
  initialValues: {
    description: isJsonStringValid(props.currentDesc)
      ? JSON.parse(props.currentDesc as string)?.content
      : props.currentDesc
  },
  validationSchema: AddDescriptionSchema
});

const { value: description } = useField<string>('description');

const onSubmit = handleSubmit(async (values) => {
  emits('success', values.description);
});
</script>

<template>
  <form class="grid p-fluid formgrid" @submit="onSubmit">
    <div class="field col-12 md:col-12">
      <label for="description" class="block font-medium text-900">
        Description
        <span class="text-red-500">*</span>
      </label>
      <VField v-slot="{ handleChange, value }" name="description">
        <Editor
          :model-value="`${value ? value : ''}`"
          editor-style="height: 150px"
          @update:model-value="handleChange"
          @text-change="(e: any) => handleChange(e.htmlValue, true)"
          @blur="validate()"
        >
          <template #toolbar>
            <span class="ql-formats">
              <button class="ql-bold" />
              <button class="ql-italic" />
              <button class="ql-underline" />
              <button class="ql-strike" />
            </span>
            <span class="ql-formats">
              <button class="ql-list" value="ordered" />
              <button class="ql-list" value="bullet" />
            </span>
          </template>
        </Editor>
      </VField>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :feedback="false"
          :values="values"
          error-key="description"
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
      />
    </div>
  </form>
</template>
