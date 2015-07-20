using System;

namespace SportsManager.ViewModels.API
{
    public class ProfileAnswersViewModel
    {
        public long Id { get; set; }
        public long PlayerId { get; set; }
        public long QuestionId { get; set; }
        public String Answer { get; set; }
        public String LastName { get; set; }
        public String FirstName { get; set; }
        public String MiddleName { get; set; }
        public String PhotoUrl { get; set; }
    }
}