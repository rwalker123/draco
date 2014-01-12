using System;
using System.Configuration;

namespace ModelObjects
{
    public class AccountWelcome
    {
        public AccountWelcome()
        {
        }

        public AccountWelcome(long id, long accountId, short orderNo, string captionText, string accountText)
        {
            Id = id;
            AccountId = accountId;
            OrderNo = orderNo;
            CaptionText = captionText;
            WelcomeText = accountText;
        }

        public void CopyTo(SportsManager.Model.AccountWelcome dbAw)
        {
            dbAw.Id = Id;
            dbAw.AccountId = AccountId;
            dbAw.OrderNo = OrderNo;
            dbAw.CaptionMenu = CaptionText;
            dbAw.WelcomeText = String.IsNullOrEmpty(WelcomeText) ? String.Empty : WelcomeText;
        }

        public SportsManager.Model.AccountWelcome ToDBType()
        {
            SportsManager.Model.AccountWelcome dbAw = new SportsManager.Model.AccountWelcome();
            CopyTo(dbAw);

            return dbAw;

        }

        public long Id { get; set; }
        public long AccountId { get; set; }
        public short OrderNo { get; set; }
        public string CaptionText { get; set; }
        public string WelcomeText { get; set; }
    }
}