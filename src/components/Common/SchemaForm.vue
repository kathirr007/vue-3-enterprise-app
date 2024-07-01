<script setup lang="ts">
import type { SchemaForm, SchemaFormField } from '@/types/schemaform.type';
import { Field as VField } from 'vee-validate';
import type { FileObject, UploadFilesPayload } from '@/types/common.type';
import type { EditorTextChangeEvent } from 'primevue/editor';
import Editor from 'primevue/editor';
import Dropdown from 'primevue/dropdown';
import getPlaceholderModule from 'quill-placeholder-module';
import Quill from 'quill';

const props = defineProps<{
  data: SchemaForm;
  formKey?: string | number;
  primaryBtnLoading?: boolean;
  disableSubmit?: boolean;
  disabledTooltip?: string;
  buttonWrapperClass?: string;
  autoComplete?: string;
  isEditorPlaceholder?: boolean;
  isImagePlaceholder?: boolean;
  useFieldArrayKey?: string;
}>();
// const emit = defineEmits(['submit', 'secondary-btn-click']);
const emit = defineEmits<{
  (e: 'submit', formValues: Record<string, any>): void;
  (e: 'secondary-btn-click'): void;
  (e: 'file-upload', value: unknown): void;
  (e: 'file-select', value: FileObject): void;
  (e: 'radio-click', formValues: Record<string, unknown>, name?: string): void;
  (
    e: 'dropdown-change',
    formValues: Record<string, unknown>,
    name: string
  ): void;
  (
    e: 'calendar-input',
    formValues: Record<string, unknown>,
    name: string
  ): void;
  (
    e: 'editor-text-change',
    event: EditorTextChangeEvent,
    formValues: Record<string, unknown>,
    name: string
  ): void;
}>();
// const Quill: any = QuillNamespace;
(window as any).Quill = Quill;
const { ISODatestringToDate } = useVueFilters();
const horizontalClasses = {
  label: 'block font-medium text-900 md:w-13rem mb-2 md:mb-0 mr-2',
  wrapper:
    'w-full flex flex-column md:flex-row justify-content-between md:align-items-center',
  input: 'w-full flex-l'
};
// const formKey = ref(0);
const schemaForm = ref(null);
const editorRef = ref(null);
const schemaFormRefs = getCurrentInstance();

const {
  handleSubmit,
  meta,
  values,
  errors,
  setValues,
  setFieldValue,
  validate,
  validateField,
  setFieldError
} = useForm({
  validationSchema: props.data.validationSchema,
  initialValues: props.data.initialValues,
  initialTouched: props.data.initialTouched,
  validateOnMount: props.data.validateOnMount
});

const { remove, push, fields } = props.useFieldArrayKey ? useFieldArray(props.useFieldArrayKey as string) : useFieldArray('test');

const onSubmit = handleSubmit((formValues: Record<string, unknown>) => {
  emit('submit', formValues);
});

defineExpose({
  props,
  schemaForm,
  schemaFormValues: ref(values),
  schemaFormRefs,
  errors,
  meta,
  fields,
  setValues,
  setFieldValue,
  setFieldError,
  validate,
  validateField,
  onSubmit,
  remove,
  push
});

function handleEditorTextChange(
  event: EditorTextChangeEvent,
  formValues?: Record<string, unknown>,
  name?: string
) {
  emit(
    'editor-text-change',
    event,
    formValues as Record<string, unknown>,
    name as string
  );
}
function handleDropDownChange(
  formValues: Record<string, unknown>,
  name: string
) {
  emit('dropdown-change', formValues, name);
}
function handleCalendarEnd(formValues: Record<string, unknown>, name: string) {
  emit('calendar-input', formValues, name);
}
function handleRadio(formValues: Record<string, unknown>, name?: string) {
  emit('radio-click', formValues, name);
}
function onUpload(
  files: UploadFilesPayload,
  name: string,
  isMultiple: boolean,
  showLoading = true,
  isSelect = false
) {
  if (showLoading)
    (schemaFormRefs as unknown as Record<string, any>).refs[
      `${name}-upload`
    ][0].isUploading = true;

  if (!isMultiple) {
    if (isSelect) {
      emit('file-select', {
        files: (files.files as File[])[0],
        name: `${name}-upload`
      });
    }
    else
      emit(`file-upload`, {
        files: (files.files as File[])[0],
        name: `${name}-upload`
      });
  }
  else {
    if (isSelect) {
      emit('file-select', { files: files.files, name: `${name}-upload` });
    }
    else emit(`file-upload`, { files: files.files, name: `${name}-upload` });
  }
  return null;
}

