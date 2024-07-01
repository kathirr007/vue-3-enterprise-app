<script setup lang="ts">
import type { ContentJSON } from '@/types/common.type';
import type { EditorTextChangeEvent } from 'primevue/editor';
import Editor from 'primevue/editor';

const props = defineProps<{
  label?: string;
  placeholder?: string;
  value?: string;
  commentBox?: string;
  loading?: boolean;
  hideCancelBtn?: boolean;
  isDelta?: boolean;
  customButtons?: string;
  customBtnTooltip?: string;
  showAllActions?: boolean;
  rewrite?: boolean;
  autoreply?: boolean;
  summarize?: boolean;
}>();
const emit = defineEmits<{
  (e: 'submit', value: string | ContentJSON): void;
  (e: 'cancel'): void;
  (e: 'custom-button'): void;
  (e: 're-open'): void;
  (e: 'auto-reply'): void;
  (e: 'summarize'): void;
  (e: 'editor-value', value: any): void;
}>();
const editorRef = ref<Editor>();

const { featureSubscribed } = usePermissions();
const { isLarge } = useCommonBreakPoints();
const htmlValue = ref(props.value || '');
const reRenderColorKey = ref(0);
function onSubmit() {
  emit(
    'submit',
    props.isDelta
      ? { content: htmlValue.value, delta: editorDelta.value }
      : htmlValue.value
  );
  if (!props.commentBox && !props.value) {
    htmlValue.value = props.commentBox as string;
  }
}
const editorDelta = ref();
const aiFeature = ref();
const subscribeDialog = ref(false);

function handleTextChange(e: EditorTextChangeEvent) {
  editorDelta.value = e.delta;
  htmlValue.value = e.htmlValue;
  emit('editor-value', htmlValue.value);
}

function handleAutoReply() {
  if (featureSubscribed('ai_features', 'auto_response') === false) {
    aiFeature.value = 'Auto Reply';
    subscribeDialog.value = true;
    return;
  }
  emit('auto-reply');
}
function handleRewrite() {
  if (featureSubscribed('ai_features', 'content_rewrite') === false) {
    aiFeature.value = 'Rewrite';
    subscribeDialog.value = true;
    return;
  }
  emit('re-open');
}
defineExpose({
  editorRef,
  onSubmit
});
watchEffect(() => {
  if (props.value) {
    htmlValue.value = props.value;
    // emit('editor-value', htmlValue.value);
  }
});
watch(
  () => htmlValue,
  () => {
    reRenderColorKey.value = reRenderColorKey.value + 1;
  }
);
</script>

<template>
  <form>
    <Editor
      ref="editorRef"
      :model-value="htmlValue"
      editor-style="height: 130px"
      :placeholder="placeholder || 'Enter your comment here'"
      @text-change="handleTextChange"
    >
      <template #toolbar>
        <span v-if="!isLarge || customButtons" class="ql-formats">
          <template v-if="!isLarge">
            <button class="ql-bold" aria-label="ql-bold" />
            <button class="ql-italic" aria-label="ql-italic" />
            <button class="ql-image" aria-label="ql-image" type="button" />
          </template>
          <template v-if="showAllActions">
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
            </span>
            <span class="ql-formats">
              <button class="ql-bold" aria-label="ql-bold" type="button" />
              <button class="ql-italic" aria-label="ql-italic" type="button" />
              <button class="ql-underline" aria-label="ql-underline" type="button" />
            </span>
            <span :key="reRenderColorKey" class="ql-formats">
              <select class="ql-color" />
              <select class="ql-background" />
            </span>
            <span class="ql-formats">
              <button class="ql-list" aria-label="ql-list" value="ordered" type="button" />
              <button class="ql-list" aria-label="ql-list" value="bullet" type="button" />
              <select class="ql-align" aria-label="ql-align">
                <option defaultValue />
                <option value="center" />
                <option value="right" />
                <option value="justify" />
              </select>
            </span>
            <span class="ql-formats">
              <button aria-label="ql-link" class="ql-link" type="button" />
              <button aria-label="ql-image" class="ql-image" type="button" />
              <button aria-label="ql-code-block" class="ql-code-block" type="button" />
            </span>
            <span class="ql-formats">
              <button aria-label="ql-clean" class="ql-clean" type="button" />
            </span>
            <button
              v-if="customButtons"
              v-tooltip="customBtnTooltip"
              aria-label="button"
              @click.prevent="emit('custom-button')"
            >
              <i :class="customButtons" type="button" />
            </button>
          </template>
        </span>
      </template>
    </Editor>
    <div class="flex justify-content-end mt-4 w-full gap-2 flex-wrap">
      <!-- <Button
        v-if="summarize"
        label="Summarize"
        size="small"
        class="max-w-max"
        @click="$emit('summarize')"
      /> -->
      <Button
        v-if="autoreply"
        label="Auto-reply"
        size="small"
        class="max-w-max"
        @click="handleAutoReply"
      />
      <Button
        v-if="rewrite"
        label="Re-write"
        size="small"
        class="max-w-max"
        :disabled="htmlValue ? false : true"
        @click="handleRewrite"
      />
      <Button
        :label="label || 'Post Comment'"
        size="small"
        class="max-w-max"
        :disabled="htmlValue ? false : true"
        :loading="loading"
        @click="onSubmit"
      />
      <Button
        v-if="!hideCancelBtn"
        label="Cancel"
        size="small"
        class="max-w-max p-button-danger"
        @click="$emit('cancel')"
      />
    </div>
  </form>
  <CommonSubscribeDialog
    v-if="subscribeDialog"
    :visible="subscribeDialog"
    :feature="aiFeature"
    @hide="subscribeDialog = false"
  />
</template>

<style lang="scss" scoped></style>
