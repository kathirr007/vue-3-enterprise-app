<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    listProps?: Record<string, any>;
    placeholder?: string;
    autoRightMargin?: boolean;
  }>(),
  {
    autoRightMargin: true,
  }
);

const { isLarge } = useCommonBreakPoints();
const { searchTerms, searchText, searchValidationMessage } =
  useDataTableUtils();
</script>

<template>
  <div :class="{ 'mr-auto': autoRightMargin, 'w-7': !isLarge }">
    <div class="p-input-icon-left">
      <i class="pi pi-search" />
      <InputText
        aria-label="Search List"
        v-model="searchText"
        @input="searchTerms(listProps)"
        :placeholder="placeholder || 'Search List'"
        inputClass="w-full"
        type="search"
        name="searchText"
        class="w-full"
        :class="{
          'p-invalid': searchValidationMessage['searchText'],
        }"
      />
    </div>
    <transition mode="out-in" name="field-slide-down">
      <FormFeedbackMessage
        :errors="searchValidationMessage"
        :errorKey="'searchText'"
        :feedback="false"
      />
    </transition>
  </div>
</template>

<style lang="scss" scoped></style>
