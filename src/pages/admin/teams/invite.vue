<script setup lang="ts"></script>

<template>
  <CommonPage
    title="Great, let's invite Team Member(s)  now."
    help-actions-classes="-mb-2"
  >
    <!-- <template #helpActions>
      <Button
        type="button"
        icon="pi pi-video"
        class="p-button"
        label="Help?"
        @click="$router.push('')"
      ></Button>
    </template> -->
    <template #helpActions>
      <div class="w-full max-w-26rem mx-auto">
        <a
          href="#"
          class="font-medium flex justify-content-end align-items-center"
        ><i
           class="pi pi-youtube p-button-icon p-button-icon-left text-3xl text-primary mr-1 mt-1"
         />
          <span>Help</span></a>
      </div>
    </template>

    <div class="card">
      <TeamsInviteTeam />
    </div>
  </CommonPage>
</template>
