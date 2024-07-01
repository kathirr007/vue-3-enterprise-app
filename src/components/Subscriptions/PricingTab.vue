<script setup lang="ts">
import type { Plan, Pricing, SessionPayload } from '@/types/subscription.type';
import { useMutation, useQueryClient } from 'vue-query';

const props = defineProps<{
  yearly: boolean;
  starter?: boolean;
  enterprise?: boolean;
  freemium?: boolean;
  plan: Plan;
  currentPlan?: string;
  addOnStatus?: boolean;
  userLimit?: number;
  contractLimit?: number;
  onTrial?: boolean;
}>();

const emit = defineEmits<{
  (e: 'upgrade'): void;
}>();

const { initToast } = useToasts();
const queryClient = useQueryClient();
const { defaultBreakpoints, styles } = useCommonBreakPoints();

const selectedQuantity = ref<number>(
  props?.onTrial ? 1 : props?.userLimit ?? props?.contractLimit ?? 1
);
const showAddonDialog = ref(false);
const showUpdateDialog = ref(false);
const showContactDialog = ref(false);

const selectedStarter = ref({
  title: 'YEARLY',
  year: 1,
  amount: props.plan.pricingConfiguration?.YEARLY.amount,
  priceId: props.plan.pricingConfiguration?.YEARLY.priceId
});

const yearlyAmount = computed(() => {
  return props.plan.pricingConfiguration?.YEARLY?.amount;
});

const monthlyAmount = computed(() => {
  return props.plan.pricingConfiguration?.MONTHLY?.amount;
});

const calculatedAmount = computed(() => {
  if (props.starter) {
    return selectedStarter.value?.amount || 0;
  }
  const baseAmount = props.yearly ? yearlyAmount.value : monthlyAmount.value;
  const selectedYear = selectedQuantity.value || 1;
  return baseAmount !== undefined ? baseAmount * selectedYear : 0;
});

const planUsersLimit = computed(() => {
  switch (props.plan.id) {
    case 'FREEMIUM':
      return {
        limitText: 'Limited to up to 2 users only.',
        limit: 2
      };
    case 'STARTER':
      return {
        limit: 3,
        limitText: `Limited to up to 3 users only.`
      };
    case 'VALUE':
    case 'GROWTH':
    case 'CONTRACTUAL_TEAM':
      return { limit: 50, limitText: 'Limited to up to 50 users only.' };

    default:
      break;
  }
});

function generateOptions(start: number, end: number): number[] {
  const options = [];
  for (let i = start; i <= end; i++) {
    options.push(i);
  }
  return options;
}

function starterOptions(): Pricing[] {
  const options: Pricing[] = [];
  let index = 1;
  for (const [key, value] of Object.entries(
    props.plan.pricingConfiguration || {}
  )) {
    options.push({
      title: key,
      amount: value.amount,
      year: index++,
      priceId: value.priceId
    });
  }
  return options;
}

const { mutateAsync: createStripeSession, isLoading: creatingStripeSession }
  = useMutation(
    (payload: SessionPayload) => {
      return startStripeSession(payload);
    },
    {
      onSuccess: (data) => {
        if (data.url) {
          window.open(data.url, '_blank');
        }
        else {
          queryClient.invalidateQueries('customer-details');
          queryClient.invalidateQueries('subscription-plans');
          showUpdateDialog.value = false;
        }
      }
    }
  );

const { mutateAsync: createStripeAddOn, isLoading: creatingAddOn }
  = useMutation(
    (payload: SessionPayload) => {
      return startStripeAddOn(payload);
    },
    {
      onSuccess: (data) => {
        initToast({
          actionType: 'Update',
          summary: 'AddOn Subscription Update',
          detail: 'AddOn Subscription updated successfully'
        });
        queryClient.invalidateQueries('customer-details');
        queryClient.invalidateQueries('subscription-plans');
        showAddonDialog.value = false;
      }
    }
  );

