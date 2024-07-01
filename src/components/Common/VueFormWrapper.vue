<script setup lang="ts">
import type {
  RigidTemplateSchema,
  Webform,
  WebformSubmitPayload
} from '@/types/webforms.type';
import type { VueformComponent, VueformProps } from '@vueform/vueform';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const props = defineProps<{
  webform?: Webform;
  webformId?: string;
  isFromClient?: boolean;
  isForClient?: boolean;
  showDivider?: boolean;
  isPreview?: boolean;
  isSubmitForm?: boolean;
  formKey?: number;
  hideButtons?: boolean;
  hideSecondaryButton?: boolean;
  hidePrimaryButton?: boolean;
  hideTitle?: boolean;
  hideValues?: boolean;
  disableForm?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', data: Record<string, any>): void;
  (e: 'back'): void;
}>();

const route = useRoute();
const attrs = useAttrs();
const { isFalsy, extractValuesOfKey, arrDiff } = useUtilityFns();
const { schemaToVueformSchema, getOne: getWebformTemplateDetails }
  = useWebformTemplates();
const { getOne, submitForm } = useWebforms();
const { removePublicAttachment } = useAttachments();
const { initToast } = useToasts();
const queryClient = useQueryClient();

const { webform: webformProp, webformId: webformIdProp } = toRefs(props);
const currentWebformId = ref<string>(
  (webformIdProp?.value as string)
  || (webformProp?.value?.id as string)
  || (route.params.id as string)
);
const vueformRef = ref<VueformComponent>();
const attachmentsToRemove = ref<string[]>([]);
const isFormSubmitted = ref(false);
const isResubmit = ref(false);
const vueformSchema = ref<VueformProps | undefined>();

const {
  data: webformDetails,
  isLoading: loadingWebform,
  isFetching: fetchingWebform
} = useQuery(['client-webform-details', webformIdProp], () => {
  if (props.webform) {
    return { ...webformProp?.value };
  }
  return props.isFromClient || props.isForClient
    ? getOne(currentWebformId.value as string)
    : getWebformTemplateDetails(currentWebformId.value as string);
}, {
  onSuccess: (data) => {
    if (data) {
      vueformSchema.value = {
        schema: schemaToVueformSchema(
          data.data as RigidTemplateSchema,
          !!data?.client
        )
      } as VueformProps;
    }
  }
});

/* const vueformSchema = computed<VueformProps | undefined>(() => {
  if (webformDetails.value) {
    return {
      schema: schemaToVueformSchema(
        webformDetails.value?.data as RigidTemplateSchema,
        !!webformDetails.value?.client
      )
    } as VueformProps;
  }
  return undefined;
}); */

const { mutateAsync: submitWebform, isLoading: submittingWebform }
  = useMutation(
    ({ id, payload }: { id: string; payload: WebformSubmitPayload }) =>
      submitForm({ id, payload }),
    {
      onSuccess: (data, variables) => {
        initToast({
          actionType: 'Update',
          summary: `Submit ${webformDetails.value?.name || 'Form'}`,
          detail: `${
            webformDetails.value?.name || 'Form'
          } submitted successfully.`
        });
        queryClient.invalidateQueries('client-webform-details');
      }
    }
  );

async function handleVueFormData() {
  const formValues = vueformRef.value?.data as Record<string, any>;
  const attachments = extractValuesOfKey(formValues, 'attachmentId');
  attachmentsToRemove.value = arrDiff(
    attachments,
    webformDetails.value?.attachments as string[]
  );

  if (
    webformDetails.value?.type === 'ORGANIZER'
    && attachmentsToRemove.value.length
  ) {
    await Promise.allSettled(
      attachmentsToRemove.value.map(async (id: string) => {
        const payload = {
          userId: webformDetails.value?.createdBy?.id as string,
          orgId: webformDetails.value?.orgId as string
        };
        await removePublicAttachment({ id, payload, isPublic: true });
      })
    );
  }

  const payload: WebformSubmitPayload = {
    values: formValues,
    schema: webformDetails.value?.schema as Record<string, any>
  };
  if (!isFalsy(webformDetails.value?.documentMeta)) {
    payload.documentMeta = { ...webformDetails.value?.documentMeta };
  }
  if (webformDetails.value?.type === 'ORGANIZER') {
    payload.attachments = attachments;
  }
  if (props.isFromClient) {
    payload.isFromCPA = true;
  }
  await submitWebform({
    id: currentWebformId.value,
    payload
  });
  if (!props.isFromClient) {
    isFormSubmitted.value = true;
  }
  emit('submit', formValues);
}

function prepareResubmit() {
  isResubmit.value = true;
  isFormSubmitted.value = false;
}

watchEffect(() => {
  if (
    !props.hideValues
    && ((webformProp?.value && webformProp?.value?.values)
    || isFormSubmitted.value)
  ) {
    vueformRef.value
    && vueformRef.value?.form$.update(webformProp?.value?.values);
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonLoading v-if="loadingWebform" />
  <div v-else v-bind="attrs">
    <template v-if="!hideTitle">
      <Divider v-if="showDivider" align="center">
        <h3 class="mb-2 text-primary">
          {{ webformDetails?.name || 'Webform' }}
          {{ isPreview ? '(Preview)' : '' }}
        </h3>
      </Divider>
      <h3 v-else class="mb-2 text-primary">
        {{ webformDetails?.name || 'Webform' }}
        {{ isPreview ? '(Preview)' : '' }}
      </h3>
    </template>
    <div class="card shadow-3">
      <p v-if="isFalsy(vueformSchema?.schema)" class="text-center font-medium">
        There is no form field added to this form.
      </p>
      <template v-else>
        <div v-if="isFormSubmitted" class="text-center">
          <h3 class="text-900 text-primary mb-3">
            Form submitted successfully.
          </h3>
          <div class="text-700 text-xl mb-5">
            Thank you for sharing the valuable information.
          </div>
          <Button label="Resubmit" @click="prepareResubmit" />
        </div>
        <Vueform
          v-else
          ref="vueformRef"
          :key="formKey"
          v-bind="{ ...vueformSchema, webformProp }"
          :disabled="disableForm"
          :add-class="disableForm ? 'disabled-form' : ''"
        />
      </template>
    </div>
    <div
      v-if="!(hideButtons || isFormSubmitted)"
      class="mt-3 flex justify-content-between"
    >
      <Button
        v-if="!hideSecondaryButton"
        label="Back"
        text
        icon="pi pi-chevron-left"
        class="mr-auto"
        @click="emit('back')"
      />
      <Button
        v-if="!hidePrimaryButton"
        label="Submit "
        class="ml-auto"
        :loading="submittingWebform"
        @click="handleVueFormData"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(*) {
  .vf-file-preview-filename-link {
    pointer-events: none !important;
  }

  .disabled-form {
    .vf-element-layout {
      cursor: not-allowed;

      .vf-element-layout-outer-wrapper {
        pointer-events: none;
      }
    }
  }
}
</style>
