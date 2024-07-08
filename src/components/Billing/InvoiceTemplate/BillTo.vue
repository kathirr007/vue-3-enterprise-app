<script setup lang="ts">
import type { InvoiceTemplate } from '@/types/client-billing-invoices.type';

const invoiceTemplateData = inject(
  'invoiceTemplateData'
) as Ref<InvoiceTemplate>;
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
                        <table
                          border="0"
                          cellspacing="0"
                          cellpadding="0"
                          width="50%"
                          class="full"
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
                                padding-bottom: 10px;
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
                              >Bill To:</span>
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
                                  font-weight: bold;
                                "
                              >Name</span>
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
                                  invoiceTemplateData.templateData.billTo.name
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
                                  font-weight: bold;
                                "
                              >Address</span>
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
                                  `${invoiceTemplateData.templateData.billTo.address1},
                                ${invoiceTemplateData.templateData.billTo.city},
                                ${invoiceTemplateData.templateData.billTo.state},`
                                }}
                                <br>
                                {{
                                  `${invoiceTemplateData.templateData.billTo.country}
                                -
                                ${invoiceTemplateData.templateData.billTo.postalCode}.`
                                }}
                              </span>
                            </td>
                          </tr>
                          <!-- <tr
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
                                >Email</span
                              >
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
                              <a
                                class="text-black"
                                href="mailto:golflover2212@yahoo.com"
                                target="_blank"
                                style="
                                  box-sizing: border-box;
                                  color: #010101;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 14px;
                                  line-height: normal;
                                  margin: 0;
                                  text-decoration: none;
                                "
                                >golflover2212@yahoo.com</a
                              >
                            </td>
                          </tr> -->
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer 40 start -->
              <tr style="box-sizing: border-box; line-height: normal">
                <td
                  class="spacer"
                  valign="top"
                  style="
                    box-sizing: border-box;
                    font-family: 'futura', Arial, Helvetica, sans-serif;
                    font-size: 1px !important;
                    line-height: 1px !important;
                    mso-line-height-rule: exactly;
                  "
                  height="40"
                >
                  &nbsp;
                </td>
              </tr>
              <!-- Spacer 40 end -->
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss" scoped></style>
