<script lang="ts" setup>
import type { Org, OrgCreatePayload } from '@/types/myaccount.type';
import { OrgCreatePayloadSchema } from '@/types/myaccount.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import Divider from 'primevue/divider';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Title from '../Form/Title.vue';
import Editor from 'primevue/editor';
import router from '@/router';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { FileObject, UploadFilesPayload } from '@/types/common.type';
import type {
  AttachmentContentType,
  AttachmentExtension,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';

const { initToast } = useToasts();
const { assignObj1ToObj2 } = useUtilityFns();
const {
  createAttachment,
  fileSelected,
  uploadFileRef,
  downloadFileAs,
  getAttachmentUrl
} = useAttachments();
const { getCountriesList, getStatesList } = useCommonListQueries();
const queryClient = useQueryClient();

const formValues = ref<Org>();
const formRef = ref<SchemaFormRef | null>(null);
const country = ref('');
const formKey = ref(0);

const { data: countriesList } = getCountriesList();

const countryEnabled = computed(() => !!country.value);

const { data: statesList } = getStatesList(
  country,
  countryEnabled,
  'states-list'
);

const { data: orgDetails, isLoading } = useQuery(
  'org-data',
  () => {
    return useOrgDetails();
  },
  {
    onSuccess: (data) => {
      formValues.value = data;
      country.value = data.country as string;
      updateFieldProp(
        'hide',
        regCertificatePreviewIndex,
        data.regCertificate === null
      );
      updateFieldProp(
        'label',
        regCertificateIndex,
        data.regCertificate !== null
          ? 'Update Certificate'
          : 'Registration Certificate'
      );
    }
  }
);

const { mutateAsync: createUpdateOrg, isLoading: updatingOrg } = useMutation(
  (payload: Partial<OrgCreatePayload>) => {
    return useOrgUpdate(payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Organization Details Update',
        detail: 'Organization Details updated successfully'
      });
    }
  }
);
const { mutateAsync: orgAttachments } = useMutation(
  async (data: { payload: CreateAttachment; file: UploadFilesPayload }) => {
    return createAttachment({
      payloadData: data,
      fileUploadRef: uploadFileRef,
      schemaFormRef: formRef.value?.schemaFormRefs
    });
  },
  {
    onSuccess: (data: { res: AttachmentResponse; file: File }) => {
      handlePostAttachment(data.res);
    }
  }
);

async function handlePostAttachment(data: AttachmentResponse) {
  const setOrgAttachment = (attachmentField: string) => {
    formRef.value?.setValues({
      ...formRef.value?.schemaFormValues,
      [attachmentField]: data.id
    });
  };
  uploadFileRef.value === 'logo-upload'
    ? setOrgAttachment('logo')
    : setOrgAttachment('regCertificate');

  await createUpdateOrg(createOrgPayload(formRef.value?.schemaFormValues));
  queryClient.invalidateQueries('org-data');
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
        direction: 'horizontal',
        placeholder: 'Name'
      },
      {
        as: InputText,
        name: 'contact_person_name',
        label: 'Contact Person Name',
        direction: 'horizontal',
        placeholder: 'Contact Person Name'
      },
      {
        as: Divider,
        name: 'divider',
        label: 'divider'
      },
      {
        as: Title,
        name: 'title',
        label: 'Organization Details'
      },
      {
        as: InputText,
        name: 'email',
        label: 'Email',
        direction: 'horizontal',
        placeholder: 'Email'
      },
      {
        as: InputText,
        name: 'mobile',
        label: 'Mobile',
        direction: 'horizontal',
        placeholder: 'Mobile',
        type: 'number'
      },
      {
        as: Textarea,
        name: 'address',
        label: 'Address',
        direction: 'horizontal',
        placeholder: 'Address',
        rows: 6
      },
      {
        as: InputText,
        name: 'city',
        label: 'City',
        direction: 'horizontal',
        placeholder: 'City'
      },
      {
        as: InputText,
        name: 'zipcode',
        label: 'Zipcode',
        direction: 'horizontal',
        placeholder: 'Zipcode',
        type: 'number'
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'country',
        label: 'Country',
        optionLabel: 'country',
        optionValue: 'country',
        direction: 'horizontal',
        placeholder: 'Country',
        options: countriesList.value || []
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'state',
        optionLabel: 'name',
        optionValue: 'id',
        label: 'State',
        direction: 'horizontal',
        placeholder: 'State',
        options: statesList.value || []
      },
      {
        as: InputText,
        name: 'regId',
        label: 'Registration no',
        direction: 'horizontal',
        placeholder: 'Registration no'
      },
      {
        as: InputText,
        name: 'website',
        label: 'Website',
        direction: 'horizontal',
        placeholder: 'Website'
      },
      {
        as: Divider,
        name: 'divider',
        label: 'divider'
      },
      {
        as: Title,
        name: 'title',
        label: 'Social'
      },
      {
        as: InputText,
        name: 'linkedIn',
        label: 'Linkedin',
        direction: 'horizontal',
        placeholder: 'Linkedin'
      },
      {
        as: InputText,
        name: 'twitter',
        label: 'Twitter',
        direction: 'horizontal',
        placeholder: 'Twitter'
      },
      {
        as: Divider,
        name: 'divider',
        label: 'divider'
      },
      {
        as: Title,
        name: 'title',
        label: 'Media'
      },
      {
        name: 'registration_certificate_preview',
        label: 'Registration Certificate',
        direction: 'horizontal',
        showSlot: true,
        hide: !orgDetails.value?.regCertificate
      },
      {
        name: 'registration_certificate',
        label: orgDetails.value?.regCertificate
          ? 'Update Certificate'
          : 'Registration Certificate',
        direction: 'horizontal',
        type: 'file',
        multiple: false,
        showCancelButton: false,
        accept:
          'image/jpeg, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      },
      {
        as: Editor,
        type: 'editor',
        name: 'signature',
        label: 'Signature',
        direction: 'horizontal',
        editorStyle: 'height: 160px'
      }
    ],
    validationSchema: OrgCreatePayloadSchema,
    initialValues: formValues,
    btnText: 'Submit',
    secondaryBtnText: 'Reset'
  } as SchemaForm;
});