function getField(name: string) {
  const field = props.data.fields.find(field => field.name === name);
  (field as SchemaFormField).values = values;
  (field as SchemaFormField).errors = errors;
  return field;
}

onMounted(() => {
  if (props.isEditorPlaceholder) {
    // const placeholderModule = Quill.import('modules/placeholder');
    Quill.register(
      'modules/placeholder',
      getPlaceholderModule((window as any).Quill, {
        className: 'ql-placeholder-content'
      })
    );
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <form
    :key="formKey"
    ref="schemaForm"
    class="grid formgrid"
    :autocomplete="autoComplete"
    @submit="onSubmit"
  >
    <template
      v-for="{
        as,
        name,
        label,
        helpText,
        required,
        direction,
        type,
        options,
        optionLabel,
        optionValue,
        hide,
        showFeedback,
        softHide,
        showSlot,
        showLabelSlot,
        placeholderOptions,
        ...attrs
      } in data.fields"
      :key="name"
    >
      <div v-if="!hide" class="col-12 py-2" :class="[attrs.formGridClass]">
        <div v-if="name.startsWith('divider') && !hide">
          <Divider :class="[attrs.dividerClass]" />
        </div>
        <div v-else-if="name.startsWith('title') && !hide">
          <FormTitle :title="(label as string)" remove-divider v-bind="attrs" />
        </div>
        <template v-else-if="!showSlot">
          <div
            v-if="!hide"
            :class="
              `${direction !== 'horizontal'
                ? 'field mb-0'
                : horizontalClasses.wrapper} ${softHide ? 'opacity-0' : ''}`
            "
          >
            <label
              v-if="label"
              :for="name"
              :class="
                direction !== 'horizontal'
                  ? 'block font-medium text-900'
                  : horizontalClasses.label
              "
            >
              <template v-if="!showLabelSlot">{{ label }} <span v-if="required" class="text-red-600">*</span>
              </template>
              <template v-else>
                <slot :name="`${name}-label`" v-bind="getField(name)" />
              </template>
            </label>
            <div v-if="helpText" class="text-sm mb-2 -mt-2" v-html="helpText" />
            <div
              class="w-full"
              :class="[
                { 'p-inputgroup': attrs.inputGroup },
                { 'no-suffix': !attrs.inputGroupSuffix },
                { 'no-prefix': !attrs.inputGroupPrefix },
              ]"
            >
              <span
                v-if="attrs.inputGroupPrefix"
                class="p-inputgroup-addon"
                v-html="attrs.inputGroupPrefix"
              />

              <div
                v-if="
                  type === 'dropdown'
                    || type === 'calender'
                    || type === 'radio'
                    || type === 'multiSelect'
                    || type === 'checkbox'
                    || type === 'input-number'
                    || type === 'input-password'
                "
                class="w-full flex-1"
              >
                <VField
                  v-slot="{ handleChange, value, validate, field }"
                  :name="name"
                  v-bind="attrs"
                >
                  <Dropdown
                    v-if="type === 'dropdown'"
                    v-bind="attrs"
                    :id="name"
                    :tabindex="0"
                    class="w-full"
                    :name="name"
                    :input-id="name"
                    :model-value="value"
                    :options="options"
                    :option-label="optionLabel"
                    :option-value="optionValue"
                    :filter="
                      attrs.filter !== undefined ? !!attrs.filter : true
                    "
                    :show-clear="
                      attrs.clearable !== undefined
                        ? !!attrs.clearable
                        : true
                    "
                    :placeholder="attrs.placeholder as string"
                    @update:model-value="handleChange"
                    @change="handleDropDownChange(values, name)"
                    @blur="validate()"
                  />
                  <InputNumber
                    v-else-if="type === 'input-number'"
                    v-bind="{ ...attrs, field }"
                    :id="name"
                    class="w-full"
                    :name="name"
                    :input-id="name"
                    :model-value="value as number"
                    :value="value"
                    type="number"
                    @update:model-value="handleChange"
                    @blur="validate()"
                  />
                  <Password
                    v-else-if="type === 'input-password'"
                    v-bind="{ ...attrs, field }"
                    :id="name"
                    class="w-full"
                    :name="name"
                    :input-id="name"
                    :model-value="value as string"
                    :value="value"
                    @update:model-value="handleChange"
                    @blur="validate()"
                  />
                  <Checkbox
                    v-else-if="type === 'checkbox'"
                    :binary="true"
                    v-bind="attrs"
                    :name="name"
                    :input-id="name"
                    :model-value="value"
                    :placeholder="attrs.placeholder as string"
                    @update:model-value="handleChange"
                    @change="handleDropDownChange(values, name)"
                    @blur="validate()"
                  />
                  <MultiSelect
                    v-else-if="type === 'multiSelect'"
                    v-bind="attrs"
                    :id="name"
                    class="w-full"
                    :name="name"
                    :input-id="name"
                    :model-value="value"
                    :options="options"
                    :option-label="optionLabel"
                    :option-value="optionValue"
                    :filter="
                      attrs.filter !== undefined ? !!attrs.filter : true
                    "
                    :placeholder="attrs.placeholder as string"
                    @update:model-value="handleChange"
                    @change="handleDropDownChange(values, name)"
                    @blur="validate()"
                  />
                  <Calendar
                    v-else-if="type === 'calender'"
                    v-bind="attrs"
                    :id="name"
                    class="w-full"
                    :input-props="{ name }"
                    :input-id="name"
                    :model-value="ISODatestringToDate(value as string)"
                    @update:model-value="handleChange"
                    @blur="validate()"
                    @date-select="handleCalendarEnd(values, name)"
                  />
                  <div
                    v-else
                    class="flex"
                    :class="
                      attrs.isRadioStacked
                        ? 'flex-column space-y-2.5'
                        : 'space-x-2.5'
                    "
                  >
                    <div v-for="(option, index) in options" :key="index">
                      <div class="field-radiobutton mb-0">
                        <RadioButton
                          v-bind="attrs"
                          :id="name"
                          :input-id="`${option.name}_${index + 1}`"
                          :name="option.name"
                          :model-value="value"
                          :value="option.value"
                          @update:model-value="handleChange"
                          @blur="validate()"
                          @change="handleRadio(values, name)"
                        />
                        <label
                          class="ml-2 cursor-pointer"
                          :for="`${option.name}_${index + 1}`"
                        >{{ option.radioLabel }}</label>
                      </div>
                      <div
                        v-if="option.note"
                        :class="option.noteClasses"
                        v-html="option.note"
                      />
                    </div>
                  </div>
                </VField>
              </div>
              <div v-else-if="type === 'file'" class="w-full">
                <VField :id="name" :name="name" v-bind="attrs">
                  <CommonFileUpload
                    v-bind="attrs"
                    :id="name"
                    :ref="`${name}-upload`"
                    :name="name"
                    :input-id="name"
                    :custom-upload="true"
                    :multiple="!!attrs.multiple || false"
                    :show-upload-button="!attrs.hideUploadBtn"
                    @uploader="
                      (files: UploadFilesPayload) =>
                        onUpload(files, name, Boolean(attrs.multiple || false))
                    "
                    @select="
                      (files: UploadFilesPayload) =>
                        onUpload(
                          files,
                          name,
                          Boolean(attrs.multiple || false),
                          false,
                          true,
                        )
                    "
                    @remove="
                      (files: UploadFilesPayload) =>
                        onUpload(
                          files,
                          name,
                          Boolean(attrs.multiple || false),
                          false,
                          true,
                        )
                    "
                  />
                </VField>
              </div>
              <div v-else-if="type === 'editor'" class="w-full">
                <VField
                  :id="name"
                  v-slot="{ handleChange, value }"
                  :name="name"
                  v-bind="attrs"
                >
                  <Editor
                    v-bind="attrs"
                    :id="name"
                    ref="editorRef"
                    :model-value="value as string"
                    @update:model-value="handleChange"
                    @text-change="
                      (e: any) => {
                        handleChange(e.htmlValue, true);
                        handleEditorTextChange(e, values, name);
                      }
                    "
                    @blur="validate()"
                  >
                    <template #toolbar>
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
                          v-if="placeholderOptions?.length"
                          class="ql-placeholder"
                        >
                          <option value="" class="hide-item" />
                          <option
                            v-for="option in placeholderOptions"
                            :key="option.id"
                            :value="option.id"
                          >
                            {{ option.label }}
                          </option>
                        </select>
                      </span>
                      <span class="ql-formats">
                        <button class="ql-bold" aria-label="ql-bold" type="button" />
                        <button class="ql-italic" aria-label="ql-italic" type="button" />
                        <button class="ql-underline" aria-label="ql-underline" type="button" />
                      </span>
                      <span class="ql-formats">
                        <select class="ql-color" />
                        <select class="ql-background" />
                      </span>
                      <span class="ql-formats">
                        <button
                          class="ql-list"
                          aria-label="ql-list"
                          value="ordered"
                          type="button"
                        />
                        <button
                          class="ql-list"
                          aria-label="ql-list"
                          value="bullet"
                          type="button"
                        />
                        <select class="ql-align">
                          <option defaultValue />
                          <option value="center" />
                          <option value="right" />
                          <option value="justify" />
                        </select>
                      </span>
                      <span class="ql-formats">
                        <button aria-label="ql-link" class="ql-link" type="button" />
                        <button aria-label="ql-image" class="ql-image" type="button" />
                        <button aria-label="ql-video" class="ql-video" type="button" />
                        <button aria-label="ql-code-block" class="ql-code-block" type="button" />
                      </span>
                      <span class="ql-formats">
                        <button class="ql-clean" aria-label="ql-clean" type="button" />
                      </span>
                    </template>
                  </Editor>
                </VField>
              </div>
              <VField
                v-else
                :id="name"
                :as="as"
                :input-id="name"
                :name="name"
                v-bind="attrs"
                :class="
                  direction !== 'horizontal'
                    ? 'w-full flex-1'
                    : horizontalClasses.input
                "
              />
              <span
                v-if="attrs.inputGroupSuffix"
                class="p-inputgroup-addon"
                v-html="attrs.inputGroupSuffix"
              />
            </div>
            <div
              v-if="attrs.note"
              class="mt-1"
              :class="attrs.noteClasses"
              v-html="attrs.note"
            />
          </div>
          <transition mode="out-in" name="field-slide-down">
            <FormFeedbackMessage
              :errors="errors"
              :values="values"
              :error-key="name"
              :feedback="!!required && !!showFeedback"
            />
          </transition>
        </template>
        <template v-else>
          <slot :name="name" v-bind="getField(name)" />
        </template>
      </div>
    </template>
    <slot />
    <div
      v-if="!data.hideButtons"
      class="buttons-wrapper flex w-full justify-content-between mt-3 ml-auto col-12"
      :class="buttonWrapperClass"
    >
      <Button
        v-if="data.secondaryBtnText && !data.hideSecondaryBtn"
        :label="data.secondaryBtnText"
        class="max-w-max font-medium"
        :class="[
          {
            'p-button-text': data.secondaryBtnText === 'Back',
          },
          { 'p-button-danger': data.secondaryBtnText !== 'Back' },
        ]"
        :icon="data.secondaryBtnText === 'Back' ? 'pi pi-chevron-left' : ''"
        @click="$emit('secondary-btn-click')"
      />
      <span
        v-if="!data.hidePrimaryBtn"
        v-tooltip.top="
          `${disableSubmit && disabledTooltip ? disabledTooltip : ''}`
        "
        class="inline-block"
        :class="{
          'ml-auto': !data.secondaryBtnText || data.hideSecondaryBtn,
        }"
        style="height: 2.357rem;"
      >
        <Button
          class="max-w-max font-medium"
          :disabled="disableSubmit || !meta.valid"
          type="submit"
          :label="data.btnText"
          :loading="primaryBtnLoading"
        />
      </span>
    </div>
  </form>
</template>

<style lang="scss" scoped>
:deep(.p-inputgroup) {
  input,
  input:first-child,
  input:last-child {
    border-radius: 0;
  }

  &.no-prefix {
    input {
      border-radius: 6px 0 0 6px;
    }
  }

  &.no-suffix {
    input {
      border-radius: 0 6px 6px 0;
    }
  }
}

:deep(*) {
  .ql-container {
    .ql-editor {
      iframe {
        margin: 1rem;
      }
    }

    &:has(iframe) {
      height: 250px !important;
    }
  }
}
</style>
