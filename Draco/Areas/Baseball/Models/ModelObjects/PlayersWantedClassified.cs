using System;

namespace ModelObjects
{
    public class PlayersWantedClassified
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        public DateTime DateCreated { get; set; }
        public long CreatedByContactId { get; set; }
        public String EMail { get; set; }
        public String Phone { get; set; }
        public String CreatedByName { get; set; }
        public String CreatedByPhotoUrl { get; set; }
        public String TeamEventName { get; set; }
        public String Description { get; set; }
        public String PositionsNeeded { get; set; }
    }
}