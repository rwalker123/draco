using System;
using System.Collections.Generic;
using System.Text;

namespace SportsManager.ViewModels
{
    public class DiscussionsViewModel
    {
        public long AccountId { get; private set; }
        public List<ModelObjects.MessageCategory> Categories { get; private set; }

        public DiscussionsViewModel(long accountId)
        {
            AccountId = accountId;
            Categories = DataAccess.MessageBoard.GetCategoriesWithDetails(AccountId);


            ModelObjects.Contact contact = DataAccess.Contacts.GetContact(Globals.GetCurrentUserId());
            if (contact != null)
            {
                Categories.AddRange(DataAccess.MessageBoard.GetContactTeamCategoriesWithDetails(accountId, contact));
                Categories.AddRange(DataAccess.MessageBoard.GetContactGlobalCategoriesWithDetails(accountId, contact));
            }
        }

        public string LastPostTime(ModelObjects.MessagePost lastPost)
        {
            bool addBold = false;
            System.Text.StringBuilder postTime = new StringBuilder();

            DateTime today = DateTime.Today;

            if (today.Month == lastPost.CreateDate.Month &&
                 today.Day == lastPost.CreateDate.Day &&
                 today.Year == lastPost.CreateDate.Year)
            {
                postTime.Append("<b>today, ");
                addBold = true;
            }
            else
            {
                postTime.Append(lastPost.CreateDate.ToString("d"));
                postTime.Append(" ");
            }

            postTime.Append(lastPost.CreateDate.ToShortTimeString());
            if (addBold)
                postTime.Append("</b>");

            return postTime.ToString();
        }
    }
}