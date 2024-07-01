<script setup lang="ts">
import type {
  Card,
  ClientDistribution,
  FirmProductivity,
  TeamMemberProductivityData,
  UtilizationProjection
} from '@/types/dashboard.type';
import type { Task } from '@/types/tasks.type';
import { useMutation, useQuery } from 'vue-query';
import type { ChartType, ScriptableTooltipContext } from 'chart.js';
import dayjs from 'dayjs';
import {
  type ActionPerformed, type PushNotificationSchema, PushNotifications, type Token
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// import StarRating from 'vue-star-rating';

const { getUsers } = useCommonListQueries();
const { pluralize } = useVueFilters();
const { data: filterDataUser, applyFilter: applyFilterUser }
  = useFilterColumns();
const { isFeatureIntegrated, allOrgIntegrationIds, featureSubscribed }
  = usePermissions(true);
const { isLarge } = useCommonBreakPoints();

applyFilterUser('Is Active', 'true');
const userFilters = useEncodeFilterData(filterDataUser);
const { data: users, isLoading: usersLoading } = getUsers(
  false,
  true,
  userFilters
);

const { getPreviousMonths } = useUtilityFns();
const { getHomeDashboard } = useDashboardMatrix();
let isDeviceRegistered = false;

function getOrCreateTooltip(chart: any) {
  let tooltipEl = chart.canvas.parentNode.querySelector('div');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
    tooltipEl.style.borderRadius = '3px';
    tooltipEl.style.color = 'white';
    tooltipEl.style.opacity = 1;
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.transform = 'translate(-50%, 0)';
    tooltipEl.style.transition = 'all .1s ease';

    const table = document.createElement('table');
    table.style.margin = '0px';

    tooltipEl.appendChild(table);
    chart.canvas.parentNode.appendChild(tooltipEl);
  }

  return tooltipEl;
}

function externalTooltipHandler(context: ScriptableTooltipContext<ChartType>) {
  // Tooltip Element

  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltip(chart);

  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  // Set Text

  if (tooltip.body) {
    const titleLines = tooltip.title || [];

    const { hours, projects, teammembers, effectiveBillable } = tooltip
      .dataPoints[0].raw as {
      hours: number | string;
      projects: number | string;
      teammembers: number | string;
      effectiveBillable: number | string;
    };
    const bodyLines = [
      { label: 'Hours', value: hours },
      { label: 'Project(s)', value: projects },
      { label: 'Team Member(s)', value: teammembers },
      { label: 'Effective Billable', value: effectiveBillable }
    ];

    let innerHtml = '<thead>';

    titleLines.forEach((title: string) => {
      innerHtml += `<tr><th><div class="mb-1">${title}</div></th></tr>`;
    });
    innerHtml += '</thead><tbody>';

    bodyLines.forEach((body, i) => {
      innerHtml += `<tr><td> <span class="text-blue-400 font-medium">${
        body.label === 'Effective Billable' ? `$${body.value}` : `${body.value}`
      }</span> ${body.label} </td></tr>`;
    });
    innerHtml += '</tbody>';

    const tableRoot = tooltipEl.querySelector('table');
    tableRoot.innerHTML = innerHtml;
  }

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

  // Display, position, and set styles for font
  tooltipEl.style.opacity = 1;

  // Left and right
  tooltipEl.style.left = `${tooltip.caretX + positionX}px`;
  tooltipEl.style.top = `${tooltip.caretY + positionY}px`;

  // Paddings
  tooltipEl.style.padding
    = `${tooltip.options.padding}px ${tooltip.options.padding}px`;
}

const isOverDue = ref<string>();
const cardsTemplate = ref<Card[]>([
  // {
  //   id: 'completedTasks',
  //   title: 'Completed Tasks',
  //   value: '',
  //   color:
  //     'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
  //   icon: 'charm:circle-tick',
  //   iconify: true,
  // },
  // {
  //   id: 'scheduledTasks',
  //   title: 'Scheduled Tasks',
  //   value: '',
  //   color:
  //     'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
  //   icon: 'mdi:calendar-tick-outline',
  //   iconify: true,
  // },
  {
    id: 'activeTasks',
    title: 'Active Tasks',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    icon: 'mdi:receipt-text-clock',
    iconify: true
  },
  {
    id: 'overDueTasks',
    title: 'Overdue Tasks',
    value: '',
    color: 'text-3xl',
    icon: 'mdi:clock-alert-outline',
    iconify: true
  },
  {
    id: 'totalBillable',
    title: 'Total Billable Hours',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    icon: 'fluent-mdl2:time-sheet',
    iconify: true
  },
  {
    id: 'totalBillAmount',
    title: 'Effective Billable Amount',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    icon: 'pi pi-dollar'
  }
]);
const cards = ref([...cardsTemplate.value]);

