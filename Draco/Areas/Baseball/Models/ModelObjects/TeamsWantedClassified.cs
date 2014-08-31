using System;

namespace ModelObjects
{
    public class TeamsWantedClassified
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        public DateTime DateCreated { get; set; }
        public String Name { get; set; }
        public String EMail { get; set; }
        public String Phone { get; set; }
        public String Experience { get; set; }
        public String PositionsPlayed { get; set; }
        public DateTime BirthDate { get; set; }
        public bool CanEdit { get; set; }
    }
}