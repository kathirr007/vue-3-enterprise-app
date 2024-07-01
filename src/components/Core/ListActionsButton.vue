<script setup lang="ts"></script>

<template>
  <Button
    type="button"
    aria-haspopup="true"
    aria-controls="list_actions"
    class="p-2 bg-primary text-onPrimary rounded-lg px-3 hover:bg-primaryVariant"
    icon-pos="right"
  >
    <template v-if="!$attrs.label" #icon>
      <Icon name="fe:elipsis-v" class="w-6 h-6"></Icon>
    </template>
  </Button>
</template>
