<script setup lang="ts">
import { useMutation, useQuery } from 'vue-query';
import { usePaperizer } from 'paperizer';
import axios from 'axios';

useHead({
  titleTemplate: (title?: string) =>
    !title ? 'Bright Return Invoice' : `Bright Return Invoice | ${title}`,
});

const { paperize } = usePaperizer('invoiceWrapper', {
  styles: ['https://unpkg.com/primeflex@latest/primeflex.css'],
});
const handleDownload = () => {
  paperize();
};

const route = useRoute();
const { fullName, initials, dateToHumanShort } = useVueFilters();
const { getAttachmentUrl } = useAttachments();
const { getOne: getinvoiceTemplateData, getInvoiceTemplate } =
  useClientBillingInvoices();

const invoiceId = ref(route.params.id as string);
const invoiceTemplateString = ref();

const {
  data: invoiceTemplateData,
  isLoading,
  isFetching,
  isError,
} = useQuery(['invoice-details', invoiceId.value], () =>
  getInvoiceTemplate(invoiceId.value as string)
);

provide('invoiceTemplateData', invoiceTemplateData);

const { mutateAsync: payUsingPaypal, isLoading: loadingPayment } = useMutation(
  'userDelete',
  async (id: string) => {
    return useUserRemove(id);
  }
);

const handlePayment = () => {
  window.open(invoiceTemplateData.value?.paymentUrl);
};
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <div class="content-wrapper flex flex-column align-items-center mx-auto">
    <div class="w-full flex flex-column md:flex-row mb-4 align-items-center">
      <div class="w-full mb-2 md:mb-0">
        <div class="flex w-full">
          <!-- <Avatar class="mr-2 p-avatar-xxl relative" size="large" shape="circle">
            <img
              v-if="true"
              class="text-sm"
              :src="`${getAttachmentUrl(
                contractDetails?.org.logo.path as string
              )}`"
              style="vertical-align: middle"
              :alt="`CPA - Logo`"
            />
            <template v-else>
              {{ initials(`${contractDetails?.org.name}`) }}
            </template>
          </Avatar> -->
          <div class="ml-2 space-y-0.5 flex-1">
            <div>
              <!-- <h1 class="text-3xl text-primary mb-0">
                {{ 'Client Invoice' }}
              </h1> -->
            </div>
          </div>
          <div class="actions">
            <Button
              class="max-w-max font-medium"
              v-if="
                invoiceTemplateData?.paymentUrl &&
                !['CANCELLED', 'PAID'].includes(invoiceTemplateData.status)
              "
              :label="'Pay'"
              v-tooltip.bottom="'Pay Now'"
              @click="handlePayment"
              :loading="loadingPayment"
            />
            <Button
              icon="pi"
              class="p-button-sm p-button-rounded ml-2 p-button"
              @click="handleDownload"
              v-tooltip.left="'Download Invoice'"
            >
              <Icon
                class="flex-none text-2xl"
                icon="material-symbols:download"
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
    <div class="p-0 card justify-content-center w-full align-items-center">
      <!-- <h3 v-if="isError">Contract form not found.</h3> -->

      <CommonLoading v-if="isLoading || isFetching" />
      <Common404
        v-else-if="isError"
        :hideNavigations="true"
        :title="'Invoice not found.'"
      />
      <div v-else id="invoiceWrapper">
        <BillingInvoiceTemplate :invoiceTemplateData="invoiceTemplateData">
          <BillingInvoiceTemplateBody />
        </BillingInvoiceTemplate>
      </div>
      <!-- <div
        v-else
        class="w-full h-full border-none"
        id="invoiceWrapper"
        v-html="invoiceTemplateString"
        ></div> -->
      <!-- <iframe
        v-else
        id="inlineFrameExample"
        title="Inline Frame Example"
        class="w-full h-full border-none"
        :src="`https://email-newsletters.vercel.app/emails/killbill-invoice/invoice.html`"
        sandbox="allow-same-origin allow-scripts allow-modals allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox"
      >
      </iframe> -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content-wrapper {
  max-width: 800px;
}
.webform-card {
  height: calc(100vh - 280px);
}
</style>

<route lang="yaml">
meta:
  layout: webform
  isPublic: true
</route>
