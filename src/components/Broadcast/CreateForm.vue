<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import type {
  CreateBroadcast,
  Interval,
  BroadcastRecurring as RecurringType
} from '@/types/broadcast.type';
import {
  clientBroadcastCreateSchema,
  teamBroadcastCreateSchema
} from '@/types/broadcast.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import Calendar from 'primevue/calendar';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import RadioButton from 'primevue/radiobutton';
import { useMutation } from 'vue-query';
import dayjs from 'dayjs';
import type { ContentJSON, UploadFilesPayload } from '@/types/common.type';
import { Icon } from '@iconify/vue';
import type { Attachment } from '@/types/attachment.type';
import type { MailsAttachmentResponse } from '@/types/inbox.type';

const props = defineProps<{
  type: string;
  broadcast: CreateBroadcast | undefined;
  templateId?: string;
  currentOp?: string;
  isCreate?: boolean;
  fetchingPlaceholders?: boolean;
  editorModules?: {
    placeholder: {
      delimiters: string[];
      placeholders: {
        id: string;
        label: string;
      }[];
    };
  };
}>();
const emit = defineEmits<{
  (
    e: 'back',
    type: string,
    templateId: string,
    name: string,
    description: string,
    Channel: string,
    body: string,
    subject: string
  ): void;
  (e: 'success'): void;
}>();

const { canDo } = usePermissions();
const { defaultBreakpoints } = useCommonBreakPoints();
const { pluralize } = useVueFilters();
const { uploadFileRef, onUpload, getAttachment, getAttachmentUrl }
  = useAttachments();
const { initToast } = useToasts();
const {
  getBusinessEntities,
  getClients,
  getClientGroups,
  getUsers,
  getDesignations
} = useCommonListQueries();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const { canAccessAllMenu, featureSubscribed } = usePermissions();

const broadcastTo = inject('broadcastTo');
const broadcastToPayloadName
  = broadcastTo === 'team' ? 'teamMembersPayload' : 'clientsPayload';
const RecipientsType = broadcastTo === 'team' ? 'teamMemberType' : 'clientType';

const { data: businessEntities } = getBusinessEntities();
const { clientsWithUsers: clients } = getClients(true, initialFilters);
const { data: clientGroups } = getClientGroups(ref(orgType.value === 'ACCOUNTING'));
const { activeVerifiedUser: users } = getUsers(true, true, initialFilters);
const { data: designations } = getDesignations();
const selectedInterval = ref<Interval>();
const subscribeDialog = ref(false);
const upgradeFeature = ref();

const { type, broadcast, templateId, currentOp } = toRefs(props);

const nowAndLaterOptions = [
  { name: 'now', value: 'now', radioLabel: 'Now' },
  { name: 'later', value: 'later', radioLabel: 'Later' }
];
const onceOrRepeatOptions = [
  { name: 'once', value: 'once', radioLabel: 'Once' },
  { name: 'repeat', value: 'repeat', radioLabel: 'Recurring' }
];
const clientRadioOptions = [
  {
    name: 'businessEntities',
    value: 'businessEntities',
    radioLabel: `${$tConfig('BUSINESS_ENTITY')}`
  },
  { name: 'clients', value: 'clients', radioLabel: `Select ${pluralize($tConfig('CLIENT'))}` }
];

if (orgType.value === 'ACCOUNTING') {
  clientRadioOptions.push({ name: 'client-groups', value: 'clientGroups', radioLabel: 'Client Groups' });
}

const teamRadioOptions = [
  { name: 'Designations', value: 'designations', radioLabel: 'Designations' },
  { name: 'teamMembers', value: 'teamMembers', radioLabel: 'Team Members' }
];

const formKey = ref(0);
const formRef = ref();
const instance = getCurrentInstance();
const attachDialog = ref(false);
const isRecurring = ref(false);
const confirmRemoveAttachmentDialog = ref(false);
const uploadFromDesktopDialog = ref(false);
const attachmentsListDialog = ref(false);
const allAttachments = ref<Attachment[]>([]);
const attachmentToRemove = ref<
  Pick<Attachment, 'id' | 'name'> & { index: number }
