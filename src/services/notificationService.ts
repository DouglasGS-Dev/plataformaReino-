
export class NotificationService {
  static async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações desktop');
      return false;
    }

    // Check if we are in an iframe
    const isIframe = window.self !== window.top;
    if (isIframe && Notification.permission === 'default') {
      console.warn('Solicitação de notificação ignorada por estar em um iframe. Abra o app em uma nova aba.');
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    try {
      // Handle both promise-based and callback-based requestPermission
      const permission = await new Promise<NotificationPermission>((resolve) => {
        const result = Notification.requestPermission(resolve);
        if (result) {
          result.then(resolve);
        }
      });
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return false;
    }
  }

  static async sendNotification(title: string, body: string) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'spiritual-reminder',
          renotify: true
        });
      } catch (e) {
        // Fallback for mobile browsers that require service workers for notifications
        console.log('Notificação simples falhou, tentando via Service Worker se disponível');
      }
    }
  }
}