const _data = reactive({
  labels: [] as string[],
  datasets: [
    {
      data: [] as number[],
      backgroundColor: [] as string[]
    }
  ]
});

const colorForChart = ref({
  light: [
    '#FFC3A3',
    '#87D6CD',
    '#EDBEE7',
    '#B8DEB4',
    '#96C9FF',
    '#C4A78D',
    '#9CA2A6',
    '#E6D3B5',
    '#B4B9D9',
    '#FFE3A3',
    '#96C9FF',
    '#B8DEB4',
    '#EDBEE7',
    '#87D6CD',
    '#FFC3A3',
    '#E6F69D',
    '#AADEA7',
    '#F66D44',
    '#9BBFE0',
    '#E8A09A',
    '#C6D68F',
    '#64C2A6',
    '#2D87BB',
    '#FBE29F',
    '#A5C1DC',
    '#FFAB05',
    '#FF6B45',
    '#FF2E7E',
    '#0674C4',
    '#E9F6FA',
    '#77DD77',
    '#7AC142',
    '#F47A1F',
    '#FDBB2F',
    '#007CC3',
    '#E6F69D'
  ]
});

const todaysTasksData = ref();
const firmProductivityData = ref();
const firmProductivityOptions = ref();
const productivityStatusChartData = ref();
const productivityStatusChartOptions = ref();
const utilizationProjectionData = ref();
const utilizationProjectionOptions = ref();
const selectedMonth = ref();
const lastThreeMonths = ref(
  getPreviousMonths(dayjs().month(), 3).map((name, i) => ({
    fromDate:
      i !== 0
        ? dayjs()
          .startOf('month')
          .subtract(i, 'month')
          .endOf('day')
          .toISOString()
        : '',
    toDate:
      i !== 0
        ? dayjs().endOf('month').subtract(i, 'month').endOf('day').toISOString()
        : '',
    name
  }))
);

selectedMonth.value = lastThreeMonths.value[0];

function setClientDistributionData(data: ClientDistribution[]) {
  _data.labels = data.map(val => val.name);
  _data.datasets[0].data = data.map(val => val._count.clients);
  _data.labels?.forEach((el, i) => {
    _data.datasets[0].backgroundColor.push(colorForChart.value.light[i]);
  });
}

function setFirmProductivityOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      tooltip: {
        enabled: false,
        position: 'nearest',
        external: externalTooltipHandler
      }
    }
  };
}
function setFirmProductivityData(data: FirmProductivity[]) {
  return {
    labels: data.map(val => `${val.day}`),
    datasets: [
      {
        label: 'Hours',
        data: data.map(val => ({
          x: val.day,
          hours: val.timeSpent,
          projects: val.projects,
          teammembers: val.teamMembers,
          effectiveBillable: val.effectiveBillable
        })),
        parsing: {
          yAxisKey: 'hours'
        },
        fill: true,
        tension: 0.4
      }
    ]
  };
}
function setTeamProductivityData(data: TeamMemberProductivityData[]) {
  const documentStyle = getComputedStyle(document.documentElement);

  return {
    labels: data.map(val => val.name),
    datasets: [
      {
        type: 'bar',
        label: 'To Do',
        backgroundColor: documentStyle.getPropertyValue('--blue-200'),
        data: data.map(val => val.todoEntities)
      },
      {
        type: 'bar',
        label: 'Completed',
        backgroundColor: documentStyle.getPropertyValue('--green-200'),
        data: data.map(val => val.completedEntities)
      },
      {
        type: 'bar',
        label: 'Over Due',
        backgroundColor: documentStyle.getPropertyValue('--pink-200'),
        data: data.map(val => val.overDueEntities)
      },
      {
        type: 'bar',
        label: 'In Progress',
        backgroundColor: documentStyle.getPropertyValue('--orange-200'),
        data: data.map(val => val.inProgressEntities)
      }
    ]
  };
}
function setTeamProductivityOptions() {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--text-color');
  const textColorSecondary = documentStyle.getPropertyValue(
    '--text-color-secondary'
  );
  const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

  return {
    indexAxis: 'y',
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    responsive: true,

    scales: {
      x: {
        stacked: true,
        ticks: {
          color: textColorSecondary,
          font: {
            weight: '600'
          },
          min: 0,
          max: 100,
          stepSize: 10,
          callback(value: number) {
            return `${value}%`;
          }
        },
        grid: {
          color: surfaceBorder
        }
      },
      y: {
        stacked: true,
        ticks: {
          color: textColorSecondary,
          font: {
            weight: '600'
          }
        },
        grid: {
          color: surfaceBorder
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label(context: any) {
            const label = context.dataset.label || '';
            return `${label}: ${context.parsed.x}%`;
          }
        }
      }
    }
  };
}
function setUtilizationProjectionData(data: UtilizationProjection[]) {
  const documentStyle = getComputedStyle(document.documentElement);

  return {
    labels: data.map(val => val.name),
    datasets: [
      {
        type: 'line',
        label: 'Total Working Hours',
        backgroundColor: documentStyle.getPropertyValue('--pink-200'),
        borderColor: documentStyle.getPropertyValue('--pink-200'),
        data: data.map(val => val.workingHours),
        borderDash: [3, 3]
      },
      {
        type: 'bar',
        label: 'Time Spent',
        backgroundColor: documentStyle.getPropertyValue('--blue-200'),
        data: data.map(val => val.currentMonthtimeSpent)
      },
      {
        type: 'bar',
        label: 'Projected',
        backgroundColor: documentStyle.getPropertyValue('--orange-200'),
        data: data.map(val => val.projectedTimeInHours)
      },
      {
        type: 'bar',
        label: 'Time Available',
        backgroundColor: documentStyle.getPropertyValue('--green-200'),
        data: data.map(val => val.availableTimeInHours)
      },
      {
        type: 'bar',
        label: 'Overtime',
        backgroundColor: documentStyle.getPropertyValue('--pink-200'),
        data: data.map(val => val.overTime)
      }
    ]
  };
}
function setUtilizationProjectionOptions() {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--text-color');
  const textColorSecondary = documentStyle.getPropertyValue(
    '--text-color-secondary'
  );
  const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

  return {
    indexAxis: 'y',
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    responsive: true,

    scales: {
      x: {
        stacked: true,
        ticks: {
          color: textColorSecondary,
          font: {
            weight: '600'
          },
          min: 0,
          max: 176,
          stepSize: 20,
          callback(value: number) {
            return `${value}Hrs`;
          }
        },
        grid: {
          color: surfaceBorder
        }
      },
      y: {
        stacked: true,
        ticks: {
          color: textColorSecondary,
          font: {
            weight: '600'
          }
        },
        grid: {
          color: surfaceBorder
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label(context: any) {
            const label = context.dataset.label || '';
            return `${label}: ${context.parsed.x}Hrs`;
          }
        }
      }
    }
  };
}

const { data: dashboardData, isFetching } = useQuery(
  ['dashboard-home', selectedMonth],
  () => {
    return getHomeDashboard(
      selectedMonth.value?.fromDate,
      selectedMonth.value?.toDate
    );
  },
  {
    onSuccess: (data) => {
      if (data.todaysTaskData) {
        todaysTasksData.value = data.todaysTaskData;
      }

      if (data.clientTypes) {
        setClientDistributionData(data.clientTypes);
      }

      if (data.firmProductivity) {
        firmProductivityData.value = setFirmProductivityData(
          data.firmProductivity
        );
        firmProductivityOptions.value = setFirmProductivityOptions();
      }

      if (data.productivityStatus) {
        productivityStatusChartData.value = setTeamProductivityData(
          data.productivityStatus
        );
        productivityStatusChartOptions.value = setTeamProductivityOptions();
      }

      if (data.utilizationProjection) {
        utilizationProjectionData.value = setUtilizationProjectionData(
          data.utilizationProjection
        );
        utilizationProjectionOptions.value = setUtilizationProjectionOptions();
      }

      cards.value = cardsTemplate.value
        .map((e) => {
          switch (e.id) {
            case 'completedTasks':
              return data.completedTasks
                ? {
                    ...e,
                    value: `${data.completedTasks.completedEntities} for ${data.completedTasks.clients} ${pluralize($tConfig('CLIENT'))}`
                  }
                : undefined;
            case 'scheduledTasks':
              return data.scheduledTasks
                ? {
                    ...e,
                    value: `${data.scheduledTasks.scheduledEntities} for ${data.scheduledTasks.clients} ${pluralize($tConfig('CLIENT'))}`
                  }
                : undefined;
            case 'activeTasks':
              return data.activeTasks
                ? {
                    ...e,
                    value: `${data.activeTasks.activeEntities} for ${data.activeTasks.clients} ${pluralize($tConfig('CLIENT'))}`
                  }
                : undefined;
            case 'overDueTasks':
              return data.overDueTasks
                ? {
                    ...e,
                    value: `${data.overDueTasks.overDueEntities} for ${data.overDueTasks.clients} ${pluralize($tConfig('CLIENT'))}`,
                    color: `${isOverDue.value}`
                  }
                : undefined;
            case 'totalBillable':
              return { ...e, value: `${data.totalBillable} Hours` };

            case 'totalBillAmount':
              return { ...e, value: `$ ${data.totalBillAmount}` };

            default: {
              return { ...e };
            }
          }
        })
        .filter(e => e) as Card[];
    }
  }
);