>();
const isGalleryMoveDialog = ref(false);

function prepareForAttachment() {
  attachDialog.value = true;
}

function prepareAttachmentsList() {
  // emit('showAttachments', data);
  attachmentsListDialog.value = true;
}

function prepareRemoveAttachment(index: number,
  data: Pick<Attachment, 'id' | 'name'>) {
  attachmentToRemove.value = { ...data, index };
  // attachmentToRemove.value = { ...data };
  confirmRemoveAttachmentDialog.value = true;
}

async function handleRemoveAttachment(index: number) {
  if (props.currentOp === 'update') {
    await removeAttachment({
      broadcastId: props.broadcast?.id as string,
      attachmentId: attachmentToRemove.value?.id as string
    });
  }
  allAttachments.value.splice(index, 1);
}

function closeAttachmentDialog() {
  attachDialog.value = false;
  isGalleryMoveDialog.value = false;
  uploadFromDesktopDialog.value = false;
}

async function updateAttachmentValues(attachments: MailsAttachmentResponse[],
  isGallery?: boolean) {
  allAttachments.value = isGallery
    ? ([...allAttachments.value, ...attachments] as Attachment[])
    : ([
        ...allAttachments.value,
        ...(await Promise.all(
          attachments.map(async (attachment) => {
            const { id, name, path } = (await getAttachment(
              attachment.id
            )) as Attachment;
            return { id, name, path };
          })
        ))
      ] as Attachment[]);
}

async function uploadFiles(value: UploadFilesPayload) {
  // allAttachments.value.push(...(value.files as unknown as File[]));
  const uploadResults = await onUpload({ payload: value });
  await updateAttachmentValues(uploadResults as MailsAttachmentResponse[]);
  closeAttachmentDialog();
}

async function handleGalleryFiles(files: MailsAttachmentResponse[]) {
  await updateAttachmentValues(files, true);
  closeAttachmentDialog();
  initToast({
    actionType: 'Create',
    summary: 'Attach files from the gallery',
    detail: `Selected files attached to the broadcast successfully`
  });
}

function getBroadcastValue() {
  return broadcast.value
    ? {
        ...broadcast.value,
        currentOp: currentOp?.value,
        name:
          currentOp?.value === 'clone'
            ? `Copy of ${broadcast.value.name}`
            : broadcast.value.name,
        isCreate: props.isCreate,
        recurring: {}
      }
    : { currentOp: currentOp?.value, isCreate: props.isCreate, recurring: {} };
}

const formData = shallowRef<SchemaForm>({
  fields: [
    {
      as: InputText,
      name: 'name',
      label: 'Name',
      required: true,
      placeholder: 'Enter name',
      hide: currentOp?.value !== 'clone'
    },
    {
      // as: InputText,
      type: 'editor',
      name: 'subject',
      label: 'Subject',
      required: true,
      placeholder: 'Enter Subject',
      editorStyle: '50px',
      hide: props.isCreate,
      // disabled: templateId?.value ? true : false,
      modules: props.editorModules,
      placeholderOptions: props.editorModules?.placeholder.placeholders,
      showSlot: true
    },
    {
      type: 'editor',
      name: 'body',
      label: 'Message',
      placeholder: 'Enter Message',
      editorStyle: 'height: 160px',
      // readonly: templateId?.value ? true : false,
      required: true,
      rows: 6,
      hide: props.isCreate,
      modules: props.editorModules,
      placeholderOptions: props.editorModules?.placeholder.placeholders,
      showSlot: true
    },
    {
      name: 'attachments',
      label: 'Attachments',
      multiple: true,
      showSlot: true,
      hide: props.isCreate
    },
    {
      as: RadioButton,
      type: 'radio',
      label: 'Schedule Email',
      name: 'scheduleBroadcast',
      options: nowAndLaterOptions,
      formGridClass: 'md:col-12',
      required: true
    },
    {
      as: RadioButton,
      type: 'radio',
      name: 'isRecurring',
      options: onceOrRepeatOptions,
      hide: true,
      formGridClass: 'ml-4 md:col-10',
      label: 'Frequency',
      required: true
    },
    {
      name: 'interval',
      showSlot: true,
      required: true,
      formGridClass: 'ml-6'
    },
    {
      as: Calendar,
      type: 'calender',
      placeholder: 'Select Schedule Date',
      label: 'Select Date & Time',
      name: 'scheduleDate',
      formGridClass: 'md:col-6  ml-6',
      hide: true,
      showTime: true,
      showSeconds: true,
      required: true,
      class: 'w-6 ',
      minDate: dayjs().toDate()
    },
    {
      as: RadioButton,
      type: 'radio',
      label: 'Select Recipients',
      name: broadcastTo === 'team' ? 'teamMemberType' : 'clientType',
      options: broadcastTo === 'team' ? teamRadioOptions : clientRadioOptions,
      required: true,
      showLabelSlot: true
    },
    {
      type: 'multiSelect',
      name: broadcastToPayloadName,
      optionLabel: 'name',
      optionValue: 'id',
      disabled: true,
      required: true,
      showSlot: true
    }
  ],
  btnText: 'Submit',
  secondaryBtnText: 'Back',
  hideSecondaryBtn:
    !!(broadcast.value?.id || currentOp?.value === 'clone'),
  validationSchema:
    broadcastTo === 'team'
      ? teamBroadcastCreateSchema
      : clientBroadcastCreateSchema,
  initialValues: getBroadcastValue()
});

