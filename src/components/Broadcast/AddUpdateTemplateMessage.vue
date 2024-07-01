<script setup lang="ts">
import type {
  BroadcastTemplate,
  TemplateMessagePayload
} from '@/types/broadcast.type';
import { CreateTemplateMessageSchema } from '@/types/broadcast.type';
import type { EditorPlaceholderOption,
  EditorPlaceholderScope,
  UploadFilesPayload
} from '@/types/common.type';
import { Field as VField } from 'vee-validate';
import { useMutation, useQuery } from 'vue-query';
import Dropdown from 'primevue/dropdown';
import Editor from 'primevue/editor';
import type { Ref } from 'vue';
import router from '@/router';
import * as QuillNamespace from 'quill';
import type { Attachment, AttachmentResponse } from '@/types/attachment.type';
import type { MailsAttachmentResponse } from '@/types/inbox.type';

type EmptyRecord = TemplateMessagePayload & {
  error?: string;
  isAllDisabled?: boolean;
};

const props = defineProps<{
  template?: BroadcastTemplate;
  messages?: TemplateMessagePayload[];
  revisit?: boolean;
}>();
const emit = defineEmits<{
  (event: 'back', step: 'message'): void;
  (
    e: 'showAttachments',
    data: {
      actionType: 'show' | 'hide';
      attachments?: Pick<Attachment, 'id' | 'name'>[];
      idx?: number;
    }
  ): void;
  (
    e: 'updateAttachment',
    {
      id,
      attachmentIds
    }: {
      id: string;
      attachmentIds: string[];
    }
  ): void;
}>();

const broadcastTo = inject<string>('broadcastTo');

const Quill: any = QuillNamespace;

const formKey = ref(0);
const attachDialog = ref(false);
const isGalleryMoveDialog = ref(false);
const isMultiple = ref(true);
const attachmentsListDialog = ref(false);
const confirmRemoveAttachmentDialog = ref(false);
const selectedTemplateMessage = ref<EmptyRecord>();
const selectedTemplateFieldType = ref();
const isDescDialogVisible = ref(false);
const uploadFromDesktopDialog = ref(false);
const allAttachments = ref<Attachment[]>([]);
const currentAttachmentRes = ref<AttachmentResponse[]>([]);
const clientBroadcastAttachmentsRef = ref<Record<string, any>>();
const attachmentToRemove = ref<
  Pick<Attachment, 'id' | 'name'> & { index: number }
>();

const currentAttachmentRef = ref<{
  index: number;
  isUpdate?: boolean;
}>();

const typeOptions = [
  { name: 'Mobile', value: 'MOBILE' },
  { name: 'Email', value: 'EMAIL' }
];

const { canDo } = usePermissions();
const { onUpload, getAttachment, getAttachmentUrl } = useAttachments();
const { initToast } = useToasts();
const { isFalsy } = useUtilityFns();
const { defaultBreakpoints, isMedium } = useCommonBreakPoints();
const tableCellStyles = { 'min-width': '15rem' };
const tableActionStyles = { 'min-width': '11rem' };
const { template } = toRefs(props);
const emptyRecord: EmptyRecord = {
  body: '',
  subject: '',
  type: 'EMAIL',
  error: '',
  isEditor: false,
  isSubjectEditor: false
};

const {
  values: messageValues,
  errors: messageErrors,
  validate
} = useForm({
  validationSchema: CreateTemplateMessageSchema,
  validateOnMount: false,
  initialValues: {
    messages: props.messages?.length
      ? props.messages.map((e) => {
        return { ...e, isAllDisabled: true };
      })
      : [{ ...emptyRecord }]
  }
});

const { fields: messagesFields } = useFieldArray('messages');
const { getPlaceholderOptions } = useCustomEditor();

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

const { mutateAsync: addTemplateMessage, isLoading: createIsLoading }
  = useMutation(
    ({ payload, id }: { payload: TemplateMessagePayload; id: string }) => {
      return useBroadcastTemplateMessage(id, payload);
    },
    {
      onSuccess: async () => {
        initToast({
          actionType: 'Update',
          severity: 'success',
          summary: 'Success',
          detail: 'Broadcast Template Message Updated'
        });
        /* if (!props.revisit) {
        } */
        router.push({
          name: 'admin-broadcasts-type',
          // params: { broadcastTo },
          query: { activeIndex: '1' }
        });
      }
    }
  );
