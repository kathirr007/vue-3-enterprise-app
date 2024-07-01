<script setup lang="ts">
import type { InvoiceTemplate } from '@/types/client-billing-invoices.type';

const invoiceTemplateData = inject(
  'invoiceTemplateData'
) as Ref<InvoiceTemplate>;

const { getInlCurrencyNumber } = useVueFilters();
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
                valign="top"
                align="right"
                style="
                  box-sizing: border-box;
                  font-family: Arial, Helvetica, sans-serif;
                  line-height: normal;
                  margin: 0 auto;
                "
              >
                <!-- Invoice block start-->
                <table
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
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
                          -moz-border-radius: 5px;
                          -webkit-border-radius: 5px;
                          border: 1px solid #d4d4d4;
                          border-radius: 5px;
                          box-sizing: border-box;
                          font-family: Arial;
                          font-size: 16px;
                          line-height: normal;
                          margin: 0 auto;
                          padding-bottom: 15px;
                          padding-left: 30px;
                          padding-right: 30px;
                          padding-top: 15px;
                        "
                      >
                        <table
                          border="0"
                          cellspacing="0"
                          cellpadding="0"
                          style="
                            box-sizing: border-box;
                            empty-cells: hide;
                            line-height: normal;
                            margin: 0;
                            padding: 0;
                          "
                        >
                          <tbody
                            style="box-sizing: border-box; line-height: normal"
                          >
                            <tr
                              style="
                                box-sizing: border-box;
                                line-height: normal;
                              "
                            >
                              <td
                                class="text-center"
                                valign="top"
                                align="center"
                                style="
                                  box-sizing: border-box;
                                  color: #707070;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 16px;
                                  line-height: normal;
                                  margin: 0 auto;
                                "
                              >
                                Amount Due:
                              </td>
                            </tr>
                            <tr
                              style="
                                box-sizing: border-box;
                                line-height: normal;
                              "
                            >
                              <td
                                class="text-center"
                                valign="top"
                                align="center"
                                style="
                                  box-sizing: border-box;
                                  color: #292929;
                                  font-family: Arial, Helvetica, sans-serif;
                                  font-size: 18px;
                                  font-weight: bold;
                                  line-height: normal;
                                  margin: 0 auto;
                                "
                              >
                                {{
                                  getInlCurrencyNumber(
                                    invoiceTemplateData.templateData.dueAmount
                                  )
                                }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <!-- Invoice block end-->
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss" scoped></style>
