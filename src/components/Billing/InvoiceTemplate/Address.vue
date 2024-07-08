<script setup lang="ts">
import type { InvoiceTemplate } from '@/types/client-billing-invoices.type';

const invoiceTemplateData = inject(
  'invoiceTemplateData'
) as Ref<InvoiceTemplate>;

const { dateToHumanShort } = useVueFilters();
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
                        style="
                          box-sizing: border-box;
                          font-family: Arial, Helvetica, sans-serif;
                          line-height: normal;
                          margin: 0 auto;
                        "
                      >
                        <!-- CPA Address block start -->
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
                                  font-size: 14px;
                                  font-weight: bold;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >
                                {{
                                  invoiceTemplateData.templateData.CPAData.name
                                }}
                              </span>
                            </td>
                          </tr>
                          <tr
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
                                  color: #707070;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >
                                {{
                                  invoiceTemplateData.templateData.CPAData
                                    .address1
                                }},
                              </span>
                            </td>
                          </tr>
                          <tr
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
                                  color: #707070;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >
                                {{
                                  invoiceTemplateData.templateData.CPAData.city
                                }},
                                {{
                                  invoiceTemplateData.templateData.CPAData
                                    .state
                                }},
                              </span>
                            </td>
                          </tr>
                          <tr
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
                                  color: #707070;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >
                                {{
                                  `${invoiceTemplateData.templateData.CPAData.country} - ${invoiceTemplateData.templateData.CPAData.postalCode}`
                                }}.
                              </span>
                            </td>
                          </tr>
                          <!-- Spacer 10 start -->
                          <BillingInvoiceTemplateRowSpacer :height="10" />
                          <!-- Spacer 10 end -->
                        </table>
                        <!-- CPA address block end -->
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
                        align="right"
                        style="
                          box-sizing: border-box;
                          font-family: Arial, Helvetica, sans-serif;
                          line-height: normal;
                          margin: 0 auto;
                        "
                      >
                        <!-- Invoice details block start -->
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
                            style="box-sizing: border-box; line-height: normal"
                          >
                            <td
                              valign="top"
                              align="right"
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
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >Invoice Number:</span>
                            </td>
                            <td
                              valign="top"
                              align="left"
                              style="
                                box-sizing: border-box;
                                font-family: Arial, Helvetica, sans-serif;
                                line-height: normal;
                                margin: 0 auto;
                                padding-left: 5px;
                              "
                            >
                              <span
                                style="
                                  box-sizing: border-box;
                                  color: #707070;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >
                                {{
                                  invoiceTemplateData.templateData.invoiceNumber
                                }}
                              </span>
                            </td>
                          </tr>
                          <tr
                            style="box-sizing: border-box; line-height: normal"
                          >
                            <td
                              valign="top"
                              align="right"
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
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >Invoice Date:</span>
                            </td>
                            <td
                              valign="top"
                              align="left"
                              style="
                                box-sizing: border-box;
                                font-family: Arial, Helvetica, sans-serif;
                                line-height: normal;
                                margin: 0 auto;
                                padding-left: 5px;
                              "
                            >
                              <span
                                style="
                                  box-sizing: border-box;
                                  color: #707070;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >
                                {{
                                  dateToHumanShort(
                                    invoiceTemplateData.templateData
                                      .invoiceDate,
                                    'YYYY-MM-DD',
                                  )
                                }}
                              </span>
                            </td>
                          </tr>
                          <tr
                            style="box-sizing: border-box; line-height: normal"
                          >
                            <td
                              valign="top"
                              align="right"
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
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >Payment Terms:</span>
                            </td>
                            <td
                              valign="top"
                              align="left"
                              style="
                                box-sizing: border-box;
                                font-family: Arial, Helvetica, sans-serif;
                                line-height: normal;
                                margin: 0 auto;
                                padding-left: 5px;
                              "
                            >
                              <span
                                style="
                                  box-sizing: border-box;
                                  color: #707070;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >Due on Receipt</span>
                            </td>
                          </tr>
                          <tr
                            style="box-sizing: border-box; line-height: normal"
                          >
                            <td
                              valign="top"
                              align="right"
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
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >Due Date:</span>
                            </td>
                            <td
                              valign="top"
                              align="left"
                              style="
                                box-sizing: border-box;
                                font-family: Arial, Helvetica, sans-serif;
                                line-height: normal;
                                margin: 0 auto;
                                padding-left: 5px;
                              "
                            >
                              <span
                                style="
                                  box-sizing: border-box;
                                  color: #707070;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                "
                              >
                                {{
                                  dateToHumanShort(
                                    invoiceTemplateData.templateData.dueDate,
                                    'YYYY-MM-DD',
                                  )
                                }}
                              </span>
                            </td>
                          </tr>
                        </table>
                        <!-- Invoice details block end -->
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
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss" scoped></style>
