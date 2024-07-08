<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: number;
  }>(),
  { width: 750 }
);
</script>

<template>
  <table
    class="full"
    cellpadding="0"
    cellspacing="0"
    width="750"
    style="
      box-sizing: border-box;
      empty-cells: hide;
      line-height: normal;
      margin: 0;
      padding: 0;
    "
  >
    <tbody style="box-sizing: border-box; line-height: normal">
      <BillingInvoiceTemplateRowSpacer />
      <tr style="box-sizing: border-box; line-height: normal">
        <td
          class="border-mob-none shadow-mob-none"
          valign="top"
          align="center"
          style="
            border: 1px solid #eeeeee;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
            line-height: normal;
            margin: 0 auto;
          "
        >
          <table
            cellpadding="0"
            cellspacing="0"
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
                align="center"
                style="
                  box-sizing: border-box;
                  font-family: Arial, Helvetica, sans-serif;
                  line-height: normal;
                  margin: 0 auto;
                "
              >
                <!-- Content block start -->
                <BillingInvoiceTemplateContent />
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <BillingInvoiceTemplateRowSpacer />
    </tbody>
  </table>
</template>

<style lang="scss" scoped></style>
