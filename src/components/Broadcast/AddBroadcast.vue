<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import type {
  Attachment,
  AttachmentContentType,
  AttachmentExtension,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';
import type {
  Broadcast,
  BroadcastTemplate,
  BroadcastTemplateMessage,
  BroadcastTypePayload,
  CreateBroadcast
} from '@/types/broadcast.type';
import type { MailsAttachmentResponse } from '@/types/inbox.type';
import { BroadcastTypeSchema } from '@/types/broadcast.type';
import type {
  EditorPlaceholderOption,
  EditorPlaceholderScope,
  Step,
  UploadFilesPayload
} from '@/types/common.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import RadioButton from 'primevue/radiobutton';
import Textarea from 'primevue/textarea';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { FAQ, Source } from '@/types/knowlege-base.type';

const props = defineProps<{
  broadcast?: Broadcast;
  currentOp?: string;
  isFromKnowledgebot?: boolean;
  knowledgeBaseMessage?: FAQ;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'back'): void;
  (e: 'modalClose'): void;
}>();

const broadcastTo = inject<string>('broadcastTo', '');

const { defaultBreakpoints } = useCommonBreakPoints();
const {
  isInbox,
  uploadFileRef,
  fileSelected,
  attachmentRes,
  onUpload,
  createAttachment,
  getAttachment,
  getAttachmentUrl
} = useAttachments();
const router = useRouter();
const queryClient = useQueryClient();
const { initToast } = useToasts();
const { canDo } = usePermissions();
const {
  broadcast,
  currentOp,
  knowledgeBaseMessage: knowledgeBaseMessageProp
} = toRefs(props);
const templateOptions = [
  { name: 'manual', value: 'manual', radioLabel: 'Create from scratch' },
  { name: 'template', value: 'template', radioLabel: 'Use Templates' }
];
const typeOptions = [
  { name: 'Mobile', value: 'MOBILE' },
  { name: 'Email', value: 'EMAIL' }
];

const { getAll } = useFromEmail();
const { getBroadcastTemplates } = useCommonListQueries();
const { getPlaceholderOptions } = useCustomEditor();
const { replaceNewlines } = useUtilityFns();

const { data: templateList, isLoading: gettingTemplates }
  = getBroadcastTemplates({
    key: 'broadcast-templates-list-with-messages',
    channel: 'EMAIL'
  });

const formKey = ref(0);
const formRef = ref<SchemaFormRef>();
const broadcastAttachmentsRef = ref<Record<string, any>>();
const attachDialog = ref(false);
const confirmRemoveAttachmentDialog = ref(false);
const showTypeSelection = ref(true);
const instance = getCurrentInstance();
const selectedRadioValue = ref('manual');
const selectedTemplate = ref<BroadcastTemplate>();
const submitValues = ref<BroadcastTypePayload>();
const fetchedTemplate = ref<BroadcastTemplate>();
const currentAttachmentRes = ref<AttachmentResponse[]>([]);
const isTemplateHidden = ref(true);
const attachmentsListDialog = ref(false);
const isGalleryMoveDialog = ref(false);
const uploadFromDesktopDialog = ref(false);
const uploadingGalleryFiles = ref(false);
const allAttachmentsIds = ref([]);
const currentAttachmentRef = ref<{
  index: number;
  isUpdate?: boolean;
}>();
const attachmentToRemove = ref<
  Pick<Attachment, 'id' | 'name'> & { index: number }
>();
const uploadedFiles = ref<File[]>([]);
const allAttachments = ref<Attachment[]>([]);

function prepareForAttachment() {
  attachDialog.value = true;
}

function handleRemoveAttachment(index: number) {
  allAttachments.value.splice(index, 1);
}

function prepareRemoveAttachment(index: number,
  data: Pick<Attachment, 'id' | 'name'>) {
  attachmentToRemove.value = { ...data, index };
  // attachmentToRemove.value = { ...data };
  confirmRemoveAttachmentDialog.value = true;
}

