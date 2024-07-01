import $api from '@/plugins/api';
import type { GettingStarted } from '@/types/getting-started.type';
import type { TimelineSteps } from '@/types/common.type';
const { sortCompare } = useUtilityFns();

export async function useGettingStartedList(resourceId: string) {
  const { data } = await $api.get<GettingStarted[]>(
    `getting-started/${resourceId}`
  );
  let steps = data.map((step: GettingStarted) => ({
    ...step.step,
    status: step.status,
    data: step.data,
  }));
  steps = steps.sort(sortCompare({ compareProp: 'sortOrder', order: 'asc' }));

  const timelineSteps = steps.map((step) => {
    return {
      title: step.title,
      subtitle: step.subtitle,
      icon: step?.status !== 0 ? 'pi pi-check-circle' : 'pi pi-circle',
      color: step?.status !== 0 ? '#05A34F' : '#607D8B',
      content: step.data,
      hideCta: step.title === 'Basic Info' ? true : false,
      route: step.route,
      status: step?.status,
      isRequired: step?.isRequired,
      hidden: step?.hidden,
    };
  }) as unknown as TimelineSteps[];

  return [...timelineSteps];
}
