import axios from 'axios';

interface NotificationInitPayload {
  applicationIdentifier: string;
  subscriberId: string;
  hmacHash?: string;
}

export function useNotifications() {
  const notificationBaseUrl = 'https://api.novu.co/v1/widgets';
  const initialize = async (payload: NotificationInitPayload) => {
    const { data } = await axios.post(
      `${notificationBaseUrl}/session/initialize`,
      payload
    );
    return data;
  };
  const organization = async () => {
    const { data } = await axios.get(`${notificationBaseUrl}/organization`);
    return data;
  };
  const unseen = async () => {
    const { data } = await axios.get(
      `${notificationBaseUrl}/notifications/unseen`
    );
    return data;
  };

  return {
    initialize,
    organization,
    unseen
  };
}
