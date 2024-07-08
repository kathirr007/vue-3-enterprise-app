import type { AnnotationsUnion } from 'pspdfkit';

export interface AnnotationsPressEvent {
  annotation: AnnotationsUnion;
  nativeEvent: Event;
  preventDefault?: () => void;
  selected: boolean;
}

export interface AnnotationsFocusEvent {
  annotation: AnnotationsUnion;
  nativeEvent: FocusEvent;
}
export interface AnnotationsBlurEvent {
  annotation: AnnotationsUnion;
  nativeEvent: FocusEvent;
}

export interface SaveStateChangeEvent {
  hasUnsavedChanges: boolean;
}
