<script lang="ts" setup>
async function handleGoogleLogin() {
  const data = await useAuthGoogleSignIn();
  if (data && data.link) {
    window.location.href = data.link;
  }
}
</script>

<template>
  <Button
    class="w-full font-medium border-1 surface-border px-2 p-component p-button-outlined hover:bg-primary text-gray-900 cursor-pointer transition-colors transition-duration-150 inline-flex align-items-center justify-content-center"
    @click.prevent="handleGoogleLogin"
  >
    <i class="pi pi-google text-pink-400 mr-2" />
    <span>Sign in with Google</span>
  </Button>
</template>
