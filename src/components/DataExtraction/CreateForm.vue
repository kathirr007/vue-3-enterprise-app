<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import type { UploadFilesPayload } from '@/types/common.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import type { GetFolderDetails } from '@/types/documents.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import { ExtractionPayloadSchema } from '@/types/extraction.type';
import type { CreateExtractionPayload } from '@/types/extraction.type';
import dayjs from 'dayjs';
import type { AttachmentResponse } from '@/types/attachment.type';

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

const { currentUser, isPortalUser } = useCurrentUserData();
const { metaFilter } = useUtilityFns();
const { initToast } = useToasts();
const queryClient = useQueryClient();
const {
  uploadFileRef,
  uploadDialog,
  onUpload,
  clientId: clientIdAttachment,
  isDocument
} = useAttachments();
const { getUploadFolderDetails } = useDocuments();
const { createExtraction } = useExtraction();

const disableForm = ref(false);
const isClientSelected = ref(false);
const folderId = ref('');
const formRef = ref<SchemaFormRef>();

isDocument.value = true;
const { data: orgDetails, isLoading } = useQuery('org-data', () => {
  return useOrgDetails(isPortalUser.value, currentUser.value?.client?.org?.id);
});
const orgAISettings = computed(() => {
  return {
    enableExtraction: orgDetails?.value?.meta
      ? metaFilter(orgDetails.value.meta, 'enableExtraction') === 'true'
      : null,
    enableClassification: orgDetails?.value?.meta
      ? metaFilter(orgDetails?.value.meta, 'enableClassification') === 'true'
      : null
  };
});

const { data: filterDataClient, applyFilter: applyFilterClient }
  = useFilterColumns();
applyFilterClient('Is Active', 'true');
const clientFilters = useEncodeFilterData(filterDataClient);

const { data: clientList } = useQuery(['clients-list'], async () => {
  const clients = await useClientListV2({ filters: clientFilters });
  return clients.results;
});

const { mutateAsync: getFolderToUpload, isLoading: gettingFolderDetails }
  = useMutation(
    ['folder-to-upload'],
    (payload: GetFolderDetails) => {
      return getUploadFolderDetails({ payload });
    },
    {
      onSuccess: (data: any) => {
        folderId.value = data;
        disableForm.value = true;
      }
    }
  );

const {
  mutateAsync: createDocumentExtraction,
  isLoading: extractingDocuments
} = useMutation(
  ['create-extraction'],
  (createExtractionPayload: CreateExtractionPayload) => {
    return createExtraction(createExtractionPayload);
  },
  {
    onSuccess: (data: any) => {
      disableForm.value = false;
    }
  }
);

const formValues: Record<string, any> = [];
const isFromExtraction = true;
const extraction = {
  isFromExtraction,
  uploadFolderId: '',
  uploadClientId: ''
};
const fileData = ref<UploadFilesPayload>();

async function handleOnUpload(data: UploadFilesPayload) {
  fileData.value = data;
}

function getFinancialYears() {
  // const currentYear = new Date().getFullYear();
  const currentYear = dayjs().get('year');
  const financialYears = [];
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    const FinancialYear = {
      name: `${i}-${`${i + 1}`.slice(-2)}`,
      value: `${i}`
    };

    financialYears.push(FinancialYear);
  }

  financialYears.sort((a: any, b: any) => {
    return a.value - b.value;
  });

  return financialYears;
}

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'name',
        label: 'Name',
        required: true,
        autocomplete: 'off',
        placeholder: 'Name'
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'financialYear',
        label: 'Financial Year',
        autocomplete: 'off',
        placeholder: 'Financial Year',
        options: getFinancialYears() || [],
        optionLabel: 'name',
        optionValue: 'value',
        formGridClass: 'md:col-12'
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'clientId',
        label: `${$tConfig('CLIENT')}`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: `${$tConfig('CLIENT')}`,
        options: clientList.value || [],
        formGridClass: 'md:col-12'
      }
    ],
    btnText: 'Submit',
    secondaryBtnText: 'Cancel',
    validationSchema: ExtractionPayloadSchema,
    hideButtons: true
  } as SchemaForm;
});

const disableSubmit = computed(() => {
  return fileData.value === undefined
    ? true
    : fileData.value.files.length === 0 && formRef.value?.meta?.valid;
});

const submitLoading = computed(() => {
  return (
    gettingFolderDetails.value
    || (uploadFileRef as any)?.value?.isUploading
    || extractingDocuments.value
  );
});

async function onSubmit(values: Record<string, any>) {
  if (values.clientId) {
    isClientSelected.value = true;
  }
  else {
    isClientSelected.value = false;
  }
  formValues.value = values;
  folderId.value = await getFolderToUpload({
    name: formValues.value.name,
    clientId: formValues.value.clientId
  });
  if (fileData.value) {
    extraction.uploadClientId = formValues.value.clientId;
    extraction.uploadFolderId = folderId.value;
    const uploadedFiles = await onUpload({
      payload: fileData.value,
      isGalleryUpload: !isClientSelected.value,
      extraction,
      showToast: false
    });
    if (uploadedFiles?.length) {
      initToast({
        actionType: 'Add',
        summary: 'File Upload',
        detail: `Total <strong>${uploadedFiles?.length}</strong> File${
          uploadedFiles?.length > 1 ? 's' : ''
        } uploaded successfully`
      });
    }
    emit('cancel');

    const fileIds = uploadedFiles?.map((file: AttachmentResponse) => file.id);
    formValues.value.fileIds = fileIds;
  }

  await createDocumentExtraction({
    name: formValues.value.name,
    clientId: formValues.value.clientId,
    fileIds: formValues.value.fileIds,
    fy: formValues.value.financialYear
  });
  queryClient.invalidateQueries('extraction-list');
}

defineExpose({
  disableSubmit,
  formRef,
  disableForm
});
</script>

<template>
  <div
    :class="{
      'disabled-card': disableForm,
    }"
  >
    <CommonSchemaForm
      ref="formRef"
      :data="formData"
      :disable-submit="disableSubmit"
      :primary-btn-loading="submitLoading"
      @submit="onSubmit"
      @secondary-btn-click="emit('cancel')"
    >
      <div class="field mt-2 col-12">
        <label for="files" class="block font-medium text-900">
          <span>Files <span class="text-red-500">*</span></span>
        </label>
        <p class="mb-2">
          Supported formats: jpeg, jpg, png, pdf.
          <br>Max size: 20MB.
        </p>

        <CommonFileUpload
          ref="uploadFileRef"
          name="fileUploads"
          :is-portal-user="isPortalUser"
          custom-upload
          multiple
          is-from-extraction
          :max-file-size="20000000"
          :ai-settings="orgAISettings"
          is-document
          accept="application/pdf, image/png, image/jpeg, image/jpg"
          @select="(files: UploadFilesPayload) => handleOnUpload(files)"
        >
          <template #empty>
            <p>Drag and drop files to here to upload.</p>
          </template>
        </CommonFileUpload>
      </div>
    </CommonSchemaForm>
  </div>
</template>

<style scoped lang="scss">
.disabled-card {
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