const { findFormIndex, updateFieldProp, updateOptions }
  = useSchemaForm(formData);

async function handleRadioClick(val: Record<string, any>,
  name?: string,
  emptyMultiSelect = true) {
  if ({ ...val }.clientType && name === 'clientType') {
    if (emptyMultiSelect) {
      formRef.value.setValues({
        ...formRef.value.schemaFormValues,
        [broadcastToPayloadName]: []
      });
      await nextTick(() => {
        instance?.proxy?.$forceUpdate();
      });
    }
    const clientsIndex = findFormIndex(broadcastToPayloadName);
    updateFieldProp('disabled', clientsIndex, false);
    const clientType = { ...val }.clientType;
    if (clientType === 'businessEntities') {
      updateOptions(businessEntities, clientsIndex);
      updateFieldProp('placeholder', clientsIndex, `Select ${pluralize($tConfig('BUSINESS_ENTITY'))}`);
    }
    else if (clientType === 'clientGroups') {
      if (clientGroups.value?.results)
        updateOptions(clientGroups.value?.results, clientsIndex);
      updateFieldProp('placeholder', clientsIndex, 'Select Client Groups');
    }
    else {
      updateOptions(clients, clientsIndex);
      updateFieldProp('placeholder', clientsIndex, `Select ${pluralize($tConfig('CLIENT'))}`);
    }
  }
  else if ({ ...val }.teamMemberType && name === 'teamMemberType') {
    if (emptyMultiSelect) {
      formRef.value.setValues({
        ...formRef.value.schemaFormValues,
        [broadcastToPayloadName]: []
      });
      await nextTick(() => {
        instance?.proxy?.$forceUpdate();
      });
    }
    const teamIndex = findFormIndex(broadcastToPayloadName);
    updateFieldProp('disabled', teamIndex, false);
    const teamMemberType = { ...val }.teamMemberType;
    if (teamMemberType === 'designations') {
      updateOptions(designations, teamIndex);
      updateFieldProp('placeholder', teamIndex, 'Select Designations');
    }
    else {
      updateOptions(users, teamIndex);
      updateFieldProp('placeholder', teamIndex, 'Select Team Members');
    }
  }
  else if (name === 'scheduleBroadcast') {
    const scheduleBroadcast = { ...val }.scheduleBroadcast;
    const repeatIndex = findFormIndex('isRecurring');
    const scheduleDate = findFormIndex('scheduleDate');
    if (scheduleBroadcast === 'later') {
      if (featureSubscribed('bulk_email', 'schedule_email') === false) {
        formRef.value.setValues({
          ...formRef.value.schemaFormValues,
          scheduleBroadcast: 'now'
        });
        updateFieldProp('hide', scheduleDate, true);
        selectedInterval.value = undefined;
        isRecurring.value = false;
        updateFieldProp('hide', repeatIndex, true);
        upgradeFeature.value = 'schedule email for later';
        subscribeDialog.value = true;
      }
      else updateFieldProp('hide', repeatIndex, false);
    }
    else {
      updateFieldProp('hide', scheduleDate, true);
      selectedInterval.value = undefined;
      isRecurring.value = false;
      updateFieldProp('hide', repeatIndex, true);
    }
  }
  else {
    const isRecurringOption = { ...val }.isRecurring;
    const scheduleDate = findFormIndex('scheduleDate');
    const intervalIndex = findFormIndex('interval');
    if (isRecurringOption === 'once') {
      selectedInterval.value = undefined;
      isRecurring.value = false;
      updateFieldProp('hide', intervalIndex, true);
      updateFieldProp('hide', scheduleDate, false);
    }
    else {
      if (featureSubscribed('bulk_email', 'recurring_email') === false) {
        formRef.value.setValues({
          ...formRef.value.schemaFormValues,
          isRecurring: 'once'
        });
        selectedInterval.value = undefined;
        isRecurring.value = false;
        updateFieldProp('hide', intervalIndex, true);
        updateFieldProp('hide', scheduleDate, false);
        upgradeFeature.value = 'recurring email';
        subscribeDialog.value = true;
      }
      else {
        updateFieldProp('hide', intervalIndex, false);
        updateFieldProp('hide', scheduleDate, true);
        isRecurring.value = true;
      }
    }
  }
}

