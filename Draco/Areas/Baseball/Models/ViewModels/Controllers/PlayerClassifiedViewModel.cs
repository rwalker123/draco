using SportsManager.Controllers;
using SportsManager.ViewModels;
using System.Configuration;

namespace SportsManager.Baseball.ViewModels
{
    public class PlayerClassifiedViewModel : AccountViewModel
    {
        public enum IdType { ContactId, RosterSeasonId, RosterId };

        public PlayerClassifiedViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            var configDaysToKeep = ConfigurationManager.AppSettings["DaysToKeepPlayerClassified"];
            int daysToKeep = 30;
            int.TryParse(configDaysToKeep, out daysToKeep);
            DaysToKeep = daysToKeep;
        }

        public int DaysToKeep { get; private set; }
    }
}