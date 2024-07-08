<script setup lang="ts">
import type { InvoiceTemplate } from '@/types/client-billing-invoices.type';

withDefaults(
  defineProps<{
    width?: number;
  }>(),
  { width: 750 }
);

const invoiceTemplateData = inject<InvoiceTemplate>('invoiceTemplateData');
</script>

<template>
  <table
    class="full-width"
    cellpadding="0"
    cellspacing="0"
    border="0"
    width="700"
    style="
      box-sizing: border-box;
      empty-cells: hide;
      line-height: normal;
      margin: 0;
      padding: 0;
    "
  >
    <tr style="box-sizing: border-box; line-height: normal">
      <td
        valign="top"
        align="center"
        style="
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          line-height: normal;
          margin: 0 auto;
        "
      >
        <!-- Header block start -->
        <BillingInvoiceTemplateHeader />
        <!-- Header block end -->
        <!-- Header address block start -->
        <BillingInvoiceTemplateAddress />
        <!-- Header address block end -->
        <!-- Invoice amount block start -->
        <BillingInvoiceTemplateAmountDue />
        <!-- Invoice amount block end -->
        <!-- Divider block start -->
        <BillingInvoiceTemplateDivider />
        <!-- Divider block end -->
        <!-- Bill to block start -->
        <BillingInvoiceTemplateBillTo />
        <!-- Bill to block end -->
        <!-- Invoice Items block start -->
        <BillingInvoiceTemplateInvoiceItems />
        <!-- Invoice Items block end -->
        <!-- Divider block start -->
        <BillingInvoiceTemplateDivider :top-space="false" />
        <!-- Divider block end -->
        <!-- Footer start -->
        <BillingInvoiceTemplateFooter />
        <!-- Footer end -->
      </td>
    </tr>
  </table>
</template>

<style lang="scss" scoped></style>
