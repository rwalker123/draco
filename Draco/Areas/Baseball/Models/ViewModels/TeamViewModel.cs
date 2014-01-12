using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ModelObjects;

namespace SportsManager.Baseball.ViewModels
{
    public class TeamViewModel
    {
        public TeamViewModel(long accountId, long id)
        {
            AccountId = accountId;
            Id = id;

            Handouts = DataAccess.TeamHandouts.GetTeamHandouts(Id, 0);
            Announcements = DataAccess.TeamNews.GetTeamAnnouncements(Id);
            Sponsors = DataAccess.Sponsors.GetTeamSponsors(id, true);
        }

        public long AccountId { get; private set; }
        public string AccountName
        {
            get
            {
                return DataAccess.Accounts.GetAccountName(AccountId);
            }
        }

        public long Id { get; private set; }

        public List<TeamHandout> Handouts { get; private set; }
        public List<LeagueNewsItem> Announcements { get; private set; }
        public List<Sponsor> Sponsors { get; private set; }

        public bool IsPhotoAdmin 
        {
            get { return IsAdmin || true; }
        }

        public bool IsAdmin 
        {
            get { return true; }
        }

        public bool IsTeamMember
        {
            get { return true; }
        }

        public bool FromLeagueAccount
        {
            get { return AccountId != 0; }
        }

        public String GetTitle()
        {
            String accountName = DataAccess.Accounts.GetAccountName(AccountId);
            String teamName = DataAccess.Teams.GetTeamName(Id);

            if (String.IsNullOrEmpty(accountName))
                return teamName;
            else
                return String.Format("{0} - {1}", accountName, teamName);
        }

    }
}