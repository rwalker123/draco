using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class LeagueCreateAccountViewModel
    {
        public LeagueCreateAccountViewModel()
        {
            List<SelectListItem> timeZones = new List<SelectListItem>();

            foreach (var s in System.TimeZoneInfo.GetSystemTimeZones())
                timeZones.Add(new SelectListItem() { Text = s.DisplayName, Value = s.Id });

            TimeZones = timeZones;
        }

        public IEnumerable<SelectListItem> TimeZones
        {
            get;
            private set;
        }

        [DisplayName("League Name"), Required, StringLength(75)]
        public string LeagueName { get; set; }
        //[DataType(DataType.Url), Url]
        public string URL { get; set; }
        [UIHint("TimeZoneDropDown")]
        public string TimeZone { get; set; }
    }
}