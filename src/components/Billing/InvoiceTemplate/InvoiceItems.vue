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
                          border: 1px solid #d4d4d4;
                          box-sizing: border-box;
                          font-family: Arial, Helvetica, sans-serif;
                          font-size: 12px;
                          line-height: normal;
                          margin: 0 auto;
                        "
                      >
                        <table
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
                          <thead
                            style="
                              background-color: #f9f9f9;
                              box-sizing: border-box;
                              line-height: normal;
                            "
                          >
                            <tr
                              style="
                                background-color: #f9f9f9;
                                box-sizing: border-box;
                                line-height: normal;
                              "
                            >
                              <th
                                valign="top"
                                align="left"
                                style="
                                  border-bottom: 1px solid #d4d4d4;
                                  box-sizing: border-box;
                                  font-weight: bold;
                                  line-height: normal;
                                  padding-bottom: 10px;
                                  padding-left: 10px;
                                  padding-right: 10px;
                                  padding-top: 10px;
                                "
                              >
                                Description
                              </th>
                              <th
                                valign="top"
                                align="center"
                                style="
                                  border-bottom: 1px solid #d4d4d4;
                                  box-sizing: border-box;
                                  font-weight: bold;
                                  line-height: normal;
                                  padding-bottom: 10px;
                                  padding-left: 10px;
                                  padding-right: 10px;
                                  padding-top: 10px;
                                "
                                width="13%"
                              >
                                Quantity
                              </th>
                              <th
                                valign="top"
                                align="right"
                                style="
                                  border-bottom: 1px solid #d4d4d4;
                                  box-sizing: border-box;
                                  font-weight: bold;
                                  line-height: normal;
                                  padding-bottom: 10px;
                                  padding-left: 10px;
                                  padding-right: 30px;
                                  padding-top: 10px;
                                "
                                width="21%"
                              >
                                Price
                              </th>
                              <th
                                valign="top"
                                align="right"
                                style="
                                  border-bottom: 1px solid #d4d4d4;
                                  box-sizing: border-box;
                                  font-weight: bold;
                                  line-height: normal;
                                  padding-bottom: 10px;
                                  padding-left: 10px;
                                  padding-right: 30px;
                                  padding-top: 10px;
                                "
                                width="21%"
                              >
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody
                            style="box-sizing: border-box; line-height: normal"
                          >
                            <tr
                              v-for="(item, index) in invoiceTemplateData
                                .templateData.lineItem"
                              :key="index"
                              style="
                                box-sizing: border-box;
                                line-height: normal;
                              "
                            >
                              <td
                                valign="top"
                                align="left"
                                style="
                                  border-bottom: 1px solid #d4d4d4;
                                  box-sizing: border-box;
                                  font-family: Arial, Helvetica, sans-serif;
                                  line-height: normal;
                                  margin: 0 auto;
                                  padding-bottom: 10px;
                                  padding-left: 10px;
                                  padding-right: 10px;
                                  padding-top: 10px;
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
                                  {{ item.description }}
                                </span>
                              </td>
                              <td
                                valign="top"
                                align="center"
                                style="
                                  border-bottom: 1px solid #d4d4d4;
                                  box-sizing: border-box;
                                  font-family: Arial, Helvetica, sans-serif;
                                  line-height: normal;
                                  margin: 0 auto;
                                  padding-bottom: 10px;
                                  padding-left: 10px;
                                  padding-right: 10px;
                                  padding-top: 10px;
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
                                  {{ item.quantity }}
                                </span>
                              </td>
                              <td
                                valign="top"
                                align="left"
                                style="
                                  border-bottom: 1px solid #d4d4d4;
                                  box-sizing: border-box;
                                  font-family: Arial, Helvetica, sans-serif;
                                  line-height: normal;
                                  margin: 0 auto;
                                  padding-bottom: 10px;
                                  padding-left: 10px;
                                  padding-right: 10px;
                                  padding-top: 10px;
                                "
                              >
                                <table
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
                                  <tr
                                    style="
                                      box-sizing: border-box;
                                      line-height: normal;
                                    "
                                  >
                                    <td
                                      valign="top"
                                      align="right"
                                      style="
                                        box-sizing: border-box;
                                        font-family: Arial, Helvetica,
                                          sans-serif;
                                        line-height: normal;
                                        margin: 0 auto;
                                        padding-bottom: 5px;
                                        padding-right: 10px;
                                      "
                                    >
                                      <span
                                        style="
                                          box-sizing: border-box;
                                          color: #707070;
                                          font-family: Arial, Helvetica,
                                            sans-serif;
                                          font-size: 14px;
                                          line-height: normal;
                                          margin: 0;
                                        "
                                      >
                                        {{ getInlCurrencyNumber(item.price) }}
                                      </span>
                                    </td>
                                  </tr>
                                  <tr
                                    v-if="
                                      index
                                        === invoiceTemplateData.templateData
                                          .lineItem.length
                                        - 1
                                        && invoiceTemplateData.templateData.discount
                                          ?.amount !== 0
                                    "
                                    style="
                                      box-sizing: border-box;
                                      line-height: normal;
                                    "
                                  >
                                    <td
                                      valign="top"
                                      align="right"
                                      style="
                                        box-sizing: border-box;
                                        font-family: Arial, Helvetica,
                                          sans-serif;
                                        line-height: normal;
                                        margin: 0 auto;
                                      "
                                    >
                                      <span
                                        style="
                                          box-sizing: border-box;
                                          color: #707070;
                                          font-family: Arial, Helvetica,
                                            sans-serif;
                                          font-size: 14px;
                                          line-height: normal;
                                          margin: 0;
                                          padding-right: 10px;
                                        "
                                      >
                                        {{
                                          `${
                                            invoiceTemplateData.templateData
                                              .discount?.rate
                                              ? `(${invoiceTemplateData.templateData.discount?.rate}%`
                                              : ''
                                          } Discount${
                                            invoiceTemplateData.templateData
                                              .discount?.rate
                                              ? ')'
                                              : ''
                                          }`
                                        }}
                                      </span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td
                                valign="top"
                                align="left"
                                style="
                                  border-bottom: 1px solid #d4d4d4;
                                  box-sizing: border-box;
                                  font-family: Arial, Helvetica, sans-serif;
                                  line-height: normal;
                                  margin: 0 auto;
                                  padding-bottom: 10px;
                                  padding-left: 10px;
                                  padding-right: 10px;
                                  padding-top: 10px;
                                "
                              >
                                <table
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
                                  <tr
                                    style="
                                      box-sizing: border-box;
                                      line-height: normal;
                                    "
                                  >
                                    <td
                                      valign="top"
                                      align="right"
                                      style="
                                        box-sizing: border-box;
                                        font-family: Arial, Helvetica,
                                          sans-serif;
                                        line-height: normal;
                                        margin: 0 auto;
                                        padding-bottom: 5px;
                                      "
                                    >
                                      <span
                                        style="
                                          box-sizing: border-box;
                                          color: #707070;
                                          font-family: Arial, Helvetica,
                                            sans-serif;
                                          font-size: 14px;
                                          line-height: normal;
                                          margin: 0;
                                        "
                                      >
                                        {{ getInlCurrencyNumber(item.price) }}
                                      </span>
                                    </td>
                                  </tr>
                                  <tr
                                    v-if="
                                      index
                                        === invoiceTemplateData.templateData
                                          .lineItem.length
                                        - 1
                                        && invoiceTemplateData.templateData.discount
                                          ?.amount !== 0
                                    "
                                    style="
                                      box-sizing: border-box;
                                      line-height: normal;
                                    "
                                  >
                                    <td
                                      valign="top"
                                      align="right"
                                      style="
                                        box-sizing: border-box;
                                        font-family: Arial, Helvetica,
                                          sans-serif;
                                        line-height: normal;
                                        margin: 0 auto;
                                      "
                                    >
                                      <span
                                        style="
                                          box-sizing: border-box;
                                          color: #707070;
                                          font-family: Arial, Helvetica,
                                            sans-serif;
                                          font-size: 14px;
                                          line-height: normal;
                                          margin: 0;
                                        "
                                      >
                                        {{
                                          getInlCurrencyNumber(
                                            invoiceTemplateData.templateData
                                              .discount?.amount || 0,
                                          )
                                        }}
                                      </span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <BillingInvoiceTemplateSummary />
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- <tr style="box-sizing: border-box; line-height: normal">
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
                          color: #707070;
                          font-family: Arial, Helvetica, sans-serif;
                          font-size: 12px;
                          font-style: italic;
                          line-height: normal;
                          margin: 0 auto;
                          padding-bottom: 5px;
                          padding-top: 5px;
                        "
                      >
                        * Taxable item
                      </td>
                    </tr>
                  </table>
                </td>
              </tr> -->
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss" scoped></style>