function prepareAttachmentsList() {
  // emit('showAttachments', data);
  attachmentsListDialog.value = true;
}

const { mutateAsync: broadcastAttachments } = useMutation(
  async (data: { payload: CreateAttachment; file: UploadFilesPayload }) => {
    return createAttachment({
      payloadData: data,
      showToast: false,
      fileUploadRef: broadcastAttachmentsRef
    });
  },
  {
    onSuccess: (data: { res: AttachmentResponse; file: File }) => {
      uploadedFiles.value.push(data.file);
      attachmentRes.value?.push(data.res);
      currentAttachmentRes.value?.push(data.res);
    }
  }
);

async function makeParallelAPIReq(payloadArr: File[]) {
  if (payloadArr.length === 0) {
    return;
  }
  await Promise.allSettled(
    payloadArr.map(async (item) => {
      fileSelected.value = item;
      const payload: CreateAttachment = {
        filename: item.name,
        contentType: item.type as unknown as AttachmentContentType,
        extension: item.name.split('.').pop() as unknown as AttachmentExtension,
        contentLength: item.size
      };
      await broadcastAttachments({ payload, file: fileSelected.value });
    })
  );
}

function prepareAttachmentFromGallery() {
  isGalleryMoveDialog.value = true;
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
  const uploadResults = await onUpload({ payload: value });
  await updateAttachmentValues(uploadResults as MailsAttachmentResponse[]);
  closeAttachmentDialog();
}

async function handleGalleryFiles(files: MailsAttachmentResponse[]) {
  await updateAttachmentValues(files);
  closeAttachmentDialog();
  initToast({
    actionType: 'Create',
    summary: 'Attach files from the gallery',
    detail: `Selected files attached to the email successfully`
  });
}

const { data: fromEmailList } = useQuery('fromemail-list', () => {
  return getAll();
});

const { data: template, isFetching: fetchingTemplate } = useQuery(
  'broadcast-template',
  () => {
    return selectedTemplate.value
      ? useBroadcastTemplate(selectedTemplate.value?.id as string)
      : undefined;
  },
  {
    onSuccess: (data) => {
      if (data) {
        formRef.value?.setValues({
          ...formRef.value?.schemaFormValues,
          body: (data.messages as BroadcastTemplateMessage[])[0].body,
          subject: (data.messages as BroadcastTemplateMessage[])[0].subject
        });
        allAttachments.value = data.attachments as Attachment[];
      }
    }
  }
);

const { data: placeholderOptions, isFetching: fetchingPlaceholders } = useQuery(
  ['editor-placeholders'],
  () => {
    const placeholderScope = `${(
      broadcastTo as string
    ).toUpperCase()}_BROADCAST`;
    return getPlaceholderOptions(placeholderScope as EditorPlaceholderScope);
  }
);

const smtpEmail = computed(() => {
  const firstEmail = fromEmailList.value?.[0];
  return firstEmail && firstEmail.isVerified === true ? firstEmail.email : null;
});

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

function getHTMLString(data: FAQ) {
  const isSomeSourceUrl = () => {
    return data.sources?.some(
      source => source.document_metadata?.attributes?.source_url
    );
  };
  const getSourcesHTMLString = (sources: Source[]) => {
    return `
            <h4 class="m-0">Sources:</h4>
            ${sources
              .map(
                (source: Source) => `
                <p>
                  &bullet; <a
                    href="${source.document_metadata?.attributes?.source_url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-500 hover:underline inline-block"
                  >${source.document_metadata?.attributes?.source_url}</a>
                </p>
                `
              )
              .join('\n')}
            <p>&nbsp;</p>
          `;
  };
  const htmlString = isSomeSourceUrl()
    ? `${getSourcesHTMLString(data.sources)} ${replaceNewlines(data.answer)}`
    : `${replaceNewlines(data.answer)}`;

  return htmlString;
}

