<script setup lang="ts">
import type { InvoiceTemplate } from '@/types/client-billing-invoices.type';

const invoiceTemplateData = inject(
  'invoiceTemplateData'
) as Ref<InvoiceTemplate>;

const { getInlCurrencyNumber } = useVueFilters();

const subTotal = computed(() => {
  return invoiceTemplateData.value.templateData.lineItem.reduce((acc, curr) => {
    return acc + curr.price;
  }, 0);
});
</script>

<template>
  <tr style="box-sizing: border-box; line-height: normal">
    <td
      colspan="4"
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
            <table
              border="0"
              cellspacing="0"
              cellpadding="0"
              width="300"
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
                    border-left: 1px solid #d4d4d4;
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
                          padding-bottom: 5px;
                          padding-right: 10px;
                          padding-top: 5px;
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
                          >Subtotal</span
                        >
                      </td>
                    </tr>
                    <tr style="box-sizing: border-box; line-height: normal">
                      <td
                        valign="top"
                        align="right"
                        style="
                          box-sizing: border-box;
                          font-family: Arial, Helvetica, sans-serif;
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
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 14px;
                            line-height: normal;
                            margin: 0;
                          "
                          >Item Discounts</span
                        >
                      </td>
                    </tr>
                    <tr style="box-sizing: border-box; line-height: normal">
                      <td
                        valign="top"
                        align="right"
                        style="
                          box-sizing: border-box;
                          font-family: Arial, Helvetica, sans-serif;
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
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 14px;
                            line-height: normal;
                            margin: 0;
                          "
                          >Other Charges</span
                        >
                      </td>
                    </tr>
                    <tr style="box-sizing: border-box; line-height: normal">
                      <td
                        valign="top"
                        align="right"
                        style="
                          box-sizing: border-box;
                          font-family: Arial, Helvetica, sans-serif;
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
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 14px;
                            line-height: normal;
                            margin: 0;
                          "
                          >Tax
                          <template
                            v-if="invoiceTemplateData.templateData.tax?.rate"
                          >
                            {{
                              `(${invoiceTemplateData.templateData.tax?.rate}%)`
                            }}
                          </template>
                        </span>
                      </td>
                    </tr>
                    <tr style="box-sizing: border-box; line-height: normal">
                      <td
                        valign="top"
                        align="right"
                        style="
                          background-color: #f9f9f9;
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
                            color: #292929;
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 14px;
                            font-weight: bold;
                            line-height: normal;
                            margin: 0;
                          "
                          >Total</span
                        >
                      </td>
                    </tr>
                  </table>
                </td>
                <td
                  valign="top"
                  align="right"
                  style="
                    border-left: 1px solid #d4d4d4;
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
                          padding-bottom: 5px;
                          padding-right: 10px;
                          padding-top: 5px;
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
                          {{ getInlCurrencyNumber(subTotal) }}
                        </span>
                      </td>
                    </tr>
                    <tr style="box-sizing: border-box; line-height: normal">
                      <td
                        valign="top"
                        align="right"
                        style="
                          box-sizing: border-box;
                          font-family: Arial, Helvetica, sans-serif;
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
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 14px;
                            line-height: normal;
                            margin: 0;
                          "
                        >
                          {{
                            getInlCurrencyNumber(
                              invoiceTemplateData.templateData.discount
                                ?.amount || 0
                            )
                          }}
                        </span>
                      </td>
                    </tr>
                    <tr style="box-sizing: border-box; line-height: normal">
                      <td
                        valign="top"
                        align="right"
                        style="
                          box-sizing: border-box;
                          font-family: Arial, Helvetica, sans-serif;
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
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 14px;
                            line-height: normal;
                            margin: 0;
                          "
                        >
                          {{
                            getInlCurrencyNumber(
                              invoiceTemplateData.templateData.otherCharges || 0
                            )
                          }}
                        </span>
                      </td>
                    </tr>
                    <tr style="box-sizing: border-box; line-height: normal">
                      <td
                        valign="top"
                        align="right"
                        style="
                          box-sizing: border-box;
                          font-family: Arial, Helvetica, sans-serif;
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
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 14px;
                            line-height: normal;
                            margin: 0;
                          "
                        >
                          {{
                            getInlCurrencyNumber(
                              invoiceTemplateData.templateData.tax?.amount || 0
                            )
                          }}
                        </span>
                      </td>
                    </tr>
                    <tr style="box-sizing: border-box; line-height: normal">
                      <td
                        valign="top"
                        align="right"
                        style="
                          background-color: #f9f9f9;
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
                            color: #292929;
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 14px;
                            font-weight: bold;

                            line-height: normal;
                            margin: 0;
                          "
                        >
                          {{
                            getInlCurrencyNumber(
                              invoiceTemplateData.templateData.total
                            )
                          }}
                          USD
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</template>

<style lang="scss" scoped></style>
