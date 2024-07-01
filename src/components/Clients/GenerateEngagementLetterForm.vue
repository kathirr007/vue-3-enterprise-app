<script setup lang="ts">
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import type {
  engageMentLetterStatesPayload,
  genEngagementLetterPayload,
  Client,
  serviceByStatePaylaod,
} from '@/types/client.type';
import { genEngagementLetterSchema } from '@/types/client.type';
import { Field as VField } from 'vee-validate';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Title from '../Form/Title.vue';
import RadioButton from 'primevue/radiobutton';
import InputNumber from 'primevue/inputnumber';
import type { Ref } from 'vue';
import { useQuery, useMutation, useQueryClient } from 'vue-query';
import type {
  Attachment,
  AttachmentContentType,
  AttachmentExtension,
  AttachmentResponse,
  CreateAttachment,
} from '@/types/attachment.type';
import type { Org, OrgCreatePayload } from '@/types/myaccount.type';
import type { FileObject, UploadFilesPayload } from '@/types/common.type';
import type { User } from '@/types/teams.type';

const props = defineProps<{
  selectedContract: string;
  client?: Client;
}>();

const emits = defineEmits(['success']);

const { getServices, getUsers } = useCommonListQueries();
const { data: serviceOptions } = getServices();
const { data: users } = getUsers(true);
const { createAttachment, fileSelected, uploadFileRef, getAttachmentUrl } =
  useAttachments();
const queryClient = useQueryClient();
const { initToast } = useToasts();
const { removeFalsyValues } = useUtilityFns();
const { getYear } = useVueFilters();
const { useContract, useContractCreate } = useEngagementLetter();
const { fullName } = useVueFilters();
const clientDetails: Ref<Client> | Ref<undefined> | undefined = props.client
  ? ref(props.client)
  : inject('clientDetails');
const stateOptions = computed(() => {
  return clientDetails?.value?.clientStates?.map((e) => {
    return { name: e.state.name };
  });
});
const isBusinessEntityIndividual = computed(() => {
  return clientDetails?.value?.businessEntity.businessType === 'INDIVIDUAL';
});
const clientId = computed(() => {
  return clientDetails?.value?.id;
});
type EmptyRecord = engageMentLetterStatesPayload & { error?: string };
const { isMedium } = useCommonBreakPoints();
const tableCellStyles = { 'min-width': '14rem' };
const emptyRecord: EmptyRecord = {
  formNumber: '',
  service: '',
  states: [],
  error: '',
};

const radioOptions = [
  { name: 'Yes', value: true, radioLabel: 'Yes' },
  { name: 'No', value: false, radioLabel: 'No' },
];

const {
  values: stateValues,
  setValues,
  setErrors,
  errors: stateErrors,
} = useForm({
  validationSchema: genEngagementLetterSchema,
});

