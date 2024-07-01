import type { MaybeRef } from '@vueuse/core';
import type { Component, ComponentInternalInstance, ComputedRef } from 'vue';
import type { SchemaLike } from 'yup/lib/types';
import type {
  FieldEntry,
  FormState,
  FormValidationResult,
  ValidationOptions,
  ValidationResult
} from 'vee-validate';
import type { OmitDynamicKey } from './common.type';

export interface SchemaFormRef {
  props: any;
  schemaForm: HTMLElement | HTMLFormElement;
  schemaFormValues: any;
  schemaFormRefs: ComponentInternalInstance;
  setValues: (fields: Record<string, unknown>) => void;
  setFieldValue: (field: string, value: any) => void;
  setErrors: (fields: Partial<Record<string, string | undefined>>) => void;
  setFieldError: (
    field: string,
    message: string | string[] | undefined
  ) => void;
  handleReset: () => void;
  onSubmit: () => void;
  resetForm: (
    state?: Partial<FormState<Record<string, any>>> | undefined
  ) => void;
  validate: (
    opts?: Partial<ValidationOptions> | undefined
  ) => Promise<FormValidationResult<Record<string, any>>>;
  validateField: (field: string) => Promise<ValidationResult>;
  errors?: ComputedRef<Partial<Record<string, string | undefined>>>;
  meta?: Record<string, any>;
  fields: Ref<FieldEntry<any>[]>;
  remove(idx: number): void;
  replace(newArray: any[]): void;
  update(idx: number, value: any): void;
  push(value: any): void;
  swap(indexA: number, indexB: number): void;
  insert(idx: number, value: any): void;
  prepend(value: any): void;
  move(oldIdx: number, newIdx: number): void;
}

export type OptionValueFn = (option: any) => any;
export interface SchemaFormField {
  label?: string;
  helpText?: string;
  name: string;
  hide?: boolean;
  required?: boolean;
  showFeedback?: boolean;
  as?: Component;
  type?: string;
  direction?: string;
  modelValue?: string | undefined;
  options?: Record<string, any>[];
  placeholderOptions?: { id: string; label: string; [key: string]: unknown }[];
  optionLabel?: string;
  optionValue?: string | OptionValueFn;
  formGridClass?: string;
  dividerClass?: string;
  isLastField?: boolean;
  isRadioStacked?: boolean;
  softHide?: boolean;
  showSlot?: boolean;
  showLabelSlot?: boolean;
  [key: string]: unknown;
}

export type SchemaFormFieldWithoutDynamicKey = Omit<
  OmitDynamicKey<SchemaFormField>,
  'name'
>;

export interface SchemaForm {
  fields: SchemaFormField[];
  btnText?: string;
  secondaryBtnText?: string;
  validationSchema?: SchemaLike;
  initialValues?: MaybeRef<Record<string, any>> | undefined;
  initialTouched?: Record<string, boolean>;
  validateOnMount?: boolean;
  values?: unknown;
  hideButtons?: boolean;
  hideSecondaryBtn?: boolean;
  hidePrimaryBtn?: boolean;
}