const formData = computed<SchemaForm>(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'name',
        label: 'Name',
        required: true,
        placeholder: 'Enter name'
      },
      {
        as: Textarea,
        name: 'description',
        label: 'Description',
        placeholder: 'Enter Description',
        rows: 6
      },
      {
        as: Dropdown,
        type: 'dropdown',
        label: 'Channel',
        name: 'channel',
        options: typeOptions,
        optionLabel: 'name',
        optionValue: 'value',
        disabled: true,
        required: true,
        hide: true
      },
      {
        as: RadioButton,
        type: 'radio',
        label: 'Email Type',
        name: 'type',
        required: true,
        options: templateOptions,
        formGridClass: 'md:col-6',
        disabled: props.isFromKnowledgebot
      },
      {
        as: Dropdown,
        type: 'dropdown',
        required: true,
        label: 'Templates',
        name: 'templates',
        placeholder: 'Select Template',
        optionLabel: 'name',
        optionValue: 'id',
        hide: isTemplateHidden.value,
        loading: gettingTemplates.value || fetchingTemplate.value
      },
      {
        type: 'editor',
        // as: InputText,
        name: 'subject',
        label: 'Subject',
        required: true,
        placeholder: 'Enter Subject',
        editorStyle: 'height: 50px',
        modules: EditorModules.value,
        rows: 6,
        placeholderOptions: EditorModules.value.placeholder.placeholders,
        showSlot: true
      },
      {
        type: 'editor',
        name: 'body',
        label: 'Message',
        placeholder: 'Enter Message',
        editorStyle: 'height: 160px',
        required: true,
        rows: 6,
        modules: EditorModules.value,
        placeholderOptions: EditorModules.value.placeholder.placeholders,
        showSlot: true
      },
      {
        name: 'attachments',
        label: 'Attachments',
        multiple: true,
        showSlot: true
      }
    ],
    btnText: 'Next',
    validationSchema: BroadcastTypeSchema,
    initialValues: {
      channel: 'EMAIL',
      type: 'manual',
      name: knowledgeBaseMessageProp?.value
        ? knowledgeBaseMessageProp.value.question
        : '',
      subject: knowledgeBaseMessageProp?.value
        ? knowledgeBaseMessageProp.value.question
        : '',
      body: knowledgeBaseMessageProp?.value
        ? getHTMLString(knowledgeBaseMessageProp.value)
        : ''
    },
    secondaryBtnText: 'Back'
  };
});
const { updateOptions, findFormIndex, updateFieldProp }
  = useSchemaForm(formData);

async function handleRadioClick(val: BroadcastTypePayload) {
  const radioValue = { ...val }.type;
  selectedRadioValue.value = radioValue;
  if (radioValue === 'template') {
    const templateIndex: number = findFormIndex('templates');
    isTemplateHidden.value = false;
    const filteredTemplateList = ref<BroadcastTemplate[]>([]);
    if (templateList.value && templateList.value.results.length) {
      filteredTemplateList.value = templateList.value?.results.filter(
        (template: BroadcastTemplate) =>
          template.isInternal === (broadcastTo === 'team')
      );
    }
    updateOptions(filteredTemplateList, templateIndex);
  }
  else {
    isTemplateHidden.value = true;
  }
}
function onSubmit(output: BroadcastTypePayload) {
  submitValues.value = {
    ...output,
    attachmentIds: allAttachments.value.map(item => item.id)
  };
  showTypeSelection.value = false;
}
async function handleBack(type: string,
  templateId: string,
  name: string,
  description: string,
  channel: string,
  body: string,
  subject: string) {
  showTypeSelection.value = true;
  setTimeout(() => {
    formRef.value?.setValues({
      type,
      templates: templateId,
      name,
      description,
      channel,
      body,
      subject
    });
  }, 100);

  await nextTick(() => {
    instance?.proxy?.$forceUpdate();
  });
}