const formData = shallowRef<SchemaForm>({
  fields: [
    {
      as: Title,
      name: 'title1',
      fontSize: 'text-lg',
      label: 'CPA Firm Information',
    },
    {
      as: InputText,
      name: 'cpaFirmName',
      label: 'CPA Firm Name',
      required: true,
      placeholder: 'Enter name',
      disabled: true,
    },
    {
      type: 'file',
      name: 'cpaFirmLogo',
      label: 'CPA Firm Logo',
    },
    {
      name: 'cpaFirmRepresentative',
      label: 'CPA Firm Representative Name',
      type: 'dropdown',
      placeholder: 'Enter name',
      optionLabel: 'name',
      optionValue: 'id',
      required: true,
    },
    {
      as: InputText,
      name: 'cpaFirmRepresentativeDesignation',
      label: 'CPA Firm Representative Designation',
      placeholder: 'CPA Firm Representative Designation',
      disabled: true,
    },
    {
      type: 'calender',
      name: 'filingYear',
      label: 'Filing year',
      placeholder: 'Filing year',
      required: true,
      view: 'year',
      dateFormat: 'yy',
    },
    {
      as: RadioButton,
      type: 'radio',
      label: 'Did you file client return last year?',
      name: 'isLastYearFiled',
      options: radioOptions,
      required: true,
    },
    {
      as: InputNumber,
      name: 'professionalFee',
      label: 'Professional Fee',
      mode: 'currency',
      currency: 'USD',
      locale: 'en-US',
      inputGroup: true,
      inputGroupPrefix: '$',
      autocomplete: 'off',
      formGridClass: 'md:col-6',
      placeholder: '$0.00',
      type: 'input-number',
      required: true,
    },
    {
      type: 'input-number',
      name: 'percentageDueUponSigning',
      label: 'Percentage Due Upon Signing',
      inputGroup: true,
      inputGroupSuffix: '%',
      autocomplete: 'off',
      formGridClass: 'md:col-6',
      placeholder: '0%',
      required: true,
      min: 0,
      max: 100,
    },

    {
      as: Title,
      name: 'title1',
      fontSize: 'text-lg',
      label: 'Client Information',
    },

    {
      as: InputText,
      name: 'clientName',
      label: 'Client Name',
      placeholder: 'Enter name',
      required: true,
    },
    {
      as: InputText,
      name: 'clientRepresentative',
      label: 'Client Representative',
      placeholder: 'Client Representative',
    },
    {
      as: InputText,
      name: 'clientRepresentativeTitle',
      label: 'Client Representative Title',
      placeholder: 'Client Representative Title',
    },
    {
      as: InputText,
      name: 'clientStreet',
      label: 'Client Street',
      placeholder: 'Client Street',
    },
    {
      as: InputText,
      name: 'clientZip',
      label: 'Client Zip',
      placeholder: 'Client Zip',
    },

    {
      as: InputText,
      name: 'clientState',
      label: 'Client State',
      placeholder: 'Client State',
    },
    {
      as: InputText,
      name: 'clientCity',
      label: 'Client City',
      placeholder: 'Client City',
    },
    {
      as: InputText,
      name: 'clientSpouseName',
      label: 'Client Spouse Name',
      placeholder: 'Client Spouse Name',
      hide: !isBusinessEntityIndividual.value,
    },
  ],
  btnText: 'Submit',
  validationSchema: genEngagementLetterSchema,
  initialValues: { states: [{ ...emptyRecord }] },
});

const { data: initialValues } = useQuery(
  ['contract-details', clientId.value, props.selectedContract],
  async () => {
    return await useContract(clientId.value as string, props.selectedContract);
  },
  {
    onSuccess: (data) => {
      if (data) {
        setTimeout(() => {
          formRef.value?.setValues({ ...data, states: [{ ...emptyRecord }] });
        }, 100);
        formKey.value++;
        if (data.cpaFirmLogo) {
          const cpaFirmLogoIndex = findFormIndex('cpaFirmLogo');
          updateFieldProp('showSlot', cpaFirmLogoIndex, true);
          formKey.value++;
        }
      }
    },
  }
);

const { remove, push: usePush, fields: statesFields } = useFieldArray('states');

setValues({ states: [{ ...emptyRecord }] });

const formKey = ref(0);
const formRef = ref<SchemaFormRef | undefined>();

const onSubmit = (values: Record<string, any>) => {
  let paylaod = { ...values };
  if (paylaod.cpaFirmLogo) {
    paylaod.cpaFirmLogo = getAttachmentUrl(paylaod.cpaFirmLogo);
  }
  const cpaUser = users.value?.find(
    (e) => e.id === values.cpaFirmRepresentative
  );

  paylaod.cpaFirmRepresentative = `${fullName(cpaUser as User)}`;
  if (paylaod.states) {
    const servicesByStateAndForm: serviceByStatePaylaod[] = [];
    paylaod.states.forEach((row: any) => {
      if (row.states?.length) {
        row.states.forEach((state: any) => {
          servicesByStateAndForm.push({
            state: state,
            formNumber: row.formNumber,
            service: row.service,
          });
        });
      }
    });
    paylaod.filingYear = `${getYear(paylaod.filingYear)}`;
    paylaod.servicesByStateAndForm = servicesByStateAndForm;
    if (paylaod.clientZip) {
      paylaod.clientZip = Number(paylaod.clientZip);
    }

    paylaod = removeFalsyValues(
      paylaod,
      ['percentageDueUponSigning', 'isLastYearFiled'],
      ['states']
    );
    generateEL(paylaod as unknown as genEngagementLetterPayload);
  }
};
const updateErrors = (): void => {
  setTimeout(() => {
    setErrors(
      formRef?.value?.errors as unknown as Partial<
        Record<string, string | undefined>
      > as unknown as Partial<Record<string, string | undefined>>
    );
  }, 300);
};

