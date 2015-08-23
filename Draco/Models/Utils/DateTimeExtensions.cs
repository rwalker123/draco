using System;

namespace SportsManager.Models.Utils
{
    public static class DateTimeExtensions
    {
        static public int Age(this DateTime bday)
        {
            DateTime today = DateTime.Today;
            int age = today.Year - bday.Year;
            if (bday > today.AddYears(-age)) age--;

            return age;
        }
    }
}