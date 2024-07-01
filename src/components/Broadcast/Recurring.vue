<script setup lang="ts">
import type {
  BroadcastRecurring,
  Interval,
  Recurring,
} from '@/types/broadcast.type';
import dayjs from 'dayjs';
import MultiSelect from 'primevue/multiselect';

const props = defineProps<{
  interval?: Interval;
  recurringBroadcast?: Recurring;
}>();

const emits = defineEmits<{
  (event: 'recurring', recurring: BroadcastRecurring): void;
}>();

const { monthOptions, weekOptions } = useRecurringBroadcast();

const isClearDays = ref(true);

const initialValues = {
  daily: {
    selectedTime: '',
  },
  weekly: {
    weeks: [],
    selectedTime: '',
  },
  monthly: {
    months: [],
    days: [],
    selectedTime: '',
  },
};

const recurring = ref<BroadcastRecurring>(structuredClone(initialValues));

watch(
  () => props.interval,
  (interval) => {
    if (interval) {
      recurring.value = structuredClone(initialValues);
    }
  }
);

const setInitailValues = (val: Recurring) => {
  if (val) {
    isClearDays.value = false;
    switch (props.interval) {
      case 'DAILY': {
        recurring.value.daily.selectedTime = dayjs()
          .set('hour', val.hours)
          .set('minute', val.minutes)
          .toDate();
        break;
      }
      case 'WEEKLY': {
        recurring.value.weekly.selectedTime = dayjs()
          .set('hour', val.hours)
          .set('minute', val.minutes)
          .toDate();
        recurring.value.weekly.weeks = val.day;
        break;
      }
      case 'MONTHLY': {
        recurring.value.monthly.selectedTime = dayjs()
          .set('hour', val.hours)
          .set('minute', val.minutes)
          .toDate();
        recurring.value.monthly.months = val.month;
        recurring.value.monthly.days = val.day;
        break;
      }
      default:
        break;
    }
  }
};

onMounted(() => {
  if (props.recurringBroadcast) {
    setInitailValues(props.recurringBroadcast);
  }
});

watchEffect(() => {
  if (recurring.value) {
    emits('recurring', recurring.value);
  }
});

const getDaysOptions = computed(() => {
  if (recurring.value.monthly.months.length > 0) {
    const selectedMonths = monthOptions.filter((month) =>
      recurring.value.monthly.months.includes(month.value)
    );
    const minimumDays = selectedMonths.reduce((acc, curr) => {
      if (!acc) {
        return curr.maxDays;
      }
      if (acc >= curr.maxDays) return curr.maxDays;

      return acc;
    }, 0);

    const options = Array(minimumDays)
      .fill(0)
      .map((e, i) => {
        return { name: i + 1, value: i };
      });

    return options;
  }
  return [];
});

watch(
  () => getDaysOptions.value,
  () => {
    if (!isClearDays.value) {
      isClearDays.value = true;
      return;
    }
    recurring.value.monthly.days = [];
  }
);
</script>

<template>
  <div v-if="interval === 'DAILY'">
    <div class="field mb-0">
      <label class="block font-medium text-900">Time</label>
      <Calendar
        v-model="recurring.daily.selectedTime"
        timeOnly
        placeholder="HH:MM"
      />
    </div>
  </div>
  <div
    v-else-if="interval === 'WEEKLY'"
    class="flex column-gap-2 align-items-center"
  >
    <span>Week at every</span>
    <MultiSelect
      v-model="recurring.weekly.weeks"
      :options="weekOptions"
      optionLabel="label"
      optionValue="value"
      :placeholder="`Select day(s)`"
      :max="7"
      :maxSelectedLabels="2"
    />
    <span>Day</span>
    <Calendar
      v-model="recurring.weekly.selectedTime"
      timeOnly
      placeholder="HH:MM"
    />
  </div>
  <div
    v-else-if="interval === 'MONTHLY'"
    class="flex column-gap-2 align-items-center"
  >
    <span>Month at every</span>
    <MultiSelect
      v-model="recurring.monthly.months"
      :options="monthOptions"
      optionLabel="label"
      optionValue="value"
      :placeholder="`Select Month(s)`"
      :max="7"
      :maxSelectedLabels="2"
    />
    <MultiSelect
      :options="getDaysOptions"
      :disabled="!getDaysOptions.length"
      :option-label="'name'"
      :option-value="'value'"
      placeholder="Select Day(s)"
      v-model="recurring.monthly.days"
      :maxSelectedLabels="2"
    />
    <Calendar
      v-model="recurring.monthly.selectedTime"
      timeOnly
      placeholder="HH:MM"
    />
  </div>
</template>

<style lang="scss" scoped></style>
