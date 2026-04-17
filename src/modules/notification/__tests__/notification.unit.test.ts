import { sendNotificationEmail } from '../notification.service';

describe('Notification Service - Unit Tests', () => {
  it('retourne le placeholder attendu', async () => {
    const result = await sendNotificationEmail();

    expect(result).toEqual({
      delivered: false,
      reason: 'Notification module is a placeholder in the initial backend setup',
    });
  });
});
