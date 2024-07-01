import app from '@/app';
import $api from '@/plugins/api';
import type {
  FieldType,
  FormCurationPayload,
  RigidTemplateSchema,
  TemplateField,
  TemplateFieldProp,
  TemplateFieldRule,
  TemplateResponse,
  TemplateUpdatePayload,
  Webform,
  WebformCreatePayload,
  WebformSubmitPayload
} from '@/types/webforms.type';
import type { PaginatedResponse } from '@/types/common.type';
import { InputAttrType } from '@/types/webforms.type';
import { date, number, string } from 'yup';
import type { VueformComponent } from '@vueform/vueform';
import type { Attachment } from '@/types/attachment.type';

// import { useDialog } from 'primevue/usedialog';

const { toCamelCase } = useVueFilters();
const { isFalsy } = useUtilityFns();
const { onUpload, getAttachment, getAttachmentUrl, removePublicAttachment }
  = useAttachments();

const dialog = app.config.globalProperties.$confirm;

export function useWebformTemplates() {
  const baseUrl = 'webform-template';
  const currentBlock = ref<TemplateField>();

  const isStatic = computed(() => currentBlock.value?.isStatic);
  const isHeading = computed(() => currentBlock.value?.is === 'BaseHeading');
  const isDivider = computed(() => currentBlock.value?.is === 'BaseDivider');

  const isMultiFile = computed(
    () =>
      currentBlock.value?.is === 'BaseFileUpload'
      && currentBlock.value?.attrs?.isMultiple
  );
  const isMultiSelect = computed(
    () =>
      currentBlock.value?.is === 'BaseSelect'
      && currentBlock.value?.attrs?.isMultiple
  );
  const isCheckboxGroup = computed(
    () =>
      currentBlock.value?.is === 'BaseCheckbox'
      && currentBlock.value?.attrs?.isMultiple
  );
  const isRadioGroup = computed(
    () =>
      currentBlock.value?.is === 'BaseRadioButton'
      && currentBlock.value?.attrs?.isMultiple
  );
  const enableIsMultiple = computed(() => {
    const fieldsToCheck = [
      'BaseSelect',
      'BaseRadioButton',
      'BaseCheckbox',
      'BaseFileUpload'
    ];
    return fieldsToCheck.includes(currentBlock.value?.is as string);
  });
  const isCheckboxOrRadio = computed(() => {
    const fieldsToCheck = ['BaseRadioButton', 'BaseCheckbox'];
    return fieldsToCheck.includes(currentBlock.value?.is as string);
  });

  const getAttachmentIds = (attachments: Attachment[]) => {
    return attachments.map((attachment: Attachment) => attachment.id);
  };

  const fileRemoveCallback = () => {
    dialog.require({
      header: 'Remove File',
      message:
        'Attached file will be removed only upon successful form submission.',
      rejectClass: 'hidden',
      // acceptClass: 'hidden',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Ok'
    });
  };

  const uploadTempEndpoint = async (file: File, el$: VueformComponent) => {
    const currentWebform = el$.form$?.$attrs?.webform;
    const uploadResults = await onUpload({
      payload: {
        files: file
      },
      isPublic: true,
      webform: currentWebform
    });
    return {
      tmp: file.name,
      originalName: file.name,
      attachmentId: uploadResults.id
    };
  };

  const removeTempEndpoint = async (
    file: { tmp: string; originalName: string; attachmentId: string },
    el$: VueformComponent
  ) => {
    const currentWebform = el$.form$?.$attrs?.webform;

    dialog.require({
      header: 'Remove Attachment',
      message:
        'Attached file will be removed only upon successful form submission.',
      rejectClass: 'hidden'
    });
    return file.originalName;
    await removePublicAttachment({
      id: file.attachmentId as string,
      isPublic: true,
      payload: {
        userId: currentWebform?.createdBy?.id as string,
        orgId: currentWebform?.orgId as string
      }
    });
  };

  const availableFields = ref<FieldType[]>([
    {
      id: 'Heading',
      is: 'BaseHeading',
      name: 'Heading',
      description: 'Add heading to the form sections',
      icon: '',
      predefinedType: null,
      isStatic: true,
      props: {} as TemplateFieldProp,
      attrs: {
        type: InputAttrType.static,
        align: 'left',
        level: 1
      },
      rules: {},
      createdAt: '2021-09-13T04:58:09.372Z',
      updatedAt: '2024-01-08T07:29:10.187Z'
    },
    {
      id: 'Divider',
      is: 'BaseDivider',
      name: 'Divider',
      description: 'Add divider to the form sections',
      icon: '',
      predefinedType: null,
      isStatic: true,
      props: {
        label: 'Divider'
      } as TemplateFieldProp,
      attrs: {
        type: InputAttrType.static,
        top: '',
        bottom: ''
      },
      rules: {},
      createdAt: '2021-09-13T04:58:09.372Z',
      updatedAt: '2024-01-08T07:29:10.187Z'
    },
    {
      id: 'TEXT',
      is: 'BaseInput',
      name: 'Text Input',
      description: 'Text input allows you to collect text',
      icon: '',
      predefinedType: null,
      props: {} as TemplateFieldProp,
      attrs: {
        type: InputAttrType.text
      },
      rules: {},
      createdAt: '2021-09-13T04:58:08.352Z',
      updatedAt: '2024-01-08T07:29:09.425Z'
    },
    /* {
      id: 'PHONEINPUT',
      is: 'BaseInput',
      name: 'Phone Input',
      description: 'Phone input allows you to collect phone',
      icon: '',
      predefinedType: null,
      props: {} as TemplateFieldProp,
      attrs: {
        type: InputAttrType.text,
      },
      rules: {
        validate_phone: 'validate_phone',
      } as TemplateFieldRule,
      createdAt: '2021-09-13T04:58:08.352Z',
      updatedAt: '2024-01-08T07:29:09.425Z',
    }, */
    {
      id: 'NUMBER',
      is: 'BaseInput',
      name: 'Number Input',
      description: 'Number input allows you to collect number',
      icon: '',
      predefinedType: null,
      props: {} as TemplateFieldProp,
      attrs: {
        type: InputAttrType.number
      },
      rules: {},
      createdAt: '2021-09-13T04:58:08.547Z',
      updatedAt: '2024-01-08T07:29:09.539Z'
    },
    {
      id: 'EMAIL',
      is: 'BaseInput',
      name: 'Email Input',
      description: 'Email input allows you to collect email',
      icon: '',
      predefinedType: null,
      props: {} as TemplateFieldProp,
      attrs: {
        type: InputAttrType.email
      },
      rules: { email: 'email' } as TemplateFieldRule,
      createdAt: '2021-09-13T04:58:08.710Z',
      updatedAt: '2024-01-08T07:29:09.652Z'
    },
    {
      id: 'AMOUNT',
      is: 'BaseInput',
      name: 'Amount Input',
      description: 'Amount input allows you to collect currency amount',
      icon: '',
      predefinedType: null,
      props: {} as TemplateFieldProp,
      attrs: {
        step: 0.01,
        type: InputAttrType.number
      },
      rules: {},
      createdAt: '2021-09-13T04:58:08.875Z',
      updatedAt: '2024-01-08T07:29:09.787Z'
    },
    {
      id: 'DATE',
      is: 'BaseDatePicker',
      name: 'Date Input',
      description: 'Date input allows you to collect date',
      icon: '',
      predefinedType: null,
      props: {
        format: 'dd-MM-yyyy'
      } as TemplateFieldProp,
      attrs: {},
      rules: {},
      createdAt: '2021-09-13T04:58:09.043Z',
      updatedAt: '2024-01-08T07:29:09.911Z'
    },
    {
      id: 'SELECT',
      is: 'BaseSelect',
      name: 'Select Input',
      description: 'Select input allows you choose one or more options',
      icon: '',
      predefinedType: null,
      props: {
        multiple: false
      } as TemplateFieldProp,
      attrs: {
        type: InputAttrType.select
      },
      rules: {},
      createdAt: '2021-09-13T04:58:09.208Z',
      updatedAt: '2024-01-08T07:29:10.065Z'
    },
    {
      id: 'TEXTAREA',
      is: 'BaseTextArea',
      name: 'Text Area',
      description: 'Text area allows you to collect bunch of text.',
      icon: '',
      predefinedType: null,
      props: {} as TemplateFieldProp,
      attrs: {
        type: InputAttrType.textarea
      },
      rules: {},
      createdAt: '2021-09-13T04:58:09.372Z',
      updatedAt: '2024-01-08T07:29:10.187Z'
    },
    {
      id: 'RichTextEditor',
      is: 'BaseEditor',
      name: 'Rich Text Editor',
      description:
        'Rich Text Editor allows you enter Richtext format contents.',
      icon: '',
      predefinedType: null,
      props: {} as TemplateFieldProp,
      attrs: {
        type: InputAttrType.editor,
        readonly: true
      },
      rules: {},
      createdAt: '2021-09-13T04:58:09.372Z',
      updatedAt: '2024-01-08T07:29:10.187Z'
    },
    {
      id: 'RadioButton',
      is: 'BaseRadioButton',
      name: 'Radio Button',
      description: 'Radio button input allows you choose any one option',
      icon: '',
      predefinedType: null,
      props: {} as TemplateFieldProp,
      attrs: {
        type: InputAttrType.radio,
        disabled: true
      },
      rules: {},
      createdAt: '2021-09-13T04:58:09.372Z',
      updatedAt: '2024-01-08T07:29:10.187Z'
    },
    {
      id: 'Checkbox',
      is: 'BaseCheckbox',
      name: 'Checkbox',
      description: 'Checkbox input allows you choose one or more option',
      icon: '',
      predefinedType: null,
      props: {} as TemplateFieldProp,
      attrs: {
        type: InputAttrType.checkbox,
        disabled: true
      },
      rules: {},
      createdAt: '2021-09-13T04:58:09.372Z',
      updatedAt: '2024-01-08T07:29:10.187Z'
    },
    {
      id: 'InputSwitch',
      is: 'BaseSwitch',
      name: 'Toggle Switch',
      description: 'Switch option to toggle input',
      icon: '',
      predefinedType: null,
      props: {} as TemplateFieldProp,
      attrs: {
        type: InputAttrType.toggle,
        disabled: true
      },
      rules: {},
      createdAt: '2021-09-13T04:58:09.372Z',
      updatedAt: '2024-01-08T07:29:10.187Z'
    },
    {
      id: 'FileUpload',
      is: 'BaseFileUpload',
      name: 'File Upload',
      description: 'File Upload',
      icon: '',
      predefinedType: null,
      props: {} as TemplateFieldProp,
      attrs: {
        type: InputAttrType.file,
        disabled: true,
        drop: true
      },
      rules: {},
      createdAt: '2021-09-13T04:58:09.372Z',
      updatedAt: '2024-01-08T07:29:10.187Z'
    }
    /* {
      id: 'TABLE',
      is: 'BaseTable',
      name: 'Table',
      description: 'Identifies and populates table data.',
      icon: '',
      predefinedType: null,
      props: {},
      attrs: {},
      rules: {},
      createdAt: '2021-10-11T08:16:12.553Z',
      updatedAt: '2024-01-08T07:29:05.861Z',
    }, */
  ]);

  const schemaToVueformSchema = (
    schema: RigidTemplateSchema,
    isFromClient?: boolean
  ) => {
    const modifiedBlock: Record<string, any> = {};
    if (!schema)
      return {};
    return schema.rows
      .map(row => row)
      .flat()
      .map((row) => {
        return row.blocks
          .map(block => block)
          .flat()
          .map((block) => {
            currentBlock.value = block;
            let blockKey = `${
              block.props.label
                ? toCamelCase(block.props.label)
                : toCamelCase(block.name)
            }`;
            if (modifiedBlock[blockKey] !== undefined) {
              let previousOccurrence: string | number = (
                Object.keys(modifiedBlock)
                  .filter((t: string) => t.includes(blockKey))
                  .pop() as string
              )
                .split('_')
                .pop() as string;
              previousOccurrence = !Number.isNaN(Number(previousOccurrence))
                ? Number(previousOccurrence)
                : 0;
              blockKey = `${blockKey}_${previousOccurrence + 1}`;
            }
            modifiedBlock[blockKey] = (() => {
              let tempBlock: TemplateField = {
                ...block,
                type: block.is === 'BaseInput' ? 'text' : block.attrs?.type,
                inputType: block.attrs?.type,
                rules:
                  typeof block.rules === 'object'
                    ? Object.keys(block.rules)
                    : block.rules,
                label: block.props.label || block.name,
                placeholder: block.props.placeholder,
                description: block.attrs.description,
                before: block.attrs.before,
                floating: false,
                columns: {
                  container: 12 / row.blocks.length,
                  label: 12,
                  wrapper: 12
                }
              };
              if (enableIsMultiple.value) {
                tempBlock = {
                  ...tempBlock,
                  inputType: InputAttrType.search,
                  search: true,
                  native: false,
                  autocomplete: 'off',
                  text: block.props.options ? block.props.options[0] : null,
                  items: block.props.options ? block.props.options : null
                };
              }
              if (['BaseSelect'].includes(block.is)) {
                tempBlock.inputType = InputAttrType.search;
              }
              if (isHeading.value) {
                tempBlock.tag = `h${block.attrs.level}`;
                tempBlock.type = 'static';
                tempBlock.content = block.props.label || block.name;
                tempBlock.align = block.attrs.align || 'left';
                tempBlock.label = '';
              }
              if (isDivider.value) {
                tempBlock.top = block.attrs.top;
                tempBlock.bottom = block.attrs.bottom;
                tempBlock.tag = `hr`;
                tempBlock.type = 'static';
                tempBlock.label = '';
              }
              if (isMultiSelect.value) {
                tempBlock.type = InputAttrType.multiselect;
                tempBlock.hideSelected = false;
              }
              if (block.is === 'BaseFileUpload') {
                tempBlock.drop = block.attrs.drop;
                tempBlock.uploadTempEndpoint = isFromClient
                  ? uploadTempEndpoint
                  : (file: File, el$: VueformComponent) => file.name;
                tempBlock.removeTempEndpoint = isFromClient
                  ? removeTempEndpoint
                  : (
                      file: {
                        tmp: string;
                        originalName: string;
                        attachmentId: string;
                      },
                      el$: VueformComponent
                    ) => file.originalName;
                tempBlock.onRemove = isFromClient
                  ? fileRemoveCallback
                  : undefined;
                tempBlock.softRemove = !isFromClient;
              }
              if (isMultiFile.value) {
                tempBlock.type = InputAttrType.multifile;
              }
              if (isRadioGroup.value) {
                tempBlock.type = InputAttrType.radiogroup;
              }
              if (isCheckboxGroup.value) {
                tempBlock.type = InputAttrType.checkboxgroup;
              }
              if (block.is === 'BaseSwitch') {
                tempBlock.text = block.attrs.switchText;
              }
              if (block.is === 'BaseDatePicker') {
                tempBlock = {
                  ...tempBlock,
                  displayFormat: 'DD MMM  YYYY',
                  valueFormat: 'DD-MM-YYYY'
                };
              }
              return tempBlock;
            })();
            return modifiedBlock;
          });
      })
      .flat()
      .reduce(
        (acc, obj) => ({
          ...acc,
          ...obj
        }),
        {}
      );
  };
  const getAll = async ({
    page,
    limit,
    filters,
    sortBy,
    isTemplate
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
    isTemplate?: boolean;
  }) => {
    const { data } = await $api.get<PaginatedResponse<Webform>>(
      `${baseUrl}${isTemplate ? '?default=true' : ''}`,
      {
        params: {
          page,
          limit,
          filters,
          sortBy
        }
      }
    );
    return data;
  };

  /*   function mergeSchemaWithFormValues(schema, formValues) {
    const result: any = {};
    for (const key in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, key)) {
        const config = schema[key];
        const formValue = formValues[key];

        result[key] = {
          ...config,
          value: formValue,
        };
      }
    }
    const resultJson = JSON.stringify(result, null, 2);
    return resultJson;
  } */

  const getOne = async (id: string) => {
    const { data } = await $api.get<Webform>(`${baseUrl}/${id}`);
    return data;
  };

  const createOne = async (payload: Partial<Webform>) => {
    const { data } = await $api.post<Webform>(`${baseUrl}`, payload);
    return data;
  };

  const remove = async (id: string) => {
    const { data } = await $api.delete<Webform>(`${baseUrl}/${id}`);
    return data;
  };

  const update = async ({
    id,
    payload
  }: {
    id: string;
    payload: Partial<Webform>;
  }) => {
    const { data } = await $api.patch<Webform>(`${baseUrl}/${id}`, payload);
    return data;
  };

  return {
    currentBlock,
    isStatic,
    isHeading,
    isDivider,
    isMultiSelect,
    isCheckboxGroup,
    isRadioGroup,
    enableIsMultiple,
    isCheckboxOrRadio,
    availableFields,
    schemaToVueformSchema,
    getAll,
    getOne,
    createOne,
    remove,
    update,
    getAttachmentIds
  };
}
export function useWebforms() {
  const baseUrl = 'webform';

  const createOne = async (payload: WebformCreatePayload) => {
    const { data } = await $api.post<Webform>(`${baseUrl}`, payload);
    return data;
  };
  const getAll = async ({
    page,
    limit,
    filters,
    sortBy
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<Webform>>(`${baseUrl}`, {
      params: {
        page,
        limit,
        filters,
        sortBy
      }
    });
    return data;
  };

  const getAllPendingWebforms = async ({
    page,
    limit,
    filters
  }: {
    page?: number;
    limit?: number;
    filters?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<Webform>>(
      `portal/webform`,
      {
        params: {
          page,
          limit,
          filters
        }
      }
    );
    return data;
  };

  const getOnePortalWebform = async (id: string) => {
    const { data } = await $api.get<Webform>(`portal/webform/${id}`);
    return data;
  };

  const getOne = async (id: string) => {
    const { data } = await $api.get<Webform>(`${baseUrl}/${id}`);
    if (!isFalsy(data?.schema) && !isFalsy(data?.values)) {
      const result: any = {};
      for (const key in data.schema) {
        if (Object.prototype.hasOwnProperty.call(data.schema, key)) {
          const config = (data.schema as any)[key];
          const formValue = data.values[key];
          result[key] = {
            ...config,
            value: formValue
          };
        }
      }
      data.schema = result;
    }
    return data;
  };

  const remind = async (id: string) => {
    const { data } = await $api.post<Webform>(`${baseUrl}/${id}/remind`);
    return data;
  };

  const requestUpdate = async (id: string) => {
    const { data } = await $api.post<Webform>(
      `${baseUrl}/${id}/update-requested`
    );
    return data;
  };

  const remove = async (id: string) => {
    const { data } = await $api.delete<Webform>(`${baseUrl}/${id}`);
    return data;
  };

  const update = async ({
    id,
    payload,
    sendToClient
  }: {
    id: string;
    payload: Partial<Webform>;
    sendToClient?: boolean;
  }) => {
    const { data } = await $api.patch<Webform>(
      `${baseUrl}/${id}${
        sendToClient !== undefined ? `?sendToClient=${sendToClient}` : ''
      }`,
      payload
    );
    return data;
  };

  const submitForm = async ({
    id,
    payload
  }: {
    id: string;
    payload: WebformSubmitPayload;
  }) => {
    const { data } = await $api.patch(`${baseUrl}/${id}/submit`, payload);
    return data;
  };

  return {
    getAll,
    getOne,
    createOne,
    remind,
    requestUpdate,
    remove,
    update,
    submitForm,
    getAllPendingWebforms,
    getOnePortalWebform
  };
}

export interface ListBoxOptionType {
  id?: string | number;
  name?: string;
  [key: string]: any;
}

export function addIdsToOptions(
  options: Array<string | number>
): ListBoxOptionType[] {
  /* ListBox used for select tag functions when 'id' key is provided along with name */
  const out = [] as ListBoxOptionType[];

  for (const [index, value] of options.entries()) {
    out.push({ id: index, name: String(value) });
  }
  return out;
}

export function useGetEnabledModel() {
  const state = reactive({
    success: false,
    error: null,
    data: {} as any
  });

  const getEnabledModel = async (
    modelId: string,
    withTemplates = false,
    withServiceModel = false
  ) => {
    try {
      const url = `/models/${modelId}?templates=${withTemplates}&servicemodel=${withServiceModel}`;
      const { data } = await $api.get(url);
      state.data = data;
      state.success = true;
    }
    catch (e) {
      state.error = e as any;
    }
  };
  return {
    ...toRefs(state),
    getEnabledModel
  };
}

export function useEnabledModelList() {
  const state = reactive({
    success: false,
    error: null,
    data: {} as any
  });

  const listEnabledModels = async () => {
    try {
      const url = '/models';
      const { data } = await $api.get(url);
      if (data) {
        state.success = true;
        state.data = data;
      }
    }
    catch (e) {
      state.success = false;
      state.error = e as any;
    }
  };
  return {
    listEnabledModels,
    ...toRefs(state)
  };
}

export function useUpdateTemplate() {
  const state = reactive({
    data: {} as TemplateResponse,
    success: false,
    error: false
  });

  const updateTemplate = async (
    modelId: string,
    templateId: string,
    payload: TemplateUpdatePayload
  ) => {
    try {
      const { data } = await $api.put<TemplateResponse>(
        `/models/${modelId}/templates/${templateId}`,
        payload
      );
      state.success = true;
      state.data = data;
      // toast.success('Template updated successfully', {
      //   timeout: 3000,
      // });
    }
    catch (e) {
      state.error = e as any;
    }
  };
  return {
    updateTemplate,
    ...toRefs(state)
  };
}

export function removeTextTypeForSelectTag(
  inputSchema: RigidTemplateSchema
): RigidTemplateSchema {
  const schema = structuredClone(toRaw(inputSchema));
  schema.rows.forEach((row) => {
    for (const block of row.blocks) {
      if (
        (block.is === 'BaseSelect' || block.is === 'BaseTextArea')
        && block.attrs
        && block.attrs?.type
      )
        delete block.attrs?.type;
      if (block.is === 'BaseTable' && block.props.columns) {
        for (const col of block.props.columns) {
          if (
            (col.is === 'BaseSelect' || col.is === 'BaseTextArea')
            && col.attrs
            && col.attrs?.type
          )
            delete col.attrs?.type;
        }
        if (!block.values)
          block.values = [];
      }
    }
  });
  return schema;
}

export function addTextTypeForSelectTag(
  schema: RigidTemplateSchema
): RigidTemplateSchema {
  schema.rows.forEach((row) => {
    for (const block of row.blocks) {
      if (block.is === 'BaseSelect' || block.is === 'BaseTextArea') {
        if (!block.attrs)
          block.attrs = {};
        block.attrs.type = InputAttrType.text;
      }
      if (block.is === 'BaseTable') {
        block.props.columns?.forEach((block) => {
          if (block.is === 'BaseSelect' || block.is === 'BaseTextArea') {
            if (!block.attrs)
              block.attrs = {};
            block.attrs.type = InputAttrType.text;
          }
        });
      }
    }
  });
  return schema;
}

export default function deserializeRule(rules: TemplateFieldRule) {
  let validationRule: any;
  switch (rules.type) {
    case 'number':
      validationRule = number();
      break;
    case 'date':
      validationRule = date();
      break;
    default:
      validationRule = string();
  }

  Object.entries(rules).forEach(([key, value]) => {
    if (key === 'required' && value)
      validationRule = validationRule.required();

    if (key === 'min')
      validationRule = validationRule.min(`${value}`);

    if (key === 'max')
      validationRule = validationRule.max(`${value}`);

    if (key === 'lowercase' && value)
      validationRule = validationRule.lowercase();

    if (key === 'uppercase' && value)
      validationRule = validationRule.uppercase();

    if (key === 'trim' && value)
      validationRule = validationRule.trim();

    if (key === 'format') {
      switch (value) {
        case 'email':
          validationRule = validationRule.email();
          break;
        case 'url':
          validationRule = validationRule.url();
          break;
        case 'uuid':
          validationRule = validationRule.uuid();
          break;
      }
    }
    if (key === 'regex' && value)
      validationRule = validationRule.matches(new RegExp(`${value}`));
  });
  return validationRule;
}

export function useUpdateTemplateForm() {
  const state = reactive({
    success: false,
    error: false
  });

  const updateTemplateForm = async (
    fileId: string,
    payload: FormCurationPayload
  ) => {
    try {
      await $api.post<null>(`/files/${fileId}/form`, payload);
      state.success = true;
      // toast.success('Form updated successfully.', {
      //   timeout: 3000,
      // });
    }
    catch (e) {
      state.error = e as any;
    }
  };
  return {
    updateTemplateForm,
    ...toRefs(state)
  };
}

export function useCreateTemplate() {
  const state = reactive({
    success: false,
    error: false
  });

  const createTemplate = async (modelId: string, payload: any) => {
    try {
      await $api.post<null>(`/models/${modelId}/templates`, payload);
      state.success = true;
      // toast.success('Template created successfully.', {
      //   timeout: 2000,
      // });
    }
    catch (e) {
      state.error = e as any;
    }
  };
  return {
    createTemplate,
    ...toRefs(state)
  };
}

export function useListTemplates() {
  const state = reactive({
    success: false,
    data: {} as any,
    error: false
  });

  const listTemplates = async (modelId: string, page = 1, limit = 100) => {
    try {
      const { data } = await $api.get<any>(
        `/models/${modelId}/templates?page=${page}&limit=${limit}`
      );
      state.success = true;
      state.data = data;
    }
    catch (e) {
      state.error = e as any;
    }
  };
  return {
    listTemplates,
    ...toRefs(state)
  };
}

export function useDetailTemplate() {
  const state = reactive({
    success: false,
    data: {} as any,
    error: false
  });

  const getTemplate = async (modelId: string, templateId: string) => {
    try {
      const { data } = await $api.get<any>(
        `/models/${modelId}/templates/${templateId}`
      );
      state.success = true;
      state.data = data;
    }
    catch (e) {
      state.error = e as any;
    }
  };
  return {
    getTemplate,
    ...toRefs(state)
  };
}
