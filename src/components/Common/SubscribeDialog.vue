<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    closeOnEscape?: boolean;
    feature?: string;
  }>(),
  { closeOnEscape: true }
);

const emit = defineEmits<{
  (e: 'cancel'): void;
}>();

const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { titleCase } = useVueFilters();
const router = useRouter();
const { canAccessAllMenu } = usePermissions();

const isDialogVisible = ref(props.visible);

function handleUpgrade() {
  router.push({ name: 'admin-subscription' });
  isDialogVisible.value = false;
}

function closeModal() {
  emit('cancel');
  isDialogVisible.value = false;
}
</script>

<template>
  <Dialog
    v-model:visible="isDialogVisible"
    :style="styles"
    :breakpoints="defaultBreakpoints"
    header="Upgrade Required"
    :feature="feature"
    :modal="true"
    :close-on-escape="closeOnEscape"
  >
    <template #closeicon>
      <button
        class="p-dialog-header-icon p-dialog-header-close p-link"
        aria-label="Close"
        type="button"
        data-pc-section="closebutton"
        data-pd-ripple="true"
        @click="closeModal"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="p-icon p-dialog-header-close-icon"
          aria-hidden="true"
          data-pc-section="closebuttonicon"
        >
          <path
            d="M8.01186 7.00933L12.27 2.75116C12.341 2.68501 12.398 2.60524 12.4375 2.51661C12.4769 2.42798 12.4982 2.3323 12.4999 2.23529C12.5016 2.13827 12.4838 2.0419 12.4474 1.95194C12.4111 1.86197 12.357 1.78024 12.2884 1.71163C12.2198 1.64302 12.138 1.58893 12.0481 1.55259C11.9581 1.51625 11.8617 1.4984 11.7647 1.50011C11.6677 1.50182 11.572 1.52306 11.4834 1.56255C11.3948 1.60204 11.315 1.65898 11.2488 1.72997L6.99067 5.98814L2.7325 1.72997C2.59553 1.60234 2.41437 1.53286 2.22718 1.53616C2.03999 1.53946 1.8614 1.61529 1.72901 1.74767C1.59663 1.88006 1.5208 2.05865 1.5175 2.24584C1.5142 2.43303 1.58368 2.61419 1.71131 2.75116L5.96948 7.00933L1.71131 11.2675C1.576 11.403 1.5 11.5866 1.5 11.7781C1.5 11.9696 1.576 12.1532 1.71131 12.2887C1.84679 12.424 2.03043 12.5 2.2219 12.5C2.41338 12.5 2.59702 12.424 2.7325 12.2887L6.99067 8.03052L11.2488 12.2887C11.3843 12.424 11.568 12.5 11.7594 12.5C11.9509 12.5 12.1346 12.424 12.27 12.2887C12.4053 12.1532 12.4813 11.9696 12.4813 11.7781C12.4813 11.5866 12.4053 11.403 12.27 11.2675L8.01186 7.00933Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </template>
    <!-- <template #header>
      <h1 class="text-red-500 font-bold text-2xl">Upgrade Required</h1>
    </template> -->
    <div v-if="canAccessAllMenu">
      <div class="flex align-items-center justify-content-center">
        <slot>
          <div>
            To access
            <span class="font-bold text-primary">{{
              titleCase(feature || 'feature')
            }}</span>, please upgrade your subscription plan.
          </div>
        </slot>
      </div>
    </div>
    <div v-else>
      <div class="flex align-items-center justify-content-center">
        <slot>
          <div>
            To access the
            <span class="font-bold text-primary">{{
              titleCase(feature || 'feature')
            }}</span>, please contact your admin to upgrade the subscription plan.
          </div>
        </slot>
      </div>
    </div>
    <template v-if="canAccessAllMenu" #footer>
      <div class="flex align-items-center justify-content-center">
        <Button @click="handleUpgrade">
          Upgrade
        </Button>
      </div>
    </template>
  </Dialog>
</template>

<!-- <style scoped lang="scss">
:deep(.p-dialog) {
  .p-dialog-header {
    padding-bottom: 0;
  }
}
</style> -->