async function handleSubscribe(plan: Plan) {
  let priceId = props.yearly
    ? props.plan.pricingConfiguration?.YEARLY.priceId
    : props.plan.pricingConfiguration?.MONTHLY
      ? props.plan.pricingConfiguration?.MONTHLY.priceId
      : '';
  let years = selectedQuantity.value;
  if (props.starter) {
    priceId = selectedStarter.value.priceId;
    years = selectedStarter.value.year;
  }
  const payload = {
    priceId: plan.id === 'FREEMIUM' ? 'FREEMIUM' : priceId,
    quantity: years
  };
  await createStripeSession(payload);
}

function handleButtonClick(plan: Plan) {
  if (props.currentPlan) {
    showUpdateDialog.value = true;
  }
  else {
    handleSubscribe(plan);
  }
}

async function handleAddOn() {
  const priceId = props.yearly
    ? props.plan.pricingConfiguration?.YEARLY.priceId
    : props.plan.pricingConfiguration?.MONTHLY
      ? props.plan.pricingConfiguration?.MONTHLY.priceId
      : '';
  const years = selectedQuantity.value;
  const payload = {
    priceId,
    quantity: years
  };
  await createStripeAddOn(payload);
}

function isUserPlan(plan: Plan) {
  return plan.id !== 'CONTRACTUAL_TEAM';
}

function updateSelectedQuantity(event: Event) {
  const targetValue = +(event.target as HTMLInputElement).value;
  if (targetValue > (planUsersLimit.value?.limit as number)) {
    selectedQuantity.value = planUsersLimit.value?.limit as number;
  }
  else {
    selectedQuantity.value = +(event.target as HTMLInputElement).value;
  }
}

