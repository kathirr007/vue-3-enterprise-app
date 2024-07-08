<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    listProps?: Record<string, any>;
    placeholder?: string;
    autoRightMargin?: boolean;
  }>(),
  {
    autoRightMargin: true
  }
);

const { isLarge } = useCommonBreakPoints();
const { searchTerms, searchText, searchValidationMessage }
  = useDataTableUtils();
</script>

<template>
  <div :class="{ 'mr-auto': autoRightMargin, 'w-7': !isLarge }">
    <div class="p-input-icon-left">
      <i class="pi pi-search" />
      <InputText
        v-model="searchText"
        aria-label="Search List"
        :placeholder="placeholder || 'Search List'"
        input-class="w-full"
        type="search"
        name="searchText"
        class="w-full"
        :class="{
          'p-invalid': searchValidationMessage.searchText,
        }"
        @input="searchTerms(listProps)"
      />
    </div>
    <transition mode="out-in" name="field-slide-down">
      <FormFeedbackMessage
        :errors="searchValidationMessage"
        error-key="searchText"
        :feedback="false"
      />
    </transition>
  </div>
</template>

<style lang="scss" scoped></style>