async function onSubmit(values: TemplateMessagePayload) {
  updateAttachment();
  await addTemplateMessage({
    payload: {
      ...values
    },
    id: template?.value?.id as string
  });
}

function removeFieldError(field: Ref<EmptyRecord>): void {
  if (!field.value.error)
    return;
  field.value.error = '';
}

async function handleCreateEdit(field: EmptyRecord) {
  const isValid = await validate();
  if (!isValid.valid) {
    const isEmptySubject = isFalsy(
      (messagesFields.value[0].value as unknown as EmptyRecord).subject
    );
    const isEmptyMessage = isFalsy(
      (messagesFields.value[0].value as unknown as EmptyRecord).body
    );
    /* if (isEmptySubject) {
      toggleSubjectMessageEditor(field, 'subject');
      return;
    }
    if (isEmptyMessage) {
      toggleSubjectMessageEditor(field, 'message');
    } */
    return;
  }

  const { isEditor, isAllDisabled, ...rest } = messageValues.messages[0];
  const body = rest.body as string;
  rest.body = { content: body };
  await onSubmit(rest);
  (messagesFields.value[0].value as unknown as EmptyRecord).isAllDisabled
    = true;
}

function getButtonIconTooltip(field: EmptyRecord) {
  if (props.revisit && field.isAllDisabled)
    return { icon: 'pi pi-pencil', tooltip: 'Edit' };
  return { icon: 'pi pi-check', tooltip: 'Add' };
}
function getBodyButtonIconTooltip(field: EmptyRecord) {
  if (field.isEditor)
    return { icon: 'pi pi-chevron-up', tooltip: 'Hide' };
  if (!field.body)
    return { icon: 'pi pi-chevron-down', tooltip: 'Add' };
  return { icon: 'pi pi-chevron-down', tooltip: 'Edit' };
}
function getSubjectButtonIconTooltip(field: EmptyRecord) {
  if (field.isSubjectEditor)
    return { icon: 'pi pi-chevron-up', tooltip: 'Hide' };
  if (!field.subject)
    return { icon: 'pi pi-chevron-down', tooltip: 'Add' };
  return { icon: 'pi pi-chevron-down', tooltip: 'Edit' };
}

function prepareForAttachment() {
  attachDialog.value = true;
}

function prepareAttachmentsList() {
  // emit('showAttachments', data);
  attachmentsListDialog.value = true;
}

function prepareRemoveAttachment(index: number,
  data: Pick<Attachment, 'id' | 'name'>) {
  attachmentToRemove.value = { ...data, index };
  // attachmentToRemove.value = { ...data };
  confirmRemoveAttachmentDialog.value = true;
}

async function handleRemoveAttachment(index: number) {
  if (props.revisit) {
    await removeAttachment({
      broadcastTemplateId: props.template?.id as string,
      attachmentId: attachmentToRemove.value?.id as string
    });
  }
  allAttachments.value.splice(index, 1);
}

function updateAttachment() {
  emit('updateAttachment', {
    id: props.template?.id as string,
    attachmentIds: allAttachments.value.map(item => item?.id)
  });
  currentAttachmentRes.value = [];
}

function closeAttachmentDialog() {
  attachDialog.value = false;
  isGalleryMoveDialog.value = false;
  uploadFromDesktopDialog.value = false;
}

async function updateAttachmentValues(attachments: MailsAttachmentResponse[],
  isGallery?: boolean) {
  allAttachments.value = isGallery
    ? ([...allAttachments.value, ...attachments] as Attachment[])
    : ([
        ...allAttachments.value,
        ...(await Promise.all(
          attachments.map(async (attachment) => {
            const { id, name, path } = (await getAttachment(
              attachment.id
            )) as Attachment;
            return { id, name, path };
          })
        ))
      ] as Attachment[]);
}

async function uploadFiles(value: UploadFilesPayload) {
  // allAttachments.value.push(...(value.files as unknown as File[]));
  if (clientBroadcastAttachmentsRef.value) {
    clientBroadcastAttachmentsRef.value.isUploading = true;
  }
  const uploadResults = await onUpload({ payload: value });
  await updateAttachmentValues(uploadResults as MailsAttachmentResponse[]);
  closeAttachmentDialog();
}

async function handleGalleryFiles(files: MailsAttachmentResponse[]) {
  await updateAttachmentValues(files, true);
  closeAttachmentDialog();
  initToast({
    actionType: 'Create',
    summary: 'Attach files from the gallery',
    detail: `Selected files attached to the broadcast template successfully`
  });
}