async function onSubmit(val: Record<string, any>) {
  const isBroadcastToTeam = broadcastTo === 'team';
  const payload = { ...val };
  payload.isInternal = isBroadcastToTeam;
  if (!props.isCreate) {
    payload.attachmentIds = allAttachments.value.map(item => item.id);
  }
  if (isBroadcastToTeam) {
    const teamMemberType = val.teamMemberType;
    payload.teamMembers = {};
    if (teamMemberType === 'designations') {
      payload.teamMembers.designations = payload.teamMembersPayload;
    }
    else {
      payload.teamMembers.teamMembers = payload.teamMembersPayload;
    }
    delete payload.teamMemberType;
    delete payload.teamMembersPayload;
  }
  else {
    payload.clients = {};
    const clientType = val.clientType;
    if (clientType === 'businessEntities') {
      payload.clients.businessEntities = payload.clientsPayload;
    }
    else if (clientType === 'clientGroups') {
      payload.clients.clientGroups = payload.clientsPayload;
    }
    else {
      payload.clients.clients = payload.clientsPayload;
    }
    delete payload.clientType;
    delete payload.clientsPayload;
  }
  if (payload.scheduleBroadcast === 'now') {
    payload.scheduleDate = null;
  }
  if (payload.body) {
    payload.body = { content: payload.body } as ContentJSON;
  }
  if (templateId?.value) {
    payload.broadcastTemplateId = templateId?.value;
  }

  if (isRecurring.value) {
    delete payload.scheduleDate;
    payload.isRecurring = true;
    payload.recurringBroadcast = {
      day: payload.day,
      month: payload.month,
      hours: payload.hours,
      minutes: payload.minutes,
      interval: selectedInterval.value
    };
  }
  else {
    payload.isRecurring = false;
  }

  if (currentOp?.value === 'clone') {
    delete payload.id;
    createBroadcast(payload as CreateBroadcast);
    return;
  }

  if (payload.id) {
    const id = payload.id;
    const unwantedKeys = [
      'template',
      'status',
      'createdBy',
      'id',
      'broadcastTemplateId'
    ];
    unwantedKeys.forEach((key) => {
      delete payload[key];
    });
    delete payload.broadcastTemplateId;
    await updateBroadcast({ payload: payload as CreateBroadcast, id });
  }
  else createBroadcast(payload as CreateBroadcast);
}