watchEffect(() => {
  const result = cards.value.find(val => val.id === 'overDueTasks');
  const stringValue = result?.value;

  const numberForOverDue = stringValue?.match(/(\d+)\s+for/i);

  if (isFetching || (numberForOverDue && numberForOverDue.length > 1)) {
    isOverDue.value
      = 'text-3xl text-red-500 bg-white hover:text-white hover:bg-red-500 transition-all transition-duration-400';
  }
  else {
    isOverDue.value
      = 'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400';
  }
});
const lightOptions = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: '#495057'
      },
      position: 'bottom'
    }
  }
};

const { mutateAsync: sendToken } = useMutation(({ token, isPushNotificationsEnabled }: {
  token: string;
  isPushNotificationsEnabled?: boolean;
}) => {
  return postDeviceToken({ token, isPushNotificationsEnabled });
});

async function checkRegistrationStatus() {
  const storedStatus = await Preferences.get({ key: 'registrationKey' });
  isDeviceRegistered = storedStatus.value === 'true';
}

async function setRegistrationStatus() {
  await Preferences.set({ key: 'registrationKey', value: 'true' });
  isDeviceRegistered = true;
}

async function register() {
  PushNotifications.register();

  PushNotifications.addListener('registration', async (token: Token) => {
    await checkRegistrationStatus();
    if (!isDeviceRegistered) {
      await sendToken({ token: token.value, isPushNotificationsEnabled: true });
      await setRegistrationStatus();
    }
  });

  PushNotifications.addListener(
    'pushNotificationReceived',
    (notification: PushNotificationSchema) => {
      console.log(`Push received: ${JSON.stringify(notification)}`);
    }
  );

  PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (notification: ActionPerformed) => {
      console.log(`Push action performed: ${JSON.stringify(notification)}`);
    }
  );
}

async function registerNotifications() {
  PushNotifications.checkPermissions().then(async (res) => {
    if (res.receive !== 'granted') {
      PushNotifications.requestPermissions().then(async (res) => {
        if (res.receive === 'denied') {
          // Push Notification Permission denied
        }
        else {
          await register();
        }
      });
    }
    else {
      await register();
    }
  });
}

onMounted(async () => {
  const isMobileApp = Capacitor.isNativePlatform();
  if (isMobileApp) {
    await registerNotifications();
  }
});
</script>