function sendFirstStepPayload() {
  return {
    name: submitValues.value?.name,
    description: submitValues.value?.description,
    body:
      submitValues.value?.body
      || ((fetchedTemplate?.value?.messages as BroadcastTemplateMessage[])
        ? (fetchedTemplate?.value?.messages as BroadcastTemplateMessage[])[0]
            ?.body
        : undefined),
    subject:
      submitValues.value?.subject
      || ((fetchedTemplate?.value?.messages as BroadcastTemplateMessage[])
        ? (fetchedTemplate?.value?.messages as BroadcastTemplateMessage[])[0]
            ?.subject
        : undefined),
    type: submitValues?.value?.channel,
    attachmentIds: submitValues?.value?.attachmentIds
  };
}

const stepItems = computed(() => {
  const steps: Step[] = [
    {
      name: 'basic',
      label: `Compose`
    },
    {
      name: 'message',
      label: `Schedule`
    }
  ];
  return steps;
});

function routeToList() {
  if (!props.isFromKnowledgebot) {
    router.push({
      name: 'admin-broadcasts-type',
      params: { type: broadcastTo },
      query: { activeIndex: '0' }
    });
  }
  emit('back');
}

function handleTemplateChange(val: Record<string, any>) {
  selectedTemplate.value = templateList.value?.results.find(
    (template: BroadcastTemplate) => template.id === val.templates
  );
  queryClient.invalidateQueries('broadcast-template', { exact: true });
}

watchEffect(() => {
  if (templateList.value) {
    const templateIndex: number = findFormIndex('templates');
    const filteredTemplateList = ref(
      templateList.value?.results.filter(
        (template: BroadcastTemplate) =>
          template.isInternal === (broadcastTo === 'team')
      )
    );
    updateOptions(filteredTemplateList, templateIndex);
  }
  if (broadcast?.value) {
    showTypeSelection.value = false;
  }
});
</script>

