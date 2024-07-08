<script setup lang="ts">
const copyrightText = `Copyright @ ${new Date().getFullYear()}
            Mudrantar Inc`;
</script>

<template>
  <div class="layout-footer">
    <div class="grid">
      <div class="col-12">
        <div class="footer-bottom">
          <h6 class="text-sm">
            {{ copyrightText }}
          </h6>
        </div>
      </div>
    </div>
  </div>
</template>
