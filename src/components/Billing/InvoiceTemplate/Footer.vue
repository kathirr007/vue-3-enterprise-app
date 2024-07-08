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
                class="coldrop"
                valign="middle"
                width="46%"
                style="
                  box-sizing: border-box;
                  font-family: Arial, Helvetica, sans-serif;
                  line-height: normal;
                  margin: 0 auto;
                "
              >
                <!-- Notes block start -->
                <table
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
                    v-if="invoiceTemplateData.templateData.notes"
                    style="box-sizing: border-box; line-height: normal"
                  >
                    <td
                      valign="top"
                      align="left"
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
                          color: #292929;
                          font-family: Arial, Helvetica, sans-serif;
                          font-size: 12px;
                          font-weight: bold;
                          line-height: normal;
                          margin: 0;
                        "
                      >Notes</span>
                    </td>
                  </tr>
                  <tr style="box-sizing: border-box; line-height: normal">
                    <td
                      valign="top"
                      align="left"
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
                          color: #707070;
                          font-family: Arial, Helvetica, sans-serif;
                          font-size: 12px;
                          line-height: normal;
                          margin: 0;
                        "
                      >
                        {{ invoiceTemplateData.templateData.notes }}
                      </span>
                    </td>
                  </tr>
                </table>
                <!-- Notes block end -->
              </td>
              <td
                class="coldrop"
                valign="top"
                height="20"
                style="
                  box-sizing: border-box;
                  font-family: Arial, Helvetica, sans-serif;
                  line-height: normal;
                  margin: 0 auto;
                "
              >
                &nbsp;
              </td>
              <td
                class="coldrop"
                valign="top"
                width="46%"
                style="
                  box-sizing: border-box;
                  font-family: Arial, Helvetica, sans-serif;
                  line-height: normal;
                  margin: 0 auto;
                "
              >
                <!-- Terms and Conditions block start -->
                <table
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
                    v-if="invoiceTemplateData.templateData.terms"
                    style="box-sizing: border-box; line-height: normal"
                  >
                    <td
                      valign="top"
                      align="left"
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
                          color: #292929;
                          font-family: Arial, Helvetica, sans-serif;
                          font-size: 12px;
                          font-weight: bold;
                          line-height: normal;
                          margin: 0;
                        "
                      >Terms and Conditions</span>
                    </td>
                  </tr>
                  <tr style="box-sizing: border-box; line-height: normal">
                    <td
                      valign="top"
                      align="left"
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
                          color: #707070;
                          font-family: Arial, Helvetica, sans-serif;
                          font-size: 12px;
                          line-height: normal;
                          margin: 0;
                        "
                      >
                        {{ invoiceTemplateData.templateData.terms }}
                      </span>
                    </td>
                  </tr>
                </table>
                <!-- Terms and Conditions block end -->
              </td>
            </tr>
            <!-- Spacer 40 start -->
            <BillingInvoiceTemplateRowSpacer :height="40" />
            <!-- Spacer 40 end -->
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</template>
