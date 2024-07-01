<script setup lang="ts">
import type {
  Contract,
  CreateContract,
  ShareContractPayload,
} from '@/types/client.type';
import { shareContractSchema } from '@/types/client.type';
import type {
  AttachmentContentType,
  AttachmentExtension,
  AttachmentResponse,
  CreateAttachment,
} from '@/types/attachment.type';
import { useQuery, useQueryClient, useMutation } from 'vue-query';
import { useRouteQuery, useRouteParams } from '@vueuse/router';
import type { UploadFilesPayload } from '@/types/common.type';
import type { SchemaForm } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';

const disabledTooltip = inject('disabledTooltip');
const canDoActions = inject('canDoActions');
const clientDetails = inject<any>('clientDetails', () => null);

const { titleCase } = useVueFilters();
const { initToast } = useToasts();
const { handleTooltip } = useTooltip();
const { filters } = useDatatableFilters();
const { isLarge } = useCommonBreakPoints();
const { useContractList, useContractUpdate, useShareContract } =
  useEngagementLetter();
const queryClient = useQueryClient();
const { defaultBreakpoints } = useCommonBreakPoints();
const {
  createAttachment,
  fileSelected,
  uploadFileRef,
  getAttachmentUrl,
  downloadFileAs,
} = useAttachments();
const route = useRoute();
const { canDo, canAccessAllMenu } = usePermissions();
const { currentUser } = useCurrentUserData();

const clientId = ref(route.params.id as string);
const selectedContract = ref<Contract>();
const generateEngagementLetterDialog = ref(false);
const uploadDialog = ref(false);
const shareDialog = ref(false);

const { data: Contracts, isLoading } = useQuery(
  ['contracts', clientId.value],
  () => {
    return useContractList(clientId.value as string);
  }
);

const formData = shallowRef<SchemaForm>({
  fields: [
    {
      as: InputText,
      name: 'email',
      label: 'Email',
      type: 'text',
      placeholder: 'Enter Email',
      required: true,
    },
  ],
  btnText: 'Share',
  validationSchema: shareContractSchema,
  initialValues: {},
});

const handleSuccess = () => {
  generateEngagementLetterDialog.value = false;
  queryClient.invalidateQueries('contracts');
  selectedContract.value = undefined;
};

const { mutateAsync: upateContract } = useMutation(
  (payload: Partial<CreateContract>) => {
    return useContractUpdate(
      clientId.value as string,
      selectedContract.value?.id as string,
      payload
    );
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Contract Update',
        detail: `Contract Updated successfully`,
      });
      uploadDialog.value = false;
      queryClient.invalidateQueries('contracts');
    },
  }
);
const { mutateAsync: shareContract } = useMutation(
  (payload: ShareContractPayload) => {
    return useShareContract(
      clientId.value as string,
      selectedContract.value?.id as string,
      payload
    );
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Contract Document Update',
        detail: `${
          selectedContract?.value?.status === 'GENERATED_LINK'
            ? 'Link'
            : 'Document'
        } has been shared successfully`,
      });
      shareDialog.value = false;
      queryClient.invalidateQueries('contracts');
    },
  }
);

const { mutateAsync: contractUpload } = useMutation(
  async (data: { payload: CreateAttachment; file: UploadFilesPayload }) => {
    return createAttachment({
      payloadData: data,
      fileUploadRef: uploadFileRef,
    });
  },
  {
    onSuccess: (data: { res: AttachmentResponse; file: File }) => {
      handlePostAttachment(data.res);
    },
  }
);

const handlePostAttachment = async (data: AttachmentResponse) => {
  await upateContract({ attachment: data.id });
  queryClient.invalidateQueries('contract-details');
};

const uploadFile = async (val: File) => {
  const payload: CreateAttachment = {
    filename: val.name,
    contentType: val.type as unknown as AttachmentContentType,
    extension: val.name.split('.').pop() as unknown as AttachmentExtension,
    contentLength: val.size,
  };
  fileSelected.value = val;
  await contractUpload({ payload, file: fileSelected.value });
};
const handleDownload = (data: Contract) => {
  downloadFileAs(
    getAttachmentUrl(data.attachments[0].path),
    data.attachments[0].name
  );
};

