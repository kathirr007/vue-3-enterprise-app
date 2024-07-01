/* // import { EventBus } from 'primevue/utils';
import mitt from 'mitt';

export function useEventBus() {
  const $eventBus = mitt();
  // const $eventBus = EventBus();

  return { $eventBus };
} */

import type { Emitter } from 'mitt';
import mitt from 'mitt';

type Events = {
  'added-new-integration': Record<string, any> | undefined;
  'fetched-all-integrations': Record<string, any> | undefined;
};

export const emitter: Emitter<Events> = mitt<Events>();

export function useMittEventBus() {
  // const $eventBus = mitt();
  // const $eventBus = EventBus();

  return { $eventBus: emitter };
}