watch(
  () => props.yearly,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      selectedQuantity.value = 1;
    }
  },
  { deep: true }
);
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div
    v-if="
      onTrial
        || !currentPlan
        || (!!currentPlan && (plan.id === currentPlan || addOnStatus))
    "
    class="relative flex flex-column h-full p-4 border-round-2xl border-solid border-gray-200 shadow-2 shadow-gray-900"
  >
    <div
      v-if="plan.id === currentPlan || (!isUserPlan(plan) && contractLimit)"
      class="absolute top-0 right-0 mr-2 -mt-3"
    >
      <div
        class="inline-flex align-items-center text-sm font-semibold px-3 py-2 bg-green-500 text-white border-round-xl shadow-2 shadow-gray-900"
      >
        Current Plan
      </div>
    </div>
    <div class="mb-3">
      <div
        class="flex align-items-center gap-2 text-gray-900 font-bold text-xl"
      >
        <span>{{ plan.name }}</span>
        <span
          v-if="plan.id === currentPlan || (!isUserPlan(plan) && contractLimit)"
          class="text-gray-600 font-semibold text-lg white-space-nowrap"
        >( Users - {{ userLimit || contractLimit }} )</span>
      </div>
      <Divider />
      <div v-if="freemium" class="inline-flex align-items-baseline mb-2">
        <span class="text-gray-900 font-bold text-3xl">$</span>
        <span class="text-gray-900 font-bold text-4xl">0</span>
      </div>
      <div
        v-if="!enterprise && !freemium"
        class="inline-flex align-items-baseline mb-2"
      >
        <span class="text-gray-900 font-bold text-3xl">$</span>
        <span class="text-gray-900 font-bold text-4xl">{{
          calculatedAmount
        }}</span>
        <span class="text-gray-500 font-medium">{{
          plan.id === 'STARTER'
            ? '/year per 3 users'
            : yearly
              ? `/year per ${
                selectedQuantity > 1 ? `${selectedQuantity} users` : 'user'
              }`
              : `/month per ${
                selectedQuantity > 1 ? `${selectedQuantity} users` : 'user'
              }`
        }}</span>
      </div>
      <div
        class="text-sm font-semibold text-gray-500 my-3"
        style="min-height: 3rem;"
      >
        {{ plan.description }}
      </div>
      <div
        v-if="plan.id === 'STARTER' && currentPlan !== 'STARTER'"
        class="flex align-items-center justify-content-between"
      >
        <div class="text-gray-900 font-medium w-6">
          Years
        </div>
        <Dropdown
          v-model="selectedStarter"
          :options="starterOptions()"
          option-label="year"
          class="w-4 mt-1 mb-3"
        />
      </div>
      <div
        v-if="plan.enableQuantityUpdate"
        class="flex align-items-center justify-content-between"
      >
        <div class="text-gray-900 font-medium w-6">
          No. of Users
        </div>
        <Dropdown
          v-model="selectedQuantity"
          editable
          :options="generateOptions(1, planUsersLimit?.limit as number)"
          class="w-4 mt-1 mb-3"
          option-label=""
          @input="updateSelectedQuantity($event)"
          @blur="updateSelectedQuantity($event)"
        />
      </div>
    </div>
    <div class="flex-1 flex align-items-end">
      <template v-if="plan.id !== 'CONTRACTUAL_TEAM'">
        <a
          v-if="enterprise"
          class="text-center font-medium p-button p-button-primary contact-btn w-full justify-content-center"
          href="mailto:help@brightreturn.com.com"
        >Contact Us</a>
        <a
          v-else-if="plan.id === currentPlan && currentPlan === 'FREEMIUM'"
          class="text-center font-medium p-button p-button-primary contact-btn w-full justify-content-center"
          @click="emit('upgrade')"
        >Upgrade</a>
        <div
          v-else
          class="flex flex-column align-items-center gap-3 justify-content-between w-full"
        >
          <div class="text-center">
            <span class="inline-block text-center mb-2 font-medium text-primary">
              {{ planUsersLimit?.limitText }}
            </span>
            <Button
              v-if="currentPlan !== 'STARTER'"
              :loading="creatingStripeSession"
              :disabled="
                !!currentPlan
                  && !onTrial
                  && plan.id !== currentPlan
                  && !enterprise
              "
              class="font-medium w-full inline-flex justify-content-center whitespace-nowrap border-round-md px-3 font-medium text-white shadow-2 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 cursor-pointer dark:focus-visible:ring-gray-600 transition-colors duration-150"
              style="line-height: 21.6px;"
              @click="handleButtonClick(plan)"
            >
              <span
                v-if="creatingStripeSession"
                class="pi pi-spin pi-spinner mr-2"
              />
              {{
                !!currentPlan && plan.id === currentPlan
                  ? 'Update Users'
                  : plan.id === 'FREEMIUM'
                    ? 'Try Now'
                    : 'Subscribe'
              }}
            </Button>
          </div>
          <Button
            v-if="currentPlan && !onTrial"
            class="font-medium w-full inline-flex justify-content-center whitespace-nowrap border-round-md px-3 font-medium text-white shadow-2 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 cursor-pointer dark:focus-visible:ring-gray-600 transition-colors duration-150"
            style="line-height: 21.6px;"
            @click="showContactDialog = true"
          >
            Manage
          </Button>
        </div>
      </template>
      <!-- <Button
        v-if="plan.id !== 'CONTRACTUAL_TEAM'"
        :loading="creatingStripeSession"
        :disabled="!!currentPlan && plan.id !== currentPlan && !enterprise"
        class="w-full mt-3 inline-flex justify-content-center whitespace-nowrap border-round-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white shadow-2  hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 cursor-pointer dark:focus-visible:ring-gray-600 transition-colors duration-150"
        @click="handleSubscribe"
      >
        <span
          v-if="creatingStripeSession"
          class="pi pi-spin pi-spinner mr-2"
        ></span>
        {{
          enterprise
            ? 'Contact Us'
            : !!currentPlan && plan.id === currentPlan
            ? 'Upgrade'
            : 'Subscribe '
        }}
      </Button> -->
      <div
        v-if="plan.id === 'CONTRACTUAL_TEAM'"
        class="flex flex-column align-items-center w-full"
      >
        <Button
          :loading="creatingAddOn"
          :disabled="
            onTrial
              || (!addOnStatus && currentPlan === 'STARTER')
              || !currentPlan
          "
          class="w-full mt-3 inline-flex justify-content-center whitespace-nowrap border-round-md px-3 font-medium text-white shadow-2 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 cursor-pointer dark:focus-visible:ring-gray-600 transition-colors duration-150"
          style="line-height: 21.6px;"
          @click="showAddonDialog = true"
        >
          <span v-if="creatingAddOn" class="pi pi-spin pi-spinner mr-2" />{{ contractLimit ? 'Update Users' : 'Subscribe' }}
        </Button>
        <Button
          v-if="currentPlan && !onTrial && contractLimit"
          class="font-medium mt-3 w-full inline-flex justify-content-center whitespace-nowrap border-round-md px-3 font-medium text-white shadow-2 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 cursor-pointer dark:focus-visible:ring-gray-600 transition-colors duration-150"
          style="line-height: 21.6px;"
          @click="showContactDialog = true"
        >
          Manage
        </Button>
      </div>
    </div>
  </div>
  <Dialog
    v-model:visible="showContactDialog"
    :modal="true"
    append-to="body"
    header="Manage Subscription Plan"
    :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="showContactDialog = false"
  >
    <p class="">
      To Upgrade/Cancel your subscription plan, please Contact
      <a class="font-medium underline" href="mailto:help@brightreturn.com">help@brightreturn.com</a>
      for assistance.
    </p>
  </Dialog>
  <Dialog
    v-model:visible="showUpdateDialog"
    :modal="true"
    append-to="body"
    header="Update Users"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '40vw' }"
    content-class="border-round-bottom-md"
    @hide="showUpdateDialog = false"
  >
    <p class="font-normal">
      Your current subscription will be updated for
      <b v-if="plan.id === 'STARTER'">
        {{
          selectedStarter.year > 1
            ? `${selectedStarter.year} years`
            : `${selectedStarter.year} year`
        }}
      </b>
      <b v-else>
        {{
          selectedQuantity > 1
            ? `${selectedQuantity} users`
            : `${selectedQuantity} user`
        }}
      </b>
      and it will add charges to your current subscription. Do you want to
      proceed?
    </p>
    <div class="flex mt-4 align-items-center justify-content-between w-full">
      <Button severity="danger" @click="showUpdateDialog = false">
        Cancel
      </Button>
      <Button :loading="creatingStripeSession" @click="handleSubscribe(plan)">
        <span
          v-if="creatingStripeSession"
          class="pi pi-spin pi-spinner mr-2"
        />Continue
      </Button>
    </div>
  </Dialog>
  <Dialog
    v-model:visible="showAddonDialog"
    :modal="true"
    append-to="body"
    header="Add Outsourced Team Subscription"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '40vw' }"
    content-class="border-round-bottom-md"
    @hide="showAddonDialog = false"
  >
    <p class="font-normal">
      Your current subscription will be updated with this add on for
      <b>
        {{
          selectedQuantity > 1
            ? `${selectedQuantity} users`
            : `${selectedQuantity} user`
        }}</b>
      and it will add charges to your current subscription. Do you want to
      proceed ?
    </p>
    <div class="flex mt-4 align-items-center justify-content-between w-full">
      <Button severity="danger" @click="showAddonDialog = false">
        Cancel
      </Button>
      <Button :loading="creatingAddOn" @click="handleAddOn">
        <span v-if="creatingAddOn" class="pi pi-spin pi-spinner mr-2" />Continue
      </Button>
    </div>
  </Dialog>
</template>

<style lang="scss">
.contact-btn:hover {
  background-color: $primaryDarkColor;
  border-color: $primaryDarkColor;
}
</style>
