<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    height?: number;
    background?: string;
  }>(),
  {
    height: 15,
  }
);
</script>

<template>
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
      :height="height"
      :style="{ backgroundColor: background }"
    >
      &nbsp;
    </td>
  </tr>
</template>
