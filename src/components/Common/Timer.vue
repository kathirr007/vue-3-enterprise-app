<script setup lang="ts">
import type { TimerObj, TimerStatus } from '@/types/timer.type';
import dayjs from 'dayjs';
import type { MetaObj } from '@/types/common.type';
import type { UserCheckInStatus } from '@/types/hrms.type';

const props = defineProps<{
  // status?: TimerStatus;
  // startTime?: string | Date;
  // endTime?: string | Date;
  hideControls?: boolean;
  hideTime?: boolean;
  timerData?: TimerObj;
  checkInTimerData?: UserCheckInStatus;
  day?: boolean;
  units?: boolean;
}>();
const { metaFilter } = useUtilityFns();
const startTime = ref();
const endTime = ref();
const stoppedDuration = ref(0);
const started = ref();
const running = ref(false);
const status = ref<TimerStatus>('stopped');
const stopDialog = ref(false);

const initialTime = computed(
  () =>
    `${
      props.units
        ? props.day
          ? '00d:00h:00m:00s'
          : '00h:00m:00s'
        : props.day
        ? '00:00:00:00'
        : '00:00:00'
    }`
);
const time = ref(initialTime.value);
const isTimerActive = computed(() => !props.timerData?.isCompleted);

const { defaultBreakpoints, styles } = useCommonBreakPoints();

function start() {
  if (status.value === 'running')
    return;

  if (startTime.value === undefined) {
    reset();
    startTime.value = dayjs();
  }

  if (endTime.value !== undefined) {
    // stoppedDuration.value += dayjs().valueOf() - endTime.value;
    stoppedDuration.value += dayjs().diff(dayjs(endTime.value), 'ms');
  }

  started.value = setInterval(clockRunning, 10);
  running.value = true;
}

function stop() {
  running.value = false;
  endTime.value = dayjs();
  clearInterval(started.value);
}

function reset() {
  status.value = 'stopped';
  clearInterval(started.value);
  stoppedDuration.value = 0;
  startTime.value = undefined;
  endTime.value = undefined;
  time.value = '00:00:00:00';
}

function clockRunning() {
  if (!running.value)
    return;

  const timeElapsed = dayjs.duration(
    dayjs().diff(dayjs(startTime.value), 'ms') - stoppedDuration.value,
    'ms'
  );
  let d: string | number = timeElapsed.get('d');
  let h: string | number = timeElapsed.get('h');
  let m: string | number = timeElapsed.get('m');
  let s: string | number = timeElapsed.get('s');
  d = String(d).padStart(2, '0');
  h = String(h).padStart(2, '0');
  m = String(m).padStart(2, '0');
  s = String(s).padStart(2, '0');

  let readableTime: string;
  if (props.units) {
    readableTime = props.day ? `${d}d:${h}h:${m}m:${s}s` : `${h}h:${m}m:${s}s`;
  }
  else {
    readableTime = props.day ? `${d}:${h}:${m}:${s}` : `${h}:${m}:${s}`;
  }

  time.value = readableTime;
}

function stopTimer() {
  // Stop the timer
  stopDialog.value = true;
}

watchEffect(() => {
  if (props.timerData || props.checkInTimerData) {
    // reset();
    startTime.value = props.timerData
      ? dayjs(props.timerData?.createdAt as string)
      : dayjs(props.checkInTimerData?.attendance.checkIn as string);
    start();
  }
});
</script>

<template>
  <div class="timer flex align-items-center" v-bind="$attrs">
    <div v-if="!hideControls" class="btn-container">
      <!-- play -->
      <i
        v-if="!running"
        v-tooltip.bottom="'Start Timer'"
        class="pi pi-custom pi-stopwatch h-1.5rem w-1.5rem"
        @click="start"
      />

      <!-- stop -->
      <i
        v-else
        v-tooltip.bottom="'Stop Timer'"
        class="topbar-icon flex align-items-center"
        @click="stopTimer"
      >
        <Icon
          class="transition-all text-xl cursor-pointer text-red-500 mr-1"
          icon="fa6-regular:circle-stop"
        />
      </i>
    </div>
    <span v-if="!hideTime" class="time text-xl" v-html="time" />
  </div>
  <Dialog
    v-model:visible="stopDialog"
    :modal="true"
    append-to="body"
    :breakpoints="{ ...defaultBreakpoints, '992px': '60vw' }"
    :style="{ width: '50vw' }"
    content-class="border-round-bottom-md"
    @hide="stopDialog = false"
  >
    <template #header>
      <h5>
        Stop Timer for -
        <em>{{ metaFilter(timerData?.entity.meta as MetaObj[], 'title') }}</em>
      </h5>
    </template>
    <div class="hidden lg:block">
      <TimerStop
        :timer-data="timerData as TimerObj"
        @modal-close="stopDialog = false"
      />
    </div>
    <div class="block lg:hidden">
      <TimerMobileStop
        :timer-data="timerData as TimerObj"
        @modal-close="stopDialog = false"
      />
    </div>
  </Dialog>
</template>

<style lang="scss" scoped>
.timer {
  order: 0;
  flex: 0 1 auto;
  align-self: center;

  .time {
    font-size: 2.5em;
  }

  .text {
    margin-top: 30px;
    font-size: 1em;
    text-align: center;

    a {
      text-decoration: none;
      color: inherit;

      transition: color 0.1s ease-out;
    }
  }

  .btn-container {
    display: flex;

    a {
      text-align: center;
      font-family: 'Share Tech Mono', sans-serif;
      background: transparent;
      border: none;
      padding: 10px 15px;
      margin: 0 10px;
      text-transform: uppercase;
      font-size: 2rem;
      cursor: pointer;
      flex-grow: 1;
      transition: color 0.1s ease-out;
    }
  }
}
</style>
