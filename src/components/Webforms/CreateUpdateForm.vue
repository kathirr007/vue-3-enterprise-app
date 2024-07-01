<script setup lang="ts">
import type {
  Webform,
  WebformCreatePayload,
  WebformType
} from '@/types/webforms.type';
import {
  WebformStatus,
  webformTemplateCreatePayloadSchema
} from '@/types/webforms.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useMutation } from 'vue-query';
import Editor from 'primevue/editor';
import type { UploadFilesPayload } from '@/types/common.type';
import type { Attachment, AttachmentResponse } from '@/types/attachment.type';

const props = defineProps<{
  webformType: WebformType;
  webformDetails?: Webform;
  isFromClient?: boolean;
  isFromTemplate?: boolean;
  isRequestUpdate?: boolean;
  hideAttachment?: boolean;
  isCreateTemplate?: boolean;
}>();

const emit = defineEmits<{
  (e: 'success', data: Webform): void;
  (e: 'update', isRequestUpdate?: boolean): void;
  (e: 'back'): void;
}>();

const clientDetails = inject<any>('clientDetails', () => null);

const { isPortalUser } = useCurrentUserData();
const {
  createOne,
  update: updateWebform,
  getAttachmentIds
} = useWebformTemplates();
const { createOne: createClientWebform, update: updateClientWebform }
  = useWebforms();
const { uploadFileRef, onUpload } = useAttachments();

const fileData = ref<UploadFilesPayload>();
const formRef = ref<SchemaFormRef>();

const disableSubmit = computed(() => {
  return props.webformDetails || props.webformType === 'ORGANIZER'
    ? false
    : fileData.value === undefined
      ? true
      : fileData.value.files.length === 0 && formRef.value?.meta?.valid;
});

async function handleOnUpload(data: UploadFilesPayload) {
  fileData.value = data;
}

const { mutateAsync: createUpdateWebform, isLoading: createIsLoading }
  = useMutation(
    (payload: Partial<Webform>) => {
      if (props.webformDetails && !props.isCreateTemplate) {
        if (props.webformDetails.isClientWebform) {
          return updateClientWebform({
            id: props.webformDetails.id,
            payload: payload as Partial<Webform>
          });
        }
        if (!props.isFromClient) {
          return updateWebform({
            id: props.webformDetails.id,
            payload: payload as Partial<Webform>
          });
        }
      }
      return props.isFromClient
        ? createClientWebform(payload as WebformCreatePayload)
        : createOne(payload);
    },
    {
      onSuccess: (data: Webform) => {
        if (
          props.webformDetails
          && !props.isFromClient
          && !props.isCreateTemplate
        ) {
          emit('update', props.isRequestUpdate);
        }
        else {
          emit('success', data);
        }
      }
    }
  );

const formData: SchemaForm = {
  fields: [
    {
      as: InputText,
      name: 'name',
      label: 'Name',
      required: true,
      autocomplete: 'off',
      hide: props.isRequestUpdate
    },
    {
      as: Textarea,
      name: 'description',
      label: 'Description',
      rows: 4,
      hide: props.isRequestUpdate
    },
    {
      // as: Textarea,
      name: 'attachments',
      type: 'file',
      label: 'Contract Document',
      showSlot: true,
      hide:
        props.isRequestUpdate || props.isFromTemplate || props.hideAttachment
    },
    {
      as: Editor,
      type: 'editor',
      name: 'instructions',
      label: 'Update Instructions',
      editorStyle: 'height: 160px',
      hide: !props.isRequestUpdate
    }
  ],
  validationSchema: webformTemplateCreatePayloadSchema,
  initialValues: props.webformDetails
    ? {
        ...props.webformDetails,
        name: `${props.isFromTemplate ? 'Copy of ' : ''}${
          props.webformDetails.name
        }`
      }
    : undefined,
  btnText:
    props.webformDetails && !props.isFromTemplate
      ? 'Update'
      : 'Submit',
  secondaryBtnText:
    props.isFromClient || props.isFromTemplate ? 'Back' : 'Cancel'
};

async function onSubmit(values: Record<string, any>) {
  const attachments: Attachment[] = props.webformDetails?.attachments
    ? (props.webformDetails.attachments as Attachment[])
    : [];
  const previousInstantJSON = props.webformDetails?.documentMeta?.instantJSON;

  const payload = {
    ...props.webformDetails,
    name: values.name,
    description: values.description,
    type: props.webformDetails?.type || props.webformType,
    attachments: attachments?.length
      ? (getAttachmentIds(attachments as Attachment[]) as string[])
      : []
  } as Partial<Webform>;
  if (previousInstantJSON) {
    payload.documentMeta = {
      instantJSON: { ...toRaw(previousInstantJSON) }
    };
  }
  if (props.isFromClient && clientDetails.value) {
    payload.clientId = clientDetails.value?.id;
  }
  if (props.isRequestUpdate) {
    payload.instructions = values.instructions;
    payload.status = WebformStatus['Update Requested'];
  }
  if (props.webformType === 'CONTRACT' && fileData.value) {
    const uploadedFiles = await onUpload({
      payload: fileData.value
    });
    const fileIds = uploadedFiles?.map((file: AttachmentResponse) => file.id);
    payload.attachments = fileIds;
  }
  await createUpdateWebform(payload);
}
</script>

<template>
  <CommonSchemaForm
    :data="formData"
    :disable-submit="disableSubmit"
    :primary-btn-loading="createIsLoading"
    @submit="onSubmit"
    @secondary-btn-click="emit('back')"
  >
    <template
      v-if="webformType === 'CONTRACT' && !isRequestUpdate"
      #attachments="{ ...attrs }"
    >
      <div class="field mt-2">
        <label for="files" class="block font-medium text-900">
          <span>{{ attrs.label }} <span class="text-red-500">*</span></span>
        </label>
        <p class="mb-2">
          Supported formats: pdf.
          <br>Max size: 20MB.
        </p>

        <CommonFileUpload
          ref="uploadFileRef"
          name="fileUploads"
          :is-portal-user="isPortalUser"
          custom-upload
          :max-file-size="20000000"
          :show-upload-button="false"
          accept="application/pdf"
          @select="(files: UploadFilesPayload) => handleOnUpload(files)"
        >
          <template #empty>
            <p>Drag and drop files to here to upload.</p>
          </template>
        </CommonFileUpload>
      </div>
    </template>
  </CommonSchemaForm>
</template>