function createOrgPayload(values: Partial<Org>) {
  let payload: Partial<OrgCreatePayload> = {
    ...values
  } as Partial<OrgCreatePayload>;
  if (values.logo && typeof values.logo === 'object') {
    payload.logo = values.logo.id;
  }
  if (values.regCertificate && typeof values.regCertificate === 'object') {
    payload.regCertificate = values.regCertificate.id;
  }
  // if (values.mobile === '') payload.mobile = null;
  payload = assignObj1ToObj2(payload, {}, true);
  // payload.zipcode = payload.zipcode ? `${payload.zipcode}` : null;
  return payload;
}
function onSubmit(values: Partial<Org>) {
  createUpdateOrg(createOrgPayload(values));
}
function handleReset() {
  router.go(0);
}
async function uploadFile(val: FileObject) {
  const payload: CreateAttachment = {
    filename: (val.files as File).name,
    contentType: (val.files as File).type as unknown as AttachmentContentType,
    extension: (val.files as File).name
      .split('.')
      .pop() as unknown as AttachmentExtension,
    contentLength: (val.files as File).size
  };
  fileSelected.value = val.files;
  uploadFileRef.value = val.name;
  await orgAttachments({ payload, file: fileSelected.value });
}

const { findFormIndex, updateFieldProp } = useSchemaForm(formData);

const regCertificateIndex = findFormIndex('registration_certificate');
const regCertificatePreviewIndex = findFormIndex(
  'registration_certificate_preview'
);

function handleDropdownChange(val: Record<string, any>) {
  country.value = (val as unknown as Org).country as string;
}

watchEffect(() => {
  if (formRef.value?.schemaFormValues?.country) {
    formRef.value?.validateField('mobile');
    formRef.value?.validateField('zipcode');
  }
});

onMounted(() => {
  useTimeoutFn(() => {
    formKey.value += 1;
  }, 400);
});
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
    :primary-btn-loading="updatingOrg"
    @submit="onSubmit"
    @secondary-btn-click="handleReset"
    @dropdown-change="handleDropdownChange"
    @file-upload="(() => uploadFile)()"
  >
    <template #registration_certificate_preview>
      <div
        class="w-full flex flex-column md:flex-row justify-content-between md:align-items-center"
      >
        <!-- <label class="block font-medium text-900" for="contact"
          >{{ attrs.label }}
          <span v-if="attrs.required" class="text-red-600">*</span></label
        > -->
        <div class="block font-medium text-900 md:w-13rem mb-2 md:mb-0">
          &nbsp;
        </div>

        <div class="w-full flex justify-content-start">
          <div class="w-full md:w-5">
            <!-- <TasksAttachmentPreview
              :showRemove="false"
              v-if="formValues?.regCertificate"
              :attachment="formValues?.regCertificate"
            /> -->
            <p class="mb-1 font-medium">
              Available Registration Certificate
            </p>
            <div
              class="flex align-items-center justify-content-between card p-3 border shadow-3"
            >
              <span class="inline-block mr-2">{{
                formValues?.regCertificate?.name
              }}</span>

              <i
                v-tooltip.top="'Download Registration Certificate'"
                class="pi pi-download mr-1 mb-1"
                @click="
                  downloadFileAs(
                    getAttachmentUrl(
                      formValues?.regCertificate?.path as string,
                    ),
                    formValues?.regCertificate?.name,
                  )
                "
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </CommonSchemaForm>
</template>
