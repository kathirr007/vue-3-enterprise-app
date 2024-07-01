<script setup lang="ts">
import type {
  EditorPlaceholderOption,
  EditorPlaceholderScope
} from '@/types/common.type';
import { AddMessageSchema, AddSubjectSchema } from '@/types/broadcast.type';
import { Field as VField, useForm } from 'vee-validate';
import { useQuery } from 'vue-query';
import getPlaceholderModule from 'quill-placeholder-module';
import Quill from 'quill';

const props = defineProps<{
  currentMessage?: string;
  fieldLabel: 'Subject' | 'Message';
}>();

const emits = defineEmits(['success']);

const broadcastTo = inject<string>('broadcastTo');

(window as any).Quill = Quill;
const { isJsonStringValid } = useUtilityFns();
const { getPlaceholderOptions } = useCustomEditor();
const { handleSubmit, errors, isSubmitting, meta, validate, values } = useForm({
  initialValues: {
    message: isJsonStringValid(props.currentMessage)
      ? JSON.parse(props.currentMessage as string)?.content
      : props.currentMessage
  },
  validationSchema:
    props.fieldLabel === 'Message' ? AddMessageSchema : AddSubjectSchema
});

const { data: placeholderOptions, isFetching: fetchingPlaceholders } = useQuery(
  ['editor-placeholders'],
  () => {
    const placeholderScope = `${(
      broadcastTo as string
    ).toUpperCase()}_BROADCAST_TEMPLATE`;
    return getPlaceholderOptions(placeholderScope as EditorPlaceholderScope);
  }
);

const editorPlaceholderOptions = computed(() => {
  if (placeholderOptions.value) {
    return placeholderOptions.value.map((option: EditorPlaceholderOption) => ({
      id: option.code,
      label: option.label
    }));
  }
  return [];
});

const EditorModules = computed(() => {
  if (editorPlaceholderOptions.value) {
    return {
      placeholder: {
        delimiters: ['{{', '}}'],
        placeholders: editorPlaceholderOptions.value
      }
    };
  }
  return {
    placeholder: {
      delimiters: ['{{', '}}'],
      placeholders: []
    }
  };
});

const onSubmit = handleSubmit(async (values) => {
  emits('success', values.message);
});

onMounted(() => {
  Quill.register(
    'modules/placeholder',
    getPlaceholderModule((window as any).Quill, {
      className: 'ql-placeholder-content'
    })
  );
});
</script>

<template>
  <CommonLoading v-if="fetchingPlaceholders" />
  <form v-else class="grid p-fluid formgrid" @submit="onSubmit">
    <div class="field col-12 md:col-12">
      <label for="message" class="block font-medium text-900">
        {{ fieldLabel }}
        <span class="text-red-500">*</span>
      </label>
      <VField v-slot="{ handleChange, value }" name="message">
        <Editor
          :model-value="`${value}`"
          :editor-style="{ height: '10rem' }"
          :modules="EditorModules"
          @update:model-value="handleChange"
          @text-change="(e: any) => handleChange(e.htmlValue, true)"
          @blur="validate"
        >
          <template #toolbar>
            <template v-if="fieldLabel === 'Subject'">
              <select
                v-if="EditorModules.placeholder.placeholders?.length"
                class="ql-placeholder"
              >
                <option value="" class="hide-item" />
                <option
                  v-for="option in EditorModules.placeholder.placeholders"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.label }}
                </option>
              </select>
            </template>
            <template v-else>
              <span class="ql-formats">
                <select class="ql-header" defaultValue="0">
                  <option value="1">Heading</option>
                  <option value="2">Subheading</option>
                  <option value="0">Normal</option>
                </select>
                <select class="ql-font">
                  <option />
                  <option value="serif" />
                  <option value="monospace" />
                </select>
                <select
                  v-if="EditorModules.placeholder.placeholders?.length"
                  class="ql-placeholder"
                >
                  <option value="" class="hide-item" />
                  <option
                    v-for="option in EditorModules.placeholder.placeholders"
                    :key="option.id"
                    :value="option.id"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </span>
              <span class="ql-formats">
                <button class="ql-bold" type="button" />
                <button class="ql-italic" type="button" />
                <button class="ql-underline" type="button" />
              </span>
              <span class="ql-formats">
                <select class="ql-color" />
                <select class="ql-background" />
              </span>
              <span class="ql-formats">
                <button class="ql-list" value="ordered" type="button" />
                <button class="ql-list" value="bullet" type="button" />
                <select class="ql-align">
                  <option defaultValue />
                  <option value="center" />
                  <option value="right" />
                  <option value="justify" />
                </select>
              </span>
              <span class="ql-formats">
                <button class="ql-link" type="button" />
                <button class="ql-image" type="button" />
                <button class="ql-video" type="button" />
                <button class="ql-code-block" type="button" />
              </span>
              <span class="ql-formats">
                <button class="ql-clean" type="button" />
              </span>
            </template>
          </template>
        </Editor>
      </VField>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :feedback="false"
          :values="values"
          error-key="message"
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
