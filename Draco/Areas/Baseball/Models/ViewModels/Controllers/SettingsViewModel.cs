using SportsManager.Controllers;
using SportsManager.ViewModels;

namespace SportsManager.Baseball.ViewModels
{
    public class SettingsViewModel : AccountViewModel
    {
        public SettingsViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
        }

    }
}