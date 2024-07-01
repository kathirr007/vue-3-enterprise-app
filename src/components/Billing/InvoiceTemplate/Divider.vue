<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    topSpace?: boolean;
    bottomSpace?: boolean;
    topSpaceHeight?: number;
    bottomSpaceHeight?: number;
    dividerHeight?: number;
    dividerBackground?: string;
  }>(),
  {
    topSpace: true,
    bottomSpace: true,
    topSpaceHeight: 20,
    bottomSpaceHeight: 20,
    dividerHeight: 1,
    dividerBackground: '#d4d4d4',
  }
);
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
            <!-- Spacer 20 start-->
            <BillingInvoiceTemplateRowSpacer
              v-if="topSpace"
              :height="topSpaceHeight"
            />
            <!-- Spacer 20 end-->
            <BillingInvoiceTemplateRowSpacer
              :height="dividerHeight"
              :background="dividerBackground"
            />
            <!-- Spacer 20 start-->
            <BillingInvoiceTemplateRowSpacer
              v-if="bottomSpace"
              :height="bottomSpaceHeight"
            />
            <!-- Spacer 20 end-->
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</template>
