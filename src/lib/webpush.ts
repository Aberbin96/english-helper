import webpush from "web-push";

function getWebPush() {
  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_FROM}`,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return webpush;
}

export async function sendNotification(
  subscriptionJson: string,
  payload: { title: string; body: string }
) {
  const wp = getWebPush();
  const sub = JSON.parse(subscriptionJson) as webpush.PushSubscription;
  await wp.sendNotification(sub, JSON.stringify(payload));
}
