<script setup lang="ts"></script>

<template>
  <div class="px-3">
    <div class="flex justify-content-between align-items-center">
      <div class="font-medium text-lg flex-1">
        Setup from Scratch
        <p class="font-normal text-base mt-1">
          Set up a new project template from scratch and use it to create
          projects.
        </p>
      </div>
      <Button
        label="Create New"
        class="p-button-outlined"
        @click="
          $router.push({
            name: 'admin-services-create',
            query: { type: 'scratch' },
          })
        "
      />
    </div>
    <Divider />
    <div class="flex justify-content-between align-items-center">
      <div class="font-medium text-lg flex-1">
        Setup from Template
        <p class="font-normal text-base mt-1">
          Set up a new project template using predefined or already existing
          templates and use it to create a project.
        </p>
      </div>
      <Button
        label="Use Template"
        class="p-button-outlined"
        @click="
          $router.push({
            name: 'admin-services-create',
            query: { type: 'template' },
          })
        "
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
