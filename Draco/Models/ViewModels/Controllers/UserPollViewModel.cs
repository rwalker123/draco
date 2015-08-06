using SportsManager.Controllers;

namespace SportsManager.ViewModels
{
    public class UserPollViewModel : AccountViewModel
    {
        public UserPollViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            CanVote = this.ContactId > 0;
        }

        public bool CanVote
        {
            get;
            private set;
        }
    }
}