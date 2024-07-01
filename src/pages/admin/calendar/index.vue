<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  CalendarOptions,
  EventClickArg,
  EventHoveringArg
} from '@fullcalendar/core';
import { useQuery } from 'vue-query';
import type { Project } from '@/types/project.type';
import dayjs from 'dayjs';

const router = useRouter();
const { featureSubscribed } = usePermissions();
const calendarEvents = ref<Partial<Project>[]>([]);
const eventDialog = ref(false);
const clickedEvent = ref<any>();
const changedEvent = reactive({
  title: '',
  start: null,
  end: '',
  allDay: null
});

function handleCalendarClick(e: EventClickArg) {
  router.push({
    name: 'admin-projects-id',
    params: {
      id: e.event.id
    }
  });
}

function showEventOverview(e: EventHoveringArg) {
  // TODO:
}
function hideEventOverview(e: EventHoveringArg) {
  // TODO:
}

const calendarOptions = reactive<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin],
  initialDate: dayjs().toDate(),
  headerToolbar: {
    left: 'title'
    // center: 'title',
    // right: 'prev,next',
    // right: 'dayGridMonth',
  },
  buttonText: {
    today: 'Today',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    list: 'List'
  },
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  events: [],
  eventClick: handleCalendarClick,
  displayEventTime: false,
  eventMouseEnter: showEventOverview,
  eventMouseLeave: hideEventOverview
});

useQuery(
  ['project-list'],
  () => {
    // applyFilter('Is Active', undefined);
    return useProjectListV2({});
  },
  {
    onSuccess: (data) => {
      const projectEvents = data.results.map((project: Project) => ({
        id: project.id,
        title: project.name,
        // start: dayjs(project.startDate).startOf('D').toISOString(),
        // end: dayjs(project.startDate).endOf('D').toISOString(),
        start: project.startDate,
        end: project.startDate,
        tasks: project.entities
      }));
      calendarOptions.events = projectEvents;
    }
  }
);

function save() {
  // TODO:
}
function reset() {
  // TODO:
}
</script>

<template>
  <div v-if="featureSubscribed('work', 'work_calendar') === false" class="card">
    <Common426 feature="work calendar" />
  </div>
  <CommonPage v-else>
    <div class="flex row-gap-1 mb-4 justify-content-between">
      <h1 class="font-medium text-3xl text-primary mb-0">
        Project Calendar
      </h1>

      <a href="https://brightreturn.com/kb/project-calendar" target="_blank">
        <Button
          v-tooltip.top="'Need Help'"
          type="button"
          icon="pi pi-question-circle text-lg"
          class="p-button-icon-only p-button-rounded ml-2"
        />
      </a>
    </div>
    <div class="grid">
      <div class="col-12">
        <div class="card">
          <!-- <h5>Project Calendar</h5> -->
          <FullCalendar :options="calendarOptions as CalendarOptions" />

          <Dialog
            v-model:visible="eventDialog"
            :style="{ width: '450px' }"
            header="Event Details"
            :modal="true"
            :closable="true"
          >
            <div class="p-fluid">
              <div class="field">
                <label for="title">Title</label>
                <InputText
                  v-if="clickedEvent"
                  id="title"
                  v-model="changedEvent.title"
                  required="true"
                  autofocus
                />
              </div>
              <div class="field">
                <label for="start">From</label>
                <Calendar
                  v-if="clickedEvent"
                  id="start"
                  v-model="changedEvent.start"
                  :show-time="true"
                  append-to="body"
                />
              </div>
              <div class="field">
                <label for="end">To</label>
                <Calendar
                  v-if="clickedEvent"
                  id="end"
                  v-model="changedEvent.end"
                  :show-time="true"
                  append-to="body"
                />
              </div>
              <div class="field-checkbox">
                <Checkbox
                  id="allday"
                  v-model="changedEvent.allDay"
                  name="allday"
                  value="All Day"
                />
                <label for="allday">All Day</label>
              </div>
            </div>
            <template #footer>
              <Button
                label="Save"
                icon="pi pi-check"
                class="p-button-text"
                @click="save"
              />
              <Button
                label="Reset"
                icon="pi pi-refresh"
                class="p-button-text"
                @click="reset"
              />
            </template>
          </Dialog>
        </div>
      </div>
    </div>
  </CommonPage>
</template>

<style scoped>
::v-deep(.fc .fc-col-header-cell-cushion),
::v-deep(.fc-daygrid-dot-event .fc-event-time),
::v-deep(.fc-daygrid-dot-event .fc-event-title),
::v-deep(.fc .fc-daygrid-day-number),
::v-deep(.fc .fc-daygrid-more-link) {
  color: var(--text-color);
}

@media screen and (width <= 960px) {
  ::v-deep(.fc-header-toolbar) {
    display: flex;
    flex-wrap: wrap;
  }
}
</style>