<template>
  <div :class="{ 'md:w-8 xl:w-6 mx-auto': !props.broadcast }">
    <CommonSteps
      v-if="!props.broadcast"
      id="abc"
      readonly
      :items="stepItems"
      class="mb-4"
      :current="showTypeSelection ? 'basic' : 'message'"
    />
    <template v-if="showTypeSelection">
      <CommonLoading v-if="fetchingPlaceholders" />
      <div v-else>
        <Message
          v-if="smtpEmail"
          :closable="false"
          severity="info"
          class="mt-1 p-custom-message"
        >
          Please note email will be sent from
          <span class="font-semibold">{{ smtpEmail }}</span>
        </Message>
        <CommonSchemaForm
          ref="formRef"
          :key="formKey"
          :data="formData"
          is-editor-placeholder
          is-image-placeholder
          @radio-click="(() => handleRadioClick)()"
          @submit="(() => onSubmit)()"
          @secondary-btn-click="routeToList"
          @dropdown-change="handleTemplateChange"
        >
          <template #attachments="{ ...attrs }">
            <label class="block font-medium text-900">
              {{ attrs.label }}
            </label>
            <div class="field mt-2">
              <template v-if="allAttachments?.length > 0">
                <a
                  href=""
                  tabindex="0"
                  class="underline font-medium"
                  @click.prevent="prepareAttachmentsList()"
                >
                  {{
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
                  @click.prevent="prepareForAttachment()"
                >Attach More</a>
              </template>
              <template v-else>
                <a
                  href=""
                  tabindex="0"
                  class="underline font-medium"
                  @click.prevent="prepareForAttachment()"
                >Attach</a>
              </template>
            </div>
          </template>

          <template #subject="{ ...attrs }">
            <div class="field mb-0">
              <label class="block font-medium text-900">
                {{ attrs.label }}
                <span class="text-red-500">*</span>
              </label>
              <VField v-slot="{ handleChange, value, validate }" name="subject">
                <Editor
                  :model-value="`${value || ''}`"
                  :editor-style="{ height: '10rem' }"
                  :modules="EditorModules"
                  v-bind="attrs"
                  @update:model-value="handleChange"
                  @text-change="(e: any) => handleChange(e.htmlValue, true)"
                  @blur="validate()"
                >
                  <template #toolbar>
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
                </Editor>
              </VField>
              <transition mode="out-in" name="field-slide-down">
                <FormFeedbackMessage
                  :errors="(attrs.errors as ComputedRef).value"
                  :values="(attrs.values as ComputedRef).value"
                  error-key="subject"
                  :feedback="true"
                />
              </transition>
            </div>
          </template>

          <template #body="{ ...attrs }">
            <div class="field mb-0">
              <label class="block font-medium text-900">
                {{ attrs.label }}
                <span v-if="attrs.required" class="text-red-500">*</span>
              </label>
              <VField v-slot="{ handleChange, value, validate }" name="body">
                <Editor
                  :model-value="`${value || ''}`"
                  :editor-style="{ height: '10rem' }"
                  :modules="EditorModules"
                  v-bind="attrs"
                  @update:model-value="handleChange"
                  @text-change="(e: any) => {
                    handleChange(e.htmlValue, true);
                  }"
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
                        v-if="attrs.placeholderOptions?.length"
                        class="ql-placeholder"
                      >
                        <option value="" class="hide-item" />
                        <option
                          v-for="option in attrs.placeholderOptions"
                          :key="option.id"
                          :value="option.id"
                        >
                          {{ option.label }}
                        </option>
                      </select>
                    </span>
                    <span class="ql-formats">
                      <button aria-label="ql-bold" class="ql-bold" type="button" />
                      <button aria-label="ql-italic" class="ql-italic" type="button" />
                      <button aria-label="ql-underline" class="ql-underline" type="button" />
                    </span>
                    <span class="ql-formats">
                      <select class="ql-color" />
                      <select class="ql-background" />
                    </span>
                    <span class="ql-formats">
                      <button
                        aria-label="ql-list"
                        class="ql-list"
                        value="ordered"
                        type="button"
                      />
                      <button
                        aria-label="ql-list"
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
                      <button aria-label="ql-link" class="ql-link" type="button" />
                      <button aria-label="ql-image" class="ql-image" type="button" />
                      <button aria-label="ql-video" class="ql-video" type="button" />
                      <button aria-label="ql-code-block" class="ql-code-block" type="button" />
                    </span>
                    <span class="ql-formats">
                      <button aria-label="ql-clean" class="ql-clean" type="button" />
                    </span>
                  </template>
                </Editor>
              </VField>
              <div class="flex w-full justify-content-between mt-2">
                <transition mode="out-in" name="field-slide-down">
                  <FormFeedbackMessage
                    :errors="(attrs.errors as ComputedRef).value"
                    :values="(attrs.values as ComputedRef).value"
                    error-key="body"
                    :feedback="true"
                  />
                </transition>
                <CommonEditorRewrite
                  v-if="(attrs.values as any)?.type === 'manual'"
                  :form-ref="(formRef as SchemaFormRef)"
                  label="Re-write"
                  size="small"
                  class="max-w-max"
                  :disabled="!(attrs.values as any)?.body || (attrs.values as any)?.body.includes('{{')"
                  :tooltip="(attrs.values as any)?.body.includes('{{') ? 'To Rewrite email please remove shortcodes and try it out' : ''"
                  :editor-field-name="(attrs.name as string)"
                />
              </div>
            </div>
          </template>
        </CommonSchemaForm>
      </div>
    </template>
    <BroadcastCreateForm
      v-else
      :type="selectedRadioValue"
      :broadcast="
        broadcast
          ? (broadcast as CreateBroadcast)
          : (sendFirstStepPayload() as CreateBroadcast)
      "
      :template-id="
        broadcast?.template ? broadcast.template.id : selectedTemplate?.id
      "
      :current-op="currentOp"
      :is-create="!broadcast"
      :fetching-placeholders="fetchingPlaceholders"
      :editor-modules="EditorModules"
      @back="handleBack"
      @success="
        routeToList();
        emit('success');
      "
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
            icon="pi pi-trash"
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
    :record-to-remove="attachmentToRemove"
    title="Confirm Delete Attachment"
    @confirm="handleRemoveAttachment(attachmentToRemove.index)"
    @hide="confirmRemoveAttachmentDialog = false"
  />
</template>
