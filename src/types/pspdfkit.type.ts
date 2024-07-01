import type { AnnotationsUnion } from 'pspdfkit';

export type AnnotationsPressEvent = {
  annotation: AnnotationsUnion;
  nativeEvent: Event;
  preventDefault?: () => void;
  selected: boolean;
};

export type AnnotationsFocusEvent = {
  annotation: AnnotationsUnion;
  nativeEvent: FocusEvent;
};
export type AnnotationsBlurEvent = {
  annotation: AnnotationsUnion;
  nativeEvent: FocusEvent;
};

export type SaveStateChangeEvent = {
  hasUnsavedChanges: boolean;
};