onMounted(() => {
  updateErrors();
});
const { findFormIndex, updateOptions, updateFieldProp } =
  useSchemaForm(formData);
const cpaFirmRepresentativeNameIndex = findFormIndex('cpaFirmRepresentative');

watchEffect(() => {
  if (users.value) {
    updateOptions(users, cpaFirmRepresentativeNameIndex);
  }
});

const handleDropdownChange = (val: Record<string, any>, name: string) => {
  if (name === 'cpaFirmRepresentative') {
    const designationName = users.value?.find(
      (e) => e.id === val.cpaFirmRepresentative
    )?.designation?.name;
    formRef.value?.setValues({
      ...formRef.value.schemaFormValues,
      cpaFirmRepresentativeDesignation: designationName,
    });
  }
};

const { mutateAsync: createUpdateOrg } = useMutation(
  (payload: Partial<OrgCreatePayload>) => {
    return useOrgUpdate(payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Organisation Details Update',
        detail: 'Organisation Details updated successfully',
      });
    },
  }
);
const { mutateAsync: generateEL, isLoading } = useMutation(
  (payload: genEngagementLetterPayload) => {
    return useContractCreate(
      clientId.value as string,
      props.selectedContract,
      payload
    );
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Create',
        summary: 'Generate Engagement Letter',
        detail: 'Engagement Letter generated successfully',
      });
      emits('success');
    },
  }
);

const { mutateAsync: orgAttactments } = useMutation(
  async (data: { payload: CreateAttachment; file: UploadFilesPayload }) => {
    return createAttachment({
      payloadData: data,
      fileUploadRef: uploadFileRef,
      schemaFormRef: formRef.value?.schemaFormRefs,
    });
  },
  {
    onSuccess: (data: { res: AttachmentResponse; file: File }) => {
      handlePostAttachment(data.res);
    },
  }
);

const handlePostAttachment = async (data: AttachmentResponse) => {
  await createUpdateOrg(
    createOrgPayload({
      logo: data.id as unknown as Attachment,
      name: initialValues.value?.cpaFirmName,
    })
  );
  queryClient.invalidateQueries('contract-details');
};

const createOrgPayload = (values: Partial<Org>) => {
  const payload: Partial<OrgCreatePayload> = {
    ...values,
  } as Partial<OrgCreatePayload>;
  if (values.logo && typeof values.logo === 'object') {
    payload.logo = values.logo.id;
  }
  if (values.regCertificate && typeof values.regCertificate === 'object') {
    payload.regCertificate = values.regCertificate.id;
  }
  if (values.mobile === '') payload.mobile = null;
  return payload;
};

const uploadFile = async (val: FileObject) => {
  const payload: CreateAttachment = {
    filename: (val.files as File).name,
    contentType: (val.files as File).type as unknown as AttachmentContentType,
    extension: (val.files as File).type.split(
      '/'
    )[1] as unknown as AttachmentExtension,
    contentLength: (val.files as File).size,
  };
  fileSelected.value = val.files;
  uploadFileRef.value = val.name;
  await orgAttactments({ payload, file: fileSelected.value });
};
</script>

