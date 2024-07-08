<script setup lang="ts"></script>

<template>
  <CommonPage>
    <template #title>
      <div class="flex justify-content-between">
        <h1 class="font-medium text-3xl text-primary mb-0">
          Integrations
        </h1>
      </div>
    </template>
    <template #actions>
      <a href="https://brightreturn.com/kb/integration" target="_blank">
        <Button
          v-tooltip.top="'Need Help'"
          type="button"
          icon="pi pi-question-circle text-lg"
          class="p-button-icon-only p-button-rounded ml-2"
        />
      </a>
    </template>
    <div class="grid">
      <IntegrationsList class="col-12" />
      <!-- <div class="image-container col-4 hidden md:block">
        <img src="/images/robot.png" alt="" />
      </div> -->
    </div>
  </CommonPage>
</template>

<style lang="scss" scoped>
.image-container {
  object-fit: cover;
  img {
    height: 44rem;
  }
}
</style>
