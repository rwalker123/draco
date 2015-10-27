using System;

namespace SportsManager.ViewModels.API
{
    public class WorkoutRegistrantViewModel
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public int Age { get; set; }
        public string Phone1 { get; set; }
        public string Phone2 { get; set; }
        public string Phone3 { get; set; }
        public string Phone4 { get; set; }
        public string Positions { get; set; }
        public bool WantToManage { get; set; }
        public long WorkoutId { get; set; }
        public DateTime DateRegistered { get; set; }
        public string WhereHeard { get; set; }
    }
}