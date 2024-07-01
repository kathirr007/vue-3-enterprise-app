/* eslint-disable prettier/prettier */
<script setup lang="ts">
import type { InvoiceTemplate } from '@/types/client-billing-invoices.type';

const invoiceTemplateData = inject<InvoiceTemplate>('invoiceTemplateData');

useHead({
  style: [
    {
      innerHTML: `
      @media screen and (max-width: 576px) {
                .text-black {
                    color: #010101;
                }

                /*Letter spacing styles end*/
                .spacer {
                    font-size: 1px !important;
                    line-height: 1px !important;
                }

                .email-wrapper-table {
                    width: 100%;
                }

                .content-table {
                    width: 95%;
                }

                .full {
                    min-width: 100% !important;
                    width: 100% !important;
                }

                .hide {
                    display: none;
                }

                .full-width {
                    width: 100%;
                }

                .text-center {
                    text-align: center !important;
                }

                .align-center {
                    float: none !important;
                    margin: 0 auto !important;
                }

                .coldrop {
                    display: block;
                    padding: 0;
                    width: 100%;
                }

                /* border-styles */
                .border-mob-none {
                    border: none !important;
                }

                .shadow-mob-none {
                    box-shadow: none !important;
                }
            }
            body {
                margin: 0px;
                padding: 0px;
                -webkit-font-smoothing: antialiased;
                -webkit-text-size-adjust: none !important;
                -ms-text-size-adjust: none !important;
            }

            * {
                line-height: normal;
            }

            a[href^="x-apple-data-detectors:"] {
                color: inherit;
                text-decoration: inherit;
            }

            .spacer {
                line-height: 1px !important;
                font-size: 1px !important;
            }

            a[x-apple-data-detectors] {
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            a {
                text-decoration: none;
            }

            .email-wrapper-table div {
                display: inherit;
            }

            .text-black {
                color: #010101;
            }
      `,
    },
  ],
});
</script>

<template>
  <table
    class="email-wrapper-table"
    cellspacing="0"
    cellpadding="0"
    border="0"
    width="100%"
    bgcolor="#ffffff"
    style="
      background-color: #fff;
      box-sizing: border-box;
      empty-cells: hide;
      line-height: normal;
      margin: 0;
      padding: 0;
    "
  >
    <tr style="box-sizing: border-box; line-height: normal">
      <td
        align="center"
        valign="top"
        style="
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          line-height: normal;
          margin: 0 auto;
        "
      >
        <!-- Gmail Wrapper start-->
        <slot />
      </td>
    </tr>
  </table>
</template>

<style lang="scss" scoped>
.water-mark {
  box-sizing: border-box;
  color: #efefef;
  font-size: 40px;
  line-height: normal;
  margin: 0;
}
</style>
