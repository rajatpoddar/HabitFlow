/**
 * HabitFlow Service Worker
 * Handles push notifications for habit reminders
 */

// Listen for push events
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, habitId, icon } = data;

    const options = {
      body: body || 'Keep your streak alive! 🔥',
      icon: icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: `habit-${habitId}`,
      requireInteraction: true,
      actions: [
        {
          action: 'complete',
          title: 'Mark Done ✓',
        },
        {
          action: 'snooze',
          title: 'Snooze 10min',
        },
      ],
      data: {
        habitId,
        url: '/dashboard',
        timestamp: Date.now(),
      },
    };

    event.waitUntil(
      self.registration.showNotification(title || 'HabitFlow Reminder', options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, notification } = event;
  const { habitId, url } = notification.data;

  if (action === 'complete') {
    // Mark habit as complete
    event.waitUntil(
      fetch('/api/habits/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, date: new Date().toISOString() }),
      })
        .then(() => {
          // Show success notification
          return self.registration.showNotification('Habit Completed! 🎉', {
            body: 'Great job keeping your streak alive!',
            icon: '/icons/icon-192.png',
            tag: 'habit-completed',
          });
        })
        .catch((error) => {
          console.error('Error completing habit:', error);
        })
    );
  } else if (action === 'snooze') {
    // Schedule another notification in 10 minutes
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration
            .showNotification(notification.title, {
              body: notification.body,
              icon: notification.icon,
              badge: notification.badge,
              vibrate: [200, 100, 200],
              tag: notification.tag,
              requireInteraction: true,
              actions: notification.actions,
              data: notification.data,
            })
            .then(resolve)
            .catch((error) => {
              console.error('Error showing snoozed notification:', error);
              resolve();
            });
        }, 10 * 60 * 1000); // 10 minutes
      })
    );
  } else {
    // Default action: open the app
    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window open
          for (const client of clientList) {
            if (client.url.includes(url) && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if none exists
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Service worker installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
