using SportsManager.Controllers;

namespace SportsManager.ViewModels
{
    public class PlayerSurveyViewModel : AccountViewModel
    {
        public PlayerSurveyViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            TeamSeasonId = teamSeasonId;
        }
        
        public PlayerSurveyViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
        }

        public long TeamSeasonId
        {
            get;
            set;
        }
    }
}