const handleShare = (data: Record<string, any>) => {
  const payload = { ...data };
  payload.isDocument =
    selectedContract.value?.status !== 'GENERATED_LINK' ? true : false;
  payload.link =
    selectedContract.value?.status !== 'GENERATED_LINK'
      ? getAttachmentUrl(`${selectedContract.value?.attachments[0].path}`)
      : window.location.origin + '/contracts/' + selectedContract.value?.id;

  shareContract(payload as unknown as ShareContractPayload);
};
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <DataTable
    :value="Contracts"
    :loading="isLoading"
    responsiveLayout="scroll"
    breakpoint="768px"
    v-model:filters="filters"
    :globalFilterFields="['name']"
    :paginator="true"
    :rows="15"
    :alwaysShowPaginator="false"
    :page-link-size="isLarge ? 5 : 3"
  >
    <template #empty>
      <div class="text-center">No record found.</div>
    </template>
    <Column header="Name" field="name" />
    <Column header="Status">
      <template #body="{ data }">
        {{ titleCase(data.status.replace('_', ' ')) }}
      </template>
    </Column>
    <Column class="text-right">
      <template #header>
        <div class="w-full text-center">Actions</div>
      </template>
      <template #body="{ data }">
        <div class="mx-auto max-w-max">
          <span
            v-if="data.status === 'OPEN'"
            v-tooltip.top="
              handleTooltip(
                !!canDoActions,
                'Generate',
                disabledTooltip as string
              )
            "
            style="height: 2.357rem"
          >
            <Button
              v-if="canDo('clients', 'create')"
              icon="pi pi-plus"
              class="p-button-sm p-button-rounded mr-2"
              @click="
                selectedContract = data as Contract;
                generateEngagementLetterDialog = true;
              "
              :disabled="
                !canDoActions ||
                data.client.businessEntity.orgId ||
                data.client.businessEntity.name === 'LLC'
              "
            />
          </span>
          <span
            v-if="!(data.status === 'ATTACHED')"
            v-tooltip.top="
              handleTooltip(!!canDoActions, 'Upload', disabledTooltip as string)
            "
            style="height: 2.357rem"
          >
            <Button
              v-if="
                canAccessAllMenu ||
                clientDetails?.relationshipManager.id === currentUser.id
              "
              :disabled="!canDoActions"
              icon="pi pi-upload"
              class="p-button-sm p-button-rounded mr-2"
              @click="
                selectedContract = data as Contract;
                uploadDialog = true;
              "
            />
          </span>
          <span
            v-if="!(data.status === 'OPEN')"
            v-tooltip.top="
              handleTooltip(
                !!canDoActions,
                `Share ${
                  data.status === 'GENERATED_LINK' ? ' Link' : ' Document'
                }`,
                disabledTooltip as string
              )
            "
            style="height: 2.357rem"
          >
            <Button
              :disabled="!canDoActions"
              icon="pi pi-share-alt"
              class="p-button-sm p-button-rounded mr-2"
              @click="
                selectedContract = data as Contract;
                shareDialog = true;
              "
            />
          </span>
          <span
            v-if="
              data.status === 'ATTACHED' ||
              data.status === 'GENERATED_DOCUMENT' ||
              data.status === 'SIGNED'
            "
            v-tooltip.top="
              handleTooltip(
                !!canDoActions,
                'Download',
                disabledTooltip as string
              )
            "
            style="height: 2.357rem"
          >
            <Button
              :disabled="!canDoActions"
              icon="pi pi-download"
              @click="handleDownload(data)"
              class="p-button-sm p-button-rounded"
            />
          </span>
        </div>
      </template>
    </Column>
  </DataTable>
  <Dialog
    :modal="true"
    appendTo="body"
    v-model:visible="generateEngagementLetterDialog"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '50vw' }"
    :contentClass="'border-round-bottom-md'"
    :header="`Generate ${selectedContract?.name}`"
  >
    <ClientsGenerateEngagementLetterForm
      :selected-contract="selectedContract?.id as string"
      @success="handleSuccess"
    />
  </Dialog>
  <Dialog
    :modal="true"
    appendTo="body"
    v-model:visible="uploadDialog"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '50vw' }"
    :contentClass="'border-round-bottom-md'"
    :header="`Attach ${selectedContract?.name}`"
  >
    <div class="w-full space-y-1.5 flex flex-column">
      <div class="block font-medium text-900">Upload Logo</div>
      <CommonFileUpload
        :customUpload="true"
        :multiple="false"
        accept="image/*, application/pdf"
        @uploader="
          (file: UploadFilesPayload) => uploadFile((file.files as File[])[0])
        "
      />
    </div>
  </Dialog>
  <Dialog
    :modal="true"
    appendTo="body"
    v-model:visible="shareDialog"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '50vw' }"
    :contentClass="'border-round-bottom-md'"
    :header="`Share ${selectedContract?.name} ${
      selectedContract?.status === 'GENERATED_LINK' ? 'Link' : 'Document'
    }`"
  >
    <CommonSchemaForm :data="formData" @submit="handleShare" />
  </Dialog>
</template>