<template>
  <div>
    <CommonSchemaForm
      ref="formRef"
      :key="formKey"
      :data="formData"
      @submit="onSubmit"
      @dropdown-change="handleDropdownChange"
      @file-upload="(() => uploadFile)()"
      :primary-btn-loading="isLoading"
    >
      <div class="p-3 overflow-x-hidden">
        <FormTitle title="Client Project Templates" />
        <div>
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
                      Form Number<span class="text-red-600">*</span>
                    </th>
                    <th role="cell" :style="tableCellStyles">
                      Project Template<span class="text-red-600">*</span>
                    </th>
                    <th role="cell" :style="tableCellStyles">
                      States<span class="text-red-600">*</span>
                    </th>
                    <th role="cell">
                      Actions<span class="text-red-600">*</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="p-datatable-tbody relative" role="rowgroup">
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
                    v-for="(field, idx) in statesFields"
                    :key="field.key"
                  >
                    <td
                      role="cell"
                      valign="top"
                      :style="tableCellStyles"
                      :class="[
                        {
                          'pb-4':
                            (field.value as unknown as EmptyRecord).error &&
                            isMedium,
                        },
                      ]"
                    >
                      <label
                        :for="`formNumber_${idx}`"
                        class="mb-2"
                        :class="isMedium ? 'hidden' : 'block'"
                        >Form Number</label
                      >
                      <VField
                        :id="`formNumber_${idx}`"
                        :name="`states[${idx}].formNumber`"
                        v-slot="{ handleChange, value, validate }"
                      >
                        <InputText
                          placeholder="Form Number"
                          class="w-full"
                          :model-value="value as string"
                          @update:model-value="handleChange"
                          @input="
                            validate();
                            updateErrors();
                          "
                          @blur="
                            validate();
                            updateErrors();
                          "
                        />
                      </VField>
                      <transition mode="out-in" name="field-slide-down">
                        <FormFeedbackMessage
                          :errors="stateErrors"
                          :values="stateValues"
                          :errorKey="`states[${idx}].formNumber`"
                        />
                      </transition>
                    </td>
                    <td role="cell" valign="top" :style="tableCellStyles">
                      <label
                        :for="`service_${idx}`"
                        class="mb-2"
                        :class="isMedium ? 'hidden' : 'block'"
                        >Service</label
                      >
                      <VField
                        :id="`service_${idx}`"
                        :name="`states[${idx}].service`"
                        v-slot="{ handleChange, value, validate }"
                      >
                        <Dropdown
                          class="w-full"
                          @update:model-value="handleChange"
                          @blur="
                            validate();
                            updateErrors();
                          "
                          @change="
                            validate();
                            updateErrors();
                          "
                          :model-value="value"
                          :options="serviceOptions"
                          optionLabel="name"
                          optionValue="name"
                          placeholder="Select a Project Template"
                        />
                      </VField>

                      <transition mode="out-in" name="field-slide-down">
                        <FormFeedbackMessage
                          :errors="stateErrors"
                          :values="stateValues"
                          :errorKey="`states[${idx}].service`"
                        />
                      </transition>
                    </td>
                    <td
                      role="cell"
                      valign="top"
                      :style="tableCellStyles"
                      :class="[
                        {
                          'pb-4':
                            (field.value as unknown as EmptyRecord).error &&
                            isMedium,
                        },
                      ]"
                    >
                      <label
                        :for="`states_${idx}`"
                        class="mb-2 w-full"
                        :class="isMedium ? 'hidden' : 'block'"
                        >States</label
                      >
                      <VField
                        :id="`states_${idx}`"
                        :name="`states[${idx}].states`"
                        v-slot="{ handleChange, value, validate }"
                      >
                        <MultiSelect
                          class="w-full"
                          @update:model-value="handleChange"
                          @blur="
                            validate();
                            updateErrors();
                          "
                          @change="
                            validate();
                            updateErrors();
                          "
                          :model-value="value"
                          :options="stateOptions"
                          optionLabel="name"
                          optionValue="name"
                          placeholder="Select States"
                        />
                      </VField>

                      <transition mode="out-in" name="field-slide-down">
                        <FormFeedbackMessage
                          :errors="stateErrors"
                          :values="stateValues"
                          :errorKey="`states[${idx}].states`"
                        />
                      </transition>
                    </td>

                    <td
                      role="cell"
                      valign="top"
                      class="text-right md:text-left"
                    >
                      <div class="w-6rem">
                        <Button
                          v-if="idx === statesFields.length - 1"
                          icon="pi pi-plus"
                          aria-label="add-record"
                          class="p-button-sm p-button-rounded p-button-primary mr-2"
                          @click="
                            usePush(emptyRecord);
                            formRef?.validate({ mode: 'silent' });
                          "
                        />
                        <Button
                          v-if="statesFields.length > 1"
                          type="button"
                          icon="pi pi-trash"
                          aria-label="delete-record"
                          class="p-button-sm p-button-rounded p-button-danger"
                          @click="remove(idx)"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <template #cpaFirmLogo>
        <div v-if="initialValues" class="w-full space-y-1.5">
          <div class="block font-medium text-900">CPA Firm Logo</div>
          <Avatar
            class="mr-2 p-avatar-xxl relative"
            size="large"
            shape="circle"
          >
            <img
              class="text-sm"
              :src="
                getAttachmentUrl(
                  initialValues ? `${initialValues?.cpaFirmLogo}` : ''
                )
              "
              style="vertical-align: middle"
              :alt="initialValues?.cpaFirmName"
            />
          </Avatar>
        </div>
      </template>
    </CommonSchemaForm>
  </div>
</template>