const currentInstance = getCurrentInstance();

const { mutateAsync: removeAttachment, isLoading: removingAttachment }
  = useMutation(
    ({
      broadcastTemplateId,
      attachmentId
    }: {
      broadcastTemplateId: string;
      attachmentId: string;
    }) => {
      return useBroadcastTemplateRemoveAttachment({
        broadcastTemplateId,
        attachmentId
      });
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Remove',
          severity: 'success',
          summary: 'Remove Broadcast Attachment',
          detail: 'Broadcast Attachment Removed Successfully'
        });
      }
    }
  );

function prepareForMessage(field: EmptyRecord,
  fieldType: 'Message' | 'Subject') {
  selectedTemplateFieldType.value = fieldType;
  selectedTemplateMessage.value = field;
  isDescDialogVisible.value = true;
}

function handleMessage(value: string) {
  if (selectedTemplateMessage.value) {
    selectedTemplateMessage.value[
      `${selectedTemplateFieldType.value === 'Message' ? 'body' : 'subject'}`
    ] = value;
  }
  validate();
  isDescDialogVisible.value = false;
}

watchEffect(async () => {
  if (props.template) {
    allAttachments.value = props?.template?.attachments as Attachment[];
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <form :key="formKey" class="col-12">
    <div class="col-12">
      <div class="p-datatable p-component p-datatable-responsive-scroll">
        <div class="p-datatable-wrapper overflow-x-auto">
          <table
            class="bulk-create-table p-datatable-table w-full"
            role="table"
            cellspacing="0"
            cellpadding="0"
          >
            <thead class="bg-gray-50 p-datatable-thead" role="rowgroup">
              <tr>
                <th role="cell" :style="tableCellStyles">
                  Type <span class="text-red-500">*</span>
                </th>
                <th
                  class="text-center"
                  role="cell"
                  :style="{ minWidth: '10rem' }"
                >
                  Subject <span class="text-red-500">*</span>
                </th>
                <th role="cell" class="text-xl text-center">
                  <i
                    v-tooltip.top="'Attachments'"
                    class="pi pi-paperclip text-xl"
                  />
                </th>
                <th role="cell" class="text-center">
                  Body <span class="text-red-500">*</span>
                </th>
                <th role="cell" :style="tableActionStyles">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              ref="serviceTbody"
              class="p-datatable-tbody relative"
              role="rowgroup"
            >
              <template v-for="(field, idx) in messagesFields" :key="field.key">
                <tr
                  role="row"
                  class="relative"
                  :class="[
                    {
                      'border-red-400 border-2': (
                        field.value as unknown as EmptyRecord
                      ).error,
                    },
                  ]"
                >
                  <td
                    role="cell"
                    valign="top"
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error
                          && isMedium,
                      },
                    ]"
                  >
                    <VField
                      :id="`type_${idx}`"
                      v-slot="{ handleChange, value, validate }"
                      :name="`messages[${idx}].type`"
                    >
                      <Dropdown
                        class="w-full"
                        :model-value="value"
                        :options="typeOptions"
                        option-label="name"
                        option-value="value"
                        placeholder="Select a Type"
                        :disabled="true"
                        @update:model-value="handleChange"
                        @blur="validate()"
                        @change="
                          removeFieldError(field as unknown as Ref<EmptyRecord>)
                        "
                      />
                    </VField>
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="messageValues"
                        :values="messageErrors"
                        :error-key="`messages[${idx}].type`"
                      />
                    </transition>
                    <div
                      v-if="(field.value as unknown as EmptyRecord).error"
                      class="p-error api-error"
                    >
                      {{ (field.value as unknown as EmptyRecord).error }}
                    </div>
                  </td>
                  <td
                    role="cell"
                    :style="{ minWidth: '10rem' }"
                    class="text-center"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error
                          && isMedium,
                      },
                    ]"
                  >
                    <!-- <VField
                      :id="`messages[${idx}].subject`"
                      :name="`messages[${idx}].subject`"
                      class="w-full"
                      :as="InputText"
                      placeholder="Enter Subject"
                      @input="
                        removeFieldError(field as unknown as Ref<EmptyRecord>)
                      "
                      :disabled="
                        (field.value as unknown as EmptyRecord).isAllDisabled
                      "
                    />
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="messageErrors"
                        :values="messageValues"
                        :errorKey="`messages[${idx}].subject`"
                      />
                    </transition>
                    <div
                      class="p-error api-error"
                      v-if="(field.value as unknown as EmptyRecord).error"
                    >
                      {{ (field.value as unknown as EmptyRecord).error }}
                    </div> -->
                    <a
                      href=""
                      tabindex="0"
                      class="underline font-medium"
                      :class="
                        (field.value as unknown as EmptyRecord).isAllDisabled
                          ? 'pointer-events-none opacity-50'
                          : ''
                      "
                      @click.prevent="
                        prepareForMessage(
                          field.value as unknown as EmptyRecord,
                          'Subject',
                        )
                      "
                    >
                      {{
                        (field.value as EmptyRecord)?.subject
                          ? 'View / Edit'
                          : 'Add'
                      }}
                    </a>
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="messageErrors"
                        :values="messageValues"
                        :error-key="`messages[${idx}].subject`"
                      />
                    </transition>
                    <!-- <Button
                      :icon="
                        getSubjectButtonIconTooltip(
                          field.value as unknown as EmptyRecord
                        ).icon
                      "
                      label="Subject"
                      class="p-button-sm"
                      @click="
                        prepareForMessage(
                          field.value as unknown as EmptyRecord,
                          'Subject'
                        )
                      "
                      :disabled="
                        (field.value as unknown as EmptyRecord).isAllDisabled
                      "
                      v-tooltip.top="
                        getSubjectButtonIconTooltip(
                          field.value as unknown as EmptyRecord
                        ).tooltip
                      "
                    /> -->
                  </td>
                  <td class="text-center" :style="{ minWidth: '10rem' }">
                    <label
                      :for="`report-to${idx}`"
                      :class="isMedium ? 'hidden' : 'block'"
                    ><i class="pi pi-paperclip text-xl" /></label>
                    <template v-if="allAttachments?.length > 0">
                      <a
                        href=""
                        tabindex="0"
                        class="underline font-medium"
                        :class="
                          (field.value as unknown as EmptyRecord).isAllDisabled
                            ? 'pointer-events-none opacity-50'
                            : ''
                        "
                        @click.prevent="prepareAttachmentsList()"
                      >{{
                        allAttachments?.length > 1
                          ? `${allAttachments?.length} documents`
                          : `${allAttachments?.length} document`
                      }}
                        attached</a>
                      <span class="inline-block mx-1">/</span>
                      <a
                        href=""
                        tabindex="0"
                        class="underline font-medium"
                        :class="
                          (field.value as unknown as EmptyRecord).isAllDisabled
                            ? 'pointer-events-none opacity-50'
                            : ''
                        "
                        @click.prevent="prepareForAttachment()"
                      >Attach More</a>
                    </template>
                    <template v-else>
                      <a
                        href=""
                        tabindex="0"
                        class="underline font-medium"
                        :class="
                          (field.value as unknown as EmptyRecord).isAllDisabled
                            ? 'pointer-events-none opacity-50'
                            : ''
                        "
                        @click.prevent="prepareForAttachment()"
                      >Attach</a>
                    </template>
                  </td>
                  <td
                    role="cell"
                    class="text-center"
                    :style="{ minWidth: '10rem' }"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error
                          && isMedium,
                      },
                    ]"
                  >
                    <div class="w-full">
                      <a
                        href=""
                        tabindex="0"
                        class="underline font-medium"
                        :class="
                          (field.value as unknown as EmptyRecord).isAllDisabled
                            ? 'pointer-events-none opacity-50'
                            : ''
                        "
                        @click.prevent="
                          prepareForMessage(
                            field.value as unknown as EmptyRecord,
                            'Message',
                          )
                        "
                      >
                        {{
                          (field.value as EmptyRecord)?.body
                            ? 'View / Edit'
                            : 'Add'
                        }}
                      </a>
                      <transition mode="out-in" name="field-slide-down">
                        <FormFeedbackMessage
                          :errors="messageErrors"
                          :values="messageValues"
                          :error-key="`messages[${idx}].body`"
                        />
                      </transition>
                      <!-- <Button
                        :icon="
                          getBodyButtonIconTooltip(
                            field.value as unknown as EmptyRecord
                          ).icon
                        "
                        label="Message"
                        class="p-button-sm"
                        @click="
                          prepareForMessage(
                            field.value as unknown as EmptyRecord,
                            'Message'
                          )
                        "
                        :disabled="
                          (field.value as unknown as EmptyRecord).isAllDisabled
                        "
                        v-tooltip.top="
                          getBodyButtonIconTooltip(
                            field.value as unknown as EmptyRecord
                          ).tooltip
                        "
                      /> -->
                    </div>
                  </td>
                  <td
                    role="cell"
                    valign="top"
                    :style="tableActionStyles"
                    class="text-right md:text-left"
                  >
                    <Button
                      v-tooltip="
                        getButtonIconTooltip(
                          field.value as unknown as EmptyRecord,
                        ).tooltip
                      "
                      type="button"
                      :icon="
                        createIsLoading
                          ? 'pi pi-spin pi-spinner'
                          : `${
                            getButtonIconTooltip(
                              field.value as unknown as EmptyRecord,
                            ).icon
                          }`
                      "
                      class="p-button-sm p-button-rounded mr-2"
                      :disabled="!isFalsy(messageErrors)"
                      @click="
                        (field.value as unknown as EmptyRecord).isAllDisabled
                          ? ((
                            field.value as unknown as EmptyRecord
                          ).isAllDisabled = false)
                          : handleCreateEdit(
                            field.value as unknown as EmptyRecord,
                          )
                      "
                    />
                    <Button
                      v-if="idx === messagesFields.length - 1"
                      icon="pi pi-plus"
                      aria-label="add-record"
                      class="p-button-sm p-button-rounded p-button-primary mr-2"
                      disabled
                    />
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      aria-label="delete-record"
                      class="p-button-sm p-button-rounded p-button-danger"
                      :class="{
                        '': !(field.value as unknown as EmptyRecord).id,
                      }"
                      disabled
                    />
                  </td>
                </tr>
                <tr
                  v-if="(field.value as unknown as EmptyRecord).isSubjectEditor"
                >
                  <td colspan="5">
                    <VField
                      id="messages"
                      v-slot="{ handleChange, value }"
                      :name="`messages[${idx}].subject`"
                      class="w-full mx-auto"
                    >
                      <Editor
                        :model-value="`${value}`"
                        :editor-style="{ height: '10rem' }"
                        :modules="EditorModules"
                        @update:model-value="handleChange"
                        @text-change="(e) => handleChange(e.htmlValue, true)"
                      >
                        <template #toolbar>
                          <span class="ql-formats">
                            <select
                              v-if="
                                EditorModules.placeholder.placeholders?.length
                              "
                              class="ql-placeholder"
                            >
                              <option value="" class="hide-item" />
                              <option
                                v-for="option in EditorModules.placeholder
                                  .placeholders"
                                :key="option.id"
                                :value="option.id"
                              >
                                {{ option.label }}
                              </option>
                            </select>
                          </span>
                        </template>
                      </Editor>
                      <transition mode="out-in" name="field-slide-down">
                        <FormFeedbackMessage
                          :errors="messageErrors"
                          :values="messageValues"
                          :error-key="`messages[${idx}].subject`"
                        />
                      </transition>
                      <div
                        v-if="(field.value as unknown as EmptyRecord).error"
                        class="p-error api-error"
                      >
                        {{ (field.value as unknown as EmptyRecord).error }}
                      </div>
                    </VField>
                  </td>
                </tr>
                <tr v-if="(field.value as unknown as EmptyRecord).isEditor">
                  <td colspan="5">
                    <VField
                      id="messages"
                      v-slot="{ handleChange, value }"
                      :name="`messages[${idx}].body`"
                      class="w-full mx-auto"
                    >
                      <Editor
                        :model-value="`${value}`"
                        :editor-style="{ height: '10rem' }"
                        :modules="EditorModules"
                        @update:model-value="handleChange"
                        @text-change="(e) => handleChange(e.htmlValue, true)"
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
                              v-if="
                                EditorModules.placeholder.placeholders?.length
                              "
                              class="ql-placeholder"
                            >
                              <option value="" class="hide-item" />
                              <option
                                v-for="option in EditorModules.placeholder
                                  .placeholders"
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
                            <button
                              class="ql-list"
                              value="ordered"
                              type="button"
                            />
                            <button
                              class="ql-list"
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
                            <button class="ql-link" type="button" />
                            <button class="ql-image" type="button" />
                            <button class="ql-video" type="button" />
                            <button
                              class="ql-code-block"
                              type="button"
                            />
                          </span>
                          <span class="ql-formats">
                            <button class="ql-clean" type="button" />
                          </span>
                        </template>
                      </Editor>
                      <transition mode="out-in" name="field-slide-down">
                        <FormFeedbackMessage
                          :errors="messageErrors"
                          :values="messageValues"
                          :error-key="`messages[${idx}].body`"
                        />
                      </transition>
                      <div
                        v-if="(field.value as unknown as EmptyRecord).error"
                        class="p-error api-error"
                      >
                        {{ (field.value as unknown as EmptyRecord).error }}
                      </div>
                    </VField>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </form>
  <div class="mt-2">
    <Button
      label="Back"
      class="max-w-max font-medium p-button-text"
      icon="pi pi-chevron-left"
      @click="emit('back', 'message')"
    />
  </div>

  <Dialog
    v-model:visible="attachDialog"
    :modal="true"
    append-to="body"
    :header="
      uploadFromDesktopDialog
        ? 'Upload from Desktop'
        : isGalleryMoveDialog
          ? 'Select from Gallery'
          : 'How would you like to attach?'
    "
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
    @hide="closeAttachmentDialog"
  >
    <div
      v-if="!uploadFromDesktopDialog && !isGalleryMoveDialog"
      class="text-center"
    >
      <Button v-if="canDo('gallery', 'list')" class="mr-3" @click="isGalleryMoveDialog = true">
        Select from Gallery
      </Button>
      <Button @click="uploadFromDesktopDialog = true">
        Upload from Desktop
      </Button>
    </div>
    <template v-if="uploadFromDesktopDialog">
      <p class="mb-2">
        Supported formats: jpeg, jpg, pdf, doc, docx, xls, xlsx, ppt, pptx, txt,
        csv.
        <br>Max size: 5MB.
      </p>
      <CommonFileUpload
        ref="uploadFileRef"
        name="uploadFileRef"
        custom-upload
        :multiple="true"
        :max-file-size="5000000"
        accept="application/pdf, image/png, image/jpeg, image/jpeg, image/gif, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, text/plain, text/csv"
        @uploader="(files: UploadFilesPayload) => uploadFiles(files)"
      >
        <template #empty>
          <p>Drag and drop files to here to upload.</p>
        </template>
      </CommonFileUpload>
      <Button
        label="Back"
        icon="pi pi-chevron-left"
        class="max-w-max p-button-text mt-3"
        @click="uploadFromDesktopDialog = false"
      />
    </template>

    <CommonGalleryFileTree
      v-if="isGalleryMoveDialog"
      @back="isGalleryMoveDialog = false"
      @files-selected="uploadFiles"
    />
  </Dialog>

  <Dialog
    v-model:visible="attachmentsListDialog"
    :modal="true"
    append-to="body"
    header="Attachments"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
  >
    <ol
      v-if="allAttachments.length"
      class="project-clients-list pl-3 p-0 m-0 formgrid"
    >
      <li v-for="(item, index) in allAttachments" :key="index" class="col py-1">
        <div class="flex">
          <a
            :href="getAttachmentUrl(item.path)"
            target="_blank"
            class="flex flex-1 align-items-center font-medium cursor-pointer text-gray-900 hover:text-gray-600"
          >
            {{ item.name }}
          </a>
          <Button
            type="button"
            :icon="
              removingAttachment && attachmentToRemove?.id === item.id
                ? 'pi pi-spin pi-spinner'
                : 'pi pi-trash'
            "
            aria-label="remove-attachment"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="prepareRemoveAttachment(index, item)"
          />
        </div>
      </li>
    </ol>
    <template v-else>
      No attachments available
    </template>
  </Dialog>

  <CommonConfirmRemoveDialog
    v-if="attachmentToRemove && confirmRemoveAttachmentDialog"
    :visible="confirmRemoveAttachmentDialog"
    :record-to-remove="attachmentToRemove as unknown as Record<string, unknown>"
    title="Confirm Delete Attachment"
    @confirm="handleRemoveAttachment(attachmentToRemove.index)"
    @hide="confirmRemoveAttachmentDialog = false"
  />
  <Dialog
    v-model:visible="isDescDialogVisible"
    :modal="true"
    append-to="body"
    :header="`Add/Update ${selectedTemplateFieldType}`"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
    @hide="isDescDialogVisible = false"
  >
    <BroadcastAddSubjectMessageForm
      :current-message="
        selectedTemplateMessage
          && (selectedTemplateMessage[
            `${selectedTemplateFieldType === 'Message' ? 'body' : 'subject'}`
          ] as string)
      "
      :field-label="selectedTemplateFieldType"
      @success="handleMessage"
    />
  </Dialog>
</template>

<style lang="scss" scoped></style>