<template>
  <template v-if="!isLarge">
    <CommonLoading v-if="isFetching" />
    <div v-else class="mb-2">
      <CommonReviewOverviewCard :average-review="(dashboardData?.feedbackRating as number)" :total-reviews="(dashboardData?.feedbackCount as number)" />
    </div>
  </template>
  <div class="layout-dashboard">
    <OnboardingGetStarted />
    <QuickStartContainer />
    <!-- <CommonCountDownTest /> -->
    <div
      v-if="isFeatureIntegrated(['work'], allOrgIntegrationIds)"
      class="flex justify-content-end align-items-center pb-3"
    >
      <div class="flex flex-column w-12rem">
        <!-- <label for="previouMonth" class="font-medium text-lg mb-1"
          >Select previous interval</label
        > -->
        <Dropdown
          id="previouMonth"
          v-model="selectedMonth"
          :options="lastThreeMonths"
          option-label="name"
          placeholder="Select a Interval"
          class="w-full"
        />
      </div>
    </div>
    <div
      v-if="
        isFeatureIntegrated(['work'], allOrgIntegrationIds)
          && featureSubscribed('work', 'task')
      "
      class="grid mb-4"
    >
      <WidgetCards
        :todays-task-count="todaysTasksData"
        :cards="isFetching ? cardsTemplate : cards"
        class="col-12"
        :loading="isFetching"
      />
    </div>
    <div
      v-if="
        isFeatureIntegrated(['work'], allOrgIntegrationIds)
          && featureSubscribed('work', 'project')
      "
      class="grid mb-4"
    >
      <div
        class="col-12 md:col-12 px-3 py-2 md:p-3"
        :class="{ 'md:col-12': !isFetching && !dashboardData?.todaysTasks }"
      >
        <div
          class="box-shadow widget-radius card flex flex-column align-items-center w-full"
        >
          <h6 class="align-self-start">
            Firm Productivity
          </h6>
          <CommonLoading v-if="isFetching" />
          <div
            v-else
            class="relavite firm-productivity-chart w-full justify-content-center"
          >
            <Chart
              type="line"
              :data="firmProductivityData"
              :options="firmProductivityOptions"
              class="h-20rem w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="
        isFeatureIntegrated(['work'], allOrgIntegrationIds)
          && featureSubscribed('work', 'task')
      "
      class="grid mb-4"
      :class="{
        hidden:
          !isFetching
          && (!dashboardData?.utilizationProjection
            || !dashboardData?.productivityStatus),
      }"
    >
      <div
        class="flex col-12 md:block flex-order-1 lg:flex-order-0 md:col-6 py-2 px-3 md:p-3"
        :class="{
          'md:col-12': !isFetching && !dashboardData?.productivityStatus,
          'hidden': !isFetching && !dashboardData?.utilizationProjection,
        }"
      >
        <div
          class="box-shadow widget-radius card flex flex-column align-items-center w-full"
        >
          <h6 class="align-self-start">
            Utilization Projection
            <span
              v-tooltip.top="'Assumption Working Hour= 8 Hrs Hours / Day'"
              class="pi pi-info-circle ml-1 cursor-pointer"
            />
          </h6>
          <CommonLoading v-if="isFetching" />

          <Chart
            v-else
            type="bar"
            :data="utilizationProjectionData"
            :options="utilizationProjectionOptions"
            class="h-20rem w-full h-full"
          />
        </div>
      </div>
      <div
        class="flex col-12 md:block md:col-6 py-2 px-3 md:p-3"
        :class="{
          'md:col-12': !isFetching && !dashboardData?.utilizationProjection,
          'hidden': !isFetching && !dashboardData?.productivityStatus,
        }"
      >
        <div
          class="box-shadow widget-radius card flex flex-column align-items-center w-full"
        >
          <h6 class="align-self-start">
            Productivity Status
          </h6>
          <CommonLoading v-if="isFetching" />
          <Chart
            v-else
            type="bar"
            :data="productivityStatusChartData"
            :options="productivityStatusChartOptions"
            class="h-20rem w-full h-full"
          />
        </div>
      </div>
    </div>
    <div class="grid mb-4">
      <div
        v-if="
          isFeatureIntegrated(['work'], allOrgIntegrationIds)
            && featureSubscribed('work', 'task')
        "
        class="col-12 md:col-4 xl:col-4 min-h-20rem px-3 py-2 md:p-3"
        :class="{ hidden: !isFetching && !dashboardData?.todaysTasks }"
      >
        <WidgetCheckList
          class="w-full"
          title="To-Do"
          entity-type="TASK"
          :tasks="dashboardData?.todaysTasks as unknown as Task[]"
          button-tooltip="Create Task"
          :loading="isFetching"
        />
      </div>
      <div
        class="flex col-12 md:block flex-order-1 lg:flex-order-0 md:col-4 xl:col-4 py-2 px-3 md:p-3"
      >
        <div
          v-if="featureSubscribed('client', 'dashboard')"
          class="box-shadow widget-radius card flex flex-column align-items-center w-full"
        >
          <h6 class="align-self-start">
            {{ `${$tConfig('CLIENT')}` }} Distribution
          </h6>
          <CommonLoading v-if="isFetching" />

          <Chart
            v-else-if="_data.datasets[0].data.length > 0"
            type="pie"
            :data="_data"
            :options="lightOptions"
          />

          <router-link
            v-else
            class="text-xl font-bold underline mt-2"
            :to="{ name: 'admin-clients' }"
          >
            Add {{ `${pluralize($tConfig('CLIENT'))}` }}
          </router-link>
        </div>
      </div>
      <div class="hidden lg:block col md:col-4 xl:col-4">
        <WidgetUsers :users="users || []" :loading="usersLoading" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@media (width <= 991px) {
  .layout-content {
    padding: 0 !important;
  }
}

:deep(*) {
  .firm-productivity-chart {
    height: calc(100% - 40px);

    .p-chart {
      canvas {
        width: 100% !important;
        height: 100% !important;
        margin: auto;
      }

      > div {
        position: absolute;
        min-width: 175px;
        color: #fff;
        pointer-events: none;
        background-color: #000;
        border-radius: 6px;
        opacity: 1;
        transition: all 0.25s ease-in-out;
      }

      .chartjs-tooltip-key {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-right: 7px;
        border-radius: 50%;
      }
    }
  }
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  grid-gap: 1rem;

  @media screen and (min-width: $tabletBreakpoint) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media screen and (min-width: $desktopBreakpoint) {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