const { mutateAsync: removeAttachment, isLoading: removingAttachment }
  = useMutation(
    ({
      broadcastId,
      attachmentId
    }: {
      broadcastId: string;
      attachmentId: string;
    }) => {
      return useBroadcastRemoveAttachment({ broadcastId, attachmentId });
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Remove',
          severity: 'success',
          summary: 'Remove Broadcast Attachment',
          detail: 'Broadcast Attachment Removed Successfully'
        });
      }
    }
  );

const { mutateAsync: createBroadcast, isLoading: createIsLoading }
  = useMutation(
    (payload: CreateBroadcast) => {
      return useBroadcastCreate(payload);
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Create',
          severity: 'success',
          summary: 'Create Broadcast',
          detail: 'Broadcast Created Successfully'
        });
        emit('success');
      }
    }
  );

const { mutateAsync: updateBroadcast, isLoading: updateIsLoading }
  = useMutation(
    ({ payload, id }: { payload: CreateBroadcast; id: string }) => {
      return useBroadcastUpdate(payload, id);
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Update',
          severity: 'success',
          summary: 'Update Broadcast',
          detail: 'Broadcast Updated Successfully'
        });
        emit('success');
      }
    }
  );
function goToCreatedPage(value: CreateBroadcast) {
  if (value?.clientType) {
    if (value.clientType === 'businessEntities') {
      return {
        label: `Add New ${$tConfig('BUSINESS_ENTITY')}`,
        route: 'admin-business-entities'
      };
    }
    else if (value.clientType === 'services') {
      return {
        label: 'Add New Project Template',
        route: 'admin-services'
      };
    }
  }
  if (value?.teamMemberType) {
    if (value.teamMemberType === 'designations') {
      return {
        label: 'Add New Designation',
        route: 'admin-roles-and-designations'
      };
    }
  }

  return {
    label: '',
    route: ''
  };
}

function handleRecurring(data: RecurringType) {
  const recurring = {
    day: data.weekly.weeks?.length ? data.weekly.weeks : data.monthly.days,
    month: data.monthly.months,
    hours: Number.isNaN(
      dayjs(
        data.daily.selectedTime
        || data.weekly.selectedTime
        || data.monthly.selectedTime
      ).get('hour')
    )
      ? undefined
      : dayjs(
        data.daily.selectedTime
        || data.weekly.selectedTime
        || data.monthly.selectedTime
      ).get('hour'),
    minutes: Number.isNaN(
      dayjs(
        data.daily.selectedTime
        || data.weekly.selectedTime
        || data.monthly.selectedTime
      ).get('minute')
    )
      ? undefined
      : dayjs(
        data.daily.selectedTime
        || data.weekly.selectedTime
        || data.monthly.selectedTime
      ).get('minute')
  };
  formRef.value.setValues({
    ...formRef.value.schemaFormValues,
    ...recurring
  });
  formRef.value.validate({ mode: 'silent' });
}

watchEffect(() => {
  if (props.broadcast) {
    allAttachments.value = props?.broadcast?.attachments as Attachment[];
  }
  setTimeout(() => {
    if (!props.isCreate && broadcast.value) {
      formRef.value.setValues(getBroadcastValue());
      if (broadcast.value.isRecurring) {
        isRecurring.value = true;
        selectedInterval.value = broadcast.value.recurringBroadcast?.interval;
      }
      handleRadioClick(
        formRef.value.schemaFormValues,
        broadcastTo === 'team' ? 'teamMemberType' : 'clientType',
        false
      );
      handleRadioClick(formRef.value.schemaFormValues, 'isRecurring');
      handleRadioClick(formRef.value.schemaFormValues, 'scheduleBroadcast');
      (formRef.value?.schemaForm[0] as HTMLFormElement).focus();
      (formRef.value?.schemaForm[0] as HTMLFormElement).blur();
    }
  }, 1000);
});
</script>

