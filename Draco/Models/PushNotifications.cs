using Microsoft.Azure.NotificationHubs;

namespace SportsManager.Models
{
    public class PushNotifications
    {
        public static PushNotifications Instance = new PushNotifications();

        public NotificationHubClient Hub { get; set; }

        private PushNotifications()
        {
            Hub = NotificationHubClient.CreateClientFromConnectionString("Endpoint=sb://ezbaseballleaguehub-ns.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=nChekAUuY1I+4vNKlphSexrv2LvH8kMuHLv94tDMaG0=", 
                "ezbaseballleaguehub");
        }
    }
}