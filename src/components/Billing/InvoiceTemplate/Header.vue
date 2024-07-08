<script lang="ts" setup>
import type { InvoiceTemplate } from '@/types/client-billing-invoices.type';

const invoiceTemplateData = inject(
  'invoiceTemplateData'
) as Ref<InvoiceTemplate>;

const { getAttachmentUrl } = useAttachments();

const logoUrl = computed(() => {
  const logoPath = invoiceTemplateData?.value.templateData?.CPAData?.logo;

  return logoPath
    ? getAttachmentUrl(logoPath)
    : '/images/logos/bright-return-2.svg';
});
</script>

<template>
  <table
    cellpadding="0"
    cellspacing="0"
    border="0"
    width="100%"
    style="
      box-sizing: border-box;
      empty-cells: hide;
      line-height: normal;
      margin: 0;
      padding: 0;
    "
  >
    <tbody style="box-sizing: border-box; line-height: normal">
      <!-- Pre header start -->
      <!-- Pre-header end -->
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
          <table
            class="align-center"
            border="0"
            cellspacing="0"
            cellpadding="0"
            align="center"
            width="100%"
            style="
              box-sizing: border-box;
              empty-cells: hide;
              line-height: normal;
              margin: 0 0 30px 0;
              padding: 0;
            "
          >
            <tbody style="box-sizing: border-box; line-height: normal">
              <!-- Spacer 15 start -->
              <BillingInvoiceTemplateRowSpacer />
              <!-- Spacer 15 end -->
              <tr style="box-sizing: border-box; line-height: normal">
                <td
                  class="text-center"
                  valign="top"
                  align="center"
                  style="
                    box-sizing: border-box;
                    font-family: Arial, Helvetica, sans-serif;
                    line-height: normal;
                    margin: 0 auto;
                  "
                >
                  <table
                    class="content-table align-center"
                    border="0"
                    cellspacing="0"
                    cellpadding="0"
                    align="center"
                    width="100%"
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
                        class="text-center"
                        valign="middle"
                        style="
                          box-sizing: border-box;
                          font-family: Arial, Helvetica, sans-serif;
                          line-height: normal;
                          margin: 0 auto;
                        "
                      >
                        <table
                          class="align-center"
                          border="0"
                          cellspacing="0"
                          cellpadding="0"
                          align="center"
                          style="
                            box-sizing: border-box;
                            empty-cells: hide;
                            line-height: normal;
                            margin: 0;
                            padding: 0;
                          "
                        >
                          <tr
                            style="box-sizing: border-box; line-height: normal"
                          >
                            <td
                              class="text-center"
                              valign="top"
                              align="center"
                              style="
                                box-sizing: border-box;
                                font-family: Arial, Helvetica, sans-serif;
                                line-height: normal;
                                margin: 0 auto;
                              "
                            >
                              <img
                                :src="logoUrl"
                                alt="Logo"
                                width="240"
                                height="240"
                                class="h-auto"
                                style="
                                  border: 0;
                                  box-sizing: border-box;
                                  display: block;
                                  line-height: normal;
                                  vertical-align: sub;
                                  width: 150px;
                                  height: auto;
                                  max-width: 100%;
                                "
                              >
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td
                        class="hide"
                        valign="middle"
                        align="right"
                        width="100"
                        style="
                          box-sizing: border-box;
                          font-family: Arial, Helvetica, sans-serif;
                          line-height: normal;
                          margin: 0 auto;
                        "
                      >
                        <span
                          style="
                            box-sizing: border-box;
                            color: rgb(146, 133, 133);
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 40px;
                            line-height: normal;
                            margin: 0;
                            font-weight: bold;
                          "
                        >INVOICE</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer 15 start -->
              <BillingInvoiceTemplateRowSpacer />
              <!-- Spacer 15 end -->
            </tbody>
          </table>
          <!-- Header block end -->
        </td>
      </tr>
    </tbody>
  </table>
</template>