<template>
  <CommonLoading v-if="fetchingPlaceholders" />
  <CommonSchemaForm
    v-else
    ref="formRef"
    :key="formKey"
    :data="formData"
    :primary-btn-loading="createIsLoading || updateIsLoading"
    is-editor-placeholder
    @radio-click="handleRadioClick"
    @submit="onSubmit"
    @secondary-btn-click="
      emit(
        'back',
        type,
        templateId as string,
        broadcast?.name as string,
        broadcast?.description as string,
        broadcast?.type as string,
        broadcast?.body as string,
        broadcast?.subject as string,
      )
    "
  >
    <template #attachments="{ ...attrs }">
      <label class="block font-medium text-900">
        {{ attrs.label }}
      </label>
      <div class="field mt-2">
        <template v-if="allAttachments?.length > 0">
          <a
            href=""
            tabindex="0"
            class="underline font-medium"
            @click.prevent="prepareAttachmentsList()"
          >{{
            allAttachments?.length > 1
              ? `${allAttachments?.length} documents`
              : `${allAttachments?.length} document`
          }}
            attached</a>
          <span class="inline-block mx-1">/</span>
          <a
            href=""
            tabindex="0"
            class="underline font-medium"
            @click.prevent="prepareForAttachment()"
          >Attach More</a>
        </template>
        <template v-else>
          <a
            href=""
            tabindex="0"
            class="underline font-medium"
            @click.prevent="prepareForAttachment()"
          >Attach</a>
        </template>
      </div>
    </template>
    <template #[broadcastToPayloadName]="{ ...attrs }">
      <div class="field mb-0">
        <VField
          v-slot="{ handleChange, value, validate }"
          :name="broadcastToPayloadName"
        >
          <MultiSelect
            :tabindex="0"
            class="w-full"
            :model-value="value"
            v-bind="attrs"
            @update:model-value="handleChange"
            @blur="validate()"
          >
            <template #header>
              <RouterLink
                v-if="
                  goToCreatedPage(attrs?.values as unknown as CreateBroadcast)
                    .route
                "
                :to="{
                  name: goToCreatedPage(
                    attrs?.values as unknown as CreateBroadcast,
                  ).route,
                }"
                class="flex align-items-center py-2 px-3 font-medium text-sm text-gray-500 hover:text-gray-700"
              >
                {{
                  goToCreatedPage(attrs?.values as unknown as CreateBroadcast)
                    .label as string
                }}
                <Icon icon="mdi:external-link" class="ml-1 h-1.5rem w-1.5rem" />
              </RouterLink>
            </template>
            <template #option="slotProps">
              <div class="w-full flex justify-content-between">
                <div>{{ slotProps.option.name }}</div>
                <div v-if="slotProps.option.org === null">
                  <span class="text-orange-500">Predefined</span>
                </div>
              </div>
            </template>
          </MultiSelect>
        </VField>
      </div>
    </template>
    <template #[`${RecipientsType}-label`]="{ ...attrs }">
      <span>{{ attrs.label }}</span>
      <span v-if="attrs.required" class="text-red-600 ml-1">*</span>
      <i
        v-tooltip="
          `The lists will only include verified ${
            RecipientsType === 'clientType' ? `${pluralize($tConfig('CLIENT').toLowerCase())}` : 'team members'
          }. Please ask the ${
            RecipientsType === 'clientType' ? `${$tConfig('CLIENT').toLowerCase()}` : 'team member'
          } to verify in order to receive broadcasts.`
        "
        class="pi pi-info-circle text-black ml-1 mt-1"
      />
    </template>
    <template #interval="values">
      <div v-if="isRecurring">
        <div class="field md:w-6">
          <label class="block font-medium text-900">
            Interval
            <span class="text-red-500">*</span>
          </label>
          <VField v-slot="{ handleChange, value, validate }" name="interval">
            <Dropdown
              :tabindex="0"
              class="w-full"
              :model-value="value"
              option-label="name"
              option-value="value"
              :options="[
                { name: 'Daily', value: 'DAILY' },
                { name: 'Weekly', value: 'WEEKLY' },
                { name: 'Monthly', value: 'MONTHLY' },
              ]"
              placeholder="Select Interval"
              @update:model-value="handleChange"
              @blur="validate({ mode: 'silent' })"
              @change="selectedInterval = $event.value"
            />
          </VField>
          <FormFeedbackMessage
            :errors="values.errors as Record<string, any>"
            :values="values"
            error-key="interval"
            :feedback="values.required"
          />
        </div>
        <BroadcastRecurring
          v-if="selectedInterval"
          :interval="selectedInterval"
          :recurring-broadcast="broadcast?.recurringBroadcast"
          @recurring="handleRecurring"
        />
      </div>
    </template>
    <template #subject="{ ...attrs }">
      <div class="field mb-0">
        <label class="block font-medium text-900">
          {{ attrs.label }}
          <span class="text-red-500">*</span>
        </label>
        <VField v-slot="{ handleChange, value, validate }" name="subject">
          <Editor
            :model-value="`${value || ''}`"
            :editor-style="{ height: '10rem' }"
            :modules="editorModules"
            v-bind="attrs"
            @update:model-value="handleChange"
            @text-change="(e: any) => handleChange(e.htmlValue, true)"
            @blur="validate"
          >
            <template #toolbar>
              <select
                v-if="editorModules?.placeholder.placeholders?.length"
                class="ql-placeholder"
              >
                <option value="" class="hide-item" />
                <option
                  v-for="option in editorModules?.placeholder.placeholders"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.label }}
                </option>
              </select>
            </template>
          </Editor>
        </VField>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="(attrs.errors as ComputedRef).value"
            :values="(attrs.values as ComputedRef).value"
            error-key="subject"
            :feedback="true"
          />
        </transition>
      </div>
    </template>
    <template #body="{ ...attrs }">
      <div class="field mb-0">
        <label class="block font-medium text-900">
          {{ attrs.label }}
          <span v-if="attrs.required" class="text-red-500">*</span>
        </label>
        <VField v-slot="{ handleChange, value, validate }" name="body">
          <Editor
            :model-value="`${value || ''}`"
            :editor-style="{ height: '10rem' }"
            :modules="editorModules"
            v-bind="attrs"
            @update:model-value="handleChange"
            @text-change="(e: any) => {
              handleChange(e.htmlValue, true);
            }"
            @blur="validate()"
          >
            <template #toolbar>
              <span class="ql-formats">
                <select class="ql-header" defaultValue="0">
                  <option value="1">Heading</option>
                  <option value="2">Subheading</option>
                  <option value="0">Normal</option>
                </select>
                <select class="ql-font">
                  <option />
                  <option value="serif" />
                  <option value="monospace" />
                </select>
                <select
                  v-if="attrs.placeholderOptions?.length"
                  class="ql-placeholder"
                >
                  <option value="" class="hide-item" />
                  <option
                    v-for="option in attrs.placeholderOptions"
                    :key="option.id"
                    :value="option.id"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </span>
              <span class="ql-formats">
                <button aria-label="ql-bold" class="ql-bold" type="button" />
                <button aria-label="ql-italic" class="ql-italic" type="button" />
                <button aria-label="ql-underline" class="ql-underline" type="button" />
              </span>
              <span class="ql-formats">
                <select class="ql-color" />
                <select class="ql-background" />
              </span>
              <span class="ql-formats">
                <button
                  aria-label="ql-list"
                  class="ql-list"
                  value="ordered"
                  type="button"
                />
                <button
                  aria-label="ql-list"
                  class="ql-list"
                  value="bullet"
                  type="button"
                />
                <select class="ql-align">
                  <option defaultValue />
                  <option value="center" />
                  <option value="right" />
                  <option value="justify" />
                </select>
              </span>
              <span class="ql-formats">
                <button aria-label="ql-link" class="ql-link" type="button" />
                <button aria-label="ql-image" class="ql-image" type="button" />
                <button aria-label="ql-video" class="ql-video" type="button" />
                <button aria-label="ql-code-block" class="ql-code-block" type="button" />
              </span>
              <span class="ql-formats">
                <button aria-label="ql-clean" class="ql-clean" type="button" />
              </span>
            </template>
          </Editor>
        </VField>
        <div class="flex w-full justify-content-between mt-2">
          <transition mode="out-in" name="field-slide-down">
            <FormFeedbackMessage
              :errors="(attrs.errors as ComputedRef).value"
              :values="(attrs.values as ComputedRef).value"
              error-key="body"
              :feedback="true"
            />
          </transition>
          <CommonEditorRewrite
            :form-ref="(formRef as SchemaFormRef)"
            label="Re-write"
            size="small"
            class="max-w-max"
            :disabled="!(attrs.values as any)?.body || (attrs.values as any)?.body.includes('{{')"
            :tooltip="(attrs.values as any)?.body.includes('{{') ? 'To Rewrite email please remove shortcodes and try it out' : ''"
            :editor-field-name="(attrs.name as string)"
          />
        </div>
      </div>
    </template>
  </CommonSchemaForm>

  <Dialog
    v-model:visible="attachDialog"
    :modal="true"
    append-to="body"
    :header="
      uploadFromDesktopDialog
        ? 'Upload from Desktop'
        : isGalleryMoveDialog
          ? 'Select from Gallery'
          : 'How would you like to attach?'
    "
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
    @hide="closeAttachmentDialog"
  >
    <div
      v-if="!uploadFromDesktopDialog && !isGalleryMoveDialog"
      class="text-center"
    >
      <Button v-if="canDo('gallery', 'list')" class="mr-3" @click="isGalleryMoveDialog = true">
        Select from Gallery
      </Button>
      <Button @click="uploadFromDesktopDialog = true">
        Upload from Desktop
      </Button>
    </div>
    <template v-if="uploadFromDesktopDialog">
      <p class="mb-2">
        Supported formats: jpeg, jpg, pdf, doc, docx, xls, xlsx, ppt, pptx, txt,
        csv.
        <br>Max size: 5MB.
      </p>
      <CommonFileUpload
        ref="uploadFileRef"
        name="uploadFileRef"
        custom-upload
        :multiple="true"
        :max-file-size="5000000"
        accept="application/pdf, image/png, image/jpeg, image/jpeg, image/gif, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, text/plain, text/csv"
        @uploader="(files: UploadFilesPayload) => uploadFiles(files)"
      >
        <template #empty>
          <p>Drag and drop files to here to upload.</p>
        </template>
      </CommonFileUpload>
      <Button
        label="Back"
        icon="pi pi-chevron-left"
        class="max-w-max p-button-text mt-3"
        @click="uploadFromDesktopDialog = false"
      />
    </template>

    <CommonGalleryFileTree
      v-if="isGalleryMoveDialog"
      @back="isGalleryMoveDialog = false"
      @files-selected="uploadFiles"
    />
  </Dialog>

  <Dialog
    v-model:visible="attachmentsListDialog"
    :modal="true"
    append-to="body"
    header="Attachments"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
  >
    <ol
      v-if="allAttachments.length"
      class="project-clients-list pl-3 p-0 m-0 formgrid"
    >
      <li v-for="(item, index) in allAttachments" :key="index" class="col py-1">
        <div class="flex">
          <a
            :href="getAttachmentUrl(item.path)"
            target="_blank"
            class="flex flex-1 align-items-center font-medium cursor-pointer text-gray-900 hover:text-gray-600"
          >
            {{ item.name }}
          </a>
          <Button
            type="button"
            icon="pi pi-trash"
            aria-label="remove-attachment"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="prepareRemoveAttachment(index, item)"
          />
        </div>
      </li>
    </ol>
    <template v-else>
      No attachments available
    </template>
  </Dialog>

  <CommonConfirmRemoveDialog
    v-if="attachmentToRemove && confirmRemoveAttachmentDialog"
    :visible="confirmRemoveAttachmentDialog"
    :record-to-remove="(attachmentToRemove as unknown as Record<string, unknown>)"
    title="Confirm Delete Attachment"
    @confirm="handleRemoveAttachment(attachmentToRemove.index)"
    @hide="confirmRemoveAttachmentDialog = false"
  />
  <CommonSubscribeDialog
    v-if="subscribeDialog"
    :visible="subscribeDialog"
    :feature="upgradeFeature"
    @hide="subscribeDialog = false"
  />
</template>

<style lang="scss" scoped></style>
