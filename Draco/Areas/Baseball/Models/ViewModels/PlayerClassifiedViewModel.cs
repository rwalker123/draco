using SportsManager.ViewModels;
using System.Configuration;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class PlayerClassifiedViewModel : AccountViewModel
    {
        public enum IdType { ContactId, RosterSeasonId, RosterId };

        public PlayerClassifiedViewModel(Controller c, long accountId)
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