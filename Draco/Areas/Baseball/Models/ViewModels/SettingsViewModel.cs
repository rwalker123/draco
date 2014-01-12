using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class SettingsViewModel : AccountViewModel
    {
        public SettingsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }

    }
}