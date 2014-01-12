using System;
using System.Globalization;


// SimpleTimeZone
// by Michael R. Brumm
//
// For updates and more information, visit:
// http://www.michaelbrumm.com/simpletimezone.html
//
// or contact me@michaelbrumm.com
//
// Please do not modify this code and re-release it. If you
// require changes to this class, please derive your own class
// from SimpleTimeZone, and add (or override) the methods and
// properties on your own derived class. You never know when 
// your code might need to be version compatible with another
// class that uses SimpleTimeZone.
namespace Globalization
{

    public class DaylightTimeChange
    {

        private const int NUM_DAYS_IN_WEEK = 7;

        private int m_month;
        private DayOfWeek m_dayOfWeek;
        private int m_dayOfWeekIndex;
        private TimeSpan m_timeOfDay;

        // Constructor allows the definition of a time change
        // for most time zones using daylight saving time. These
        // time zones often define the start or end of daylight
        // saving as "the first Sunday of April, at 2:00am". This
        // would be constructed as:
        //
        // New DaylightTimeChange( _
        //   4, _                      // 4th month: April
        //   DayOfWeek.Sunday, 0, _    // 1st Sunday
        //   New TimeSpan(2, 0, 0) _   // at 2:00am
        // )
        //
        // "The last Sunday of October, at 2:00am" would be
        // constructed as:
        //
        // New DaylightTimeChange( _
        //   10, _                     // 10th month: October
        //   DayOfWeek.Sunday, 4, _    // 5th (last) Sunday
        //   New TimeSpan(2, 0, 0) _   // at 2:00am
        // )
        //
        public DaylightTimeChange(
          int month,
          DayOfWeek dayOfWeek,
          int dayOfWeekIndex,
          TimeSpan timeOfDay )
        {
            // Parameter checking
            if (month < 1 || month > 12) 
                throw new ArgumentOutOfRangeException("month", month, "The month must be between 1 and 12, inclusive.");

            if ( dayOfWeek < DayOfWeek.Sunday ||
                 dayOfWeek > DayOfWeek.Saturday)
                throw new ArgumentOutOfRangeException("dayOfWeek", dayOfWeek, "The day of week must be between Sunday and Saturday.");

            // 0 = 1st
            // 1 = 2nd
            // 2 = 3rd
            // 3 = 4th
            // 4 = 5th (last)
            if (dayOfWeekIndex < 0 || dayOfWeekIndex > 4)
                throw new ArgumentOutOfRangeException("dayOfWeekIndex", dayOfWeekIndex, "The day of week index must be between 0 and 4, inclusive.");

            if ( timeOfDay.Ticks < 0 || timeOfDay.Ticks >= TimeSpan.TicksPerDay) 
                throw new ArgumentOutOfRangeException("timeOfDay", timeOfDay, "The time of the day must be less than one day, and not negative.");

            // Initialize private storage
            m_month = month;
            m_dayOfWeek = dayOfWeek;
            m_dayOfWeekIndex = dayOfWeekIndex;
            m_timeOfDay = timeOfDay;
        }
        

        // Returns the time and date of the daylight saving change
        // for a particular year. For example:
        //   "the 1st Sunday of April at 2:00am" for the year "2000"
        //   is "2000/04/02 02:00"
        public DateTime GetDate( int year )
        {
            if (year < 1 || year > DateTime.MaxValue.Year)
                throw new ArgumentOutOfRangeException("year");

            // Get the first day of the change month for the specified year.
            DateTime resultDate = new DateTime(year, m_month, 1);

            // Get the first day of the month that falls on the
            // day of the week for this change.
            if (resultDate.DayOfWeek > m_dayOfWeek) 
                resultDate = resultDate.AddDays(NUM_DAYS_IN_WEEK - (resultDate.DayOfWeek - m_dayOfWeek));
            else if (resultDate.DayOfWeek < m_dayOfWeek)
                resultDate = resultDate.AddDays(m_dayOfWeek - resultDate.DayOfWeek);
            
            // Get the nth weekday (3rd Tuesday, for example)
            resultDate = resultDate.AddDays(NUM_DAYS_IN_WEEK * m_dayOfWeekIndex);

            // If the date has passed the month, then go back a week. This allows
            // the 5th weekday to always be the last weekday.
            while (resultDate.Month > m_month)
                resultDate = resultDate.AddDays(-NUM_DAYS_IN_WEEK);

            // Add the time of day that daylight saving begins.
            resultDate = resultDate.Add(m_timeOfDay);

            // Return the date and time of the change.
            return resultDate;
        }
    }

    public class SimpleTimeZone : TimeZone
    {

        private bool m_standardAlways;

        private TimeSpan m_standardOffset;
        private string m_standardName;
        private string m_standardAbbreviation;

        private TimeSpan m_daylightDelta;
        private TimeSpan m_daylightOffset;
        private string m_daylightName;
        private string m_daylightAbbreviation;
        private DaylightTimeChange m_daylightTimeChangeStart;
        private DaylightTimeChange m_daylightTimeChangeEnd;


        // Constructor for time zone without daylight saving time.
        public SimpleTimeZone( TimeSpan standardOffset, string standardName, string standardAbbreviation)
        {
            // Initialize private storage
            m_standardAlways = true;

            m_standardOffset = standardOffset;
            m_standardName = standardName;
            m_standardAbbreviation = standardAbbreviation;
        }

        // Constructor for time zone with or without daylight saving time.
        public SimpleTimeZone( TimeSpan standardOffset, string standardName,
                string standardAbbreviation, TimeSpan daylightDelta,
                string daylightName, string daylightAbbreviation,
                DaylightTimeChange daylightTimeChangeStart, 
                DaylightTimeChange daylightTimeChangeEnd)
        {
            // Allow non-daylight saving time zones to be created
            // using this constructor.
            if ( daylightTimeChangeStart == null && daylightTimeChangeEnd == null )
            {
                // Initialize private storage
                m_standardAlways = true;

                m_standardOffset = standardOffset;
                m_standardName = standardName;
                m_standardAbbreviation = standardAbbreviation;
                return;
            }

            // If the time zone has a start OR an end, then it
            // must have a start AND an end.
            if (daylightTimeChangeStart == null)
                throw new ArgumentNullException("daylightTimeChangeStart");

            if (daylightTimeChangeEnd == null)
                throw new ArgumentNullException("daylightTimeChangeEnd");

            // Initialize private storage
            m_standardAlways = false;

            m_standardOffset = standardOffset;
            m_standardName = standardName;
            m_standardAbbreviation = standardAbbreviation;
            
            m_daylightDelta = daylightDelta;
            m_daylightOffset = m_standardOffset.Add(daylightDelta);
            m_daylightName = daylightName;
            m_daylightAbbreviation = daylightAbbreviation;

            // These referance types are immutable, so they cannot be
            // changed outside this class' scope, and thus can be
            // permanently referenced.
            m_daylightTimeChangeStart = daylightTimeChangeStart;
            m_daylightTimeChangeEnd = daylightTimeChangeEnd;
        }

        public override string StandardName
        {
            get { return m_standardName; }
        }

        public virtual string StandardAbbreviation
        {
            get { return m_standardAbbreviation; }
        }

        public override string DaylightName
        {
            get { return m_daylightName; }
        }

        public virtual string DaylightAbbreviation
        {
            get { return m_daylightAbbreviation; }
        }

        // The name is dependant on whether the time zone is in daylight
        // saving time or not. This method can be ambiguous during
        // daylight changes.
        public virtual string GetNameLocalTime( DateTime time )
        {
            if (m_standardAlways) 
                return m_standardName;
            else if (IsDaylightSavingTime(time))
                return m_daylightName;
            else
                return m_standardName;
        }

        // This method is unambiguous during daylight changes.
        public virtual string GetNameUniversalTime( DateTime time )
        {
            if (IsDaylightSavingTimeUniversalTime(time))
                return m_daylightName;
            else
                return m_standardName;
        }

        // The abbreviation is dependant on whether the time zone is in
        // daylight saving time or not. This method can be ambiguous during
        // daylight changes.
        public virtual string GetAbbreviationLocalTime( DateTime time )
        {
            if (m_standardAlways) 
                return m_standardAbbreviation;
            else if (IsDaylightSavingTime(time)) 
                return m_daylightAbbreviation;
            else
                return m_standardAbbreviation;
        }

        // This method is unambiguous during daylight changes.
        public virtual string GetAbbreviationUniversalTime( DateTime time )
        {
            if (IsDaylightSavingTimeUniversalTime(time)) 
                return m_daylightAbbreviation;
            else
                return m_standardAbbreviation;
        }

        public override DaylightTime GetDaylightChanges( int year )
        {
            if (year < 1 || year > DateTime.MaxValue.Year)
                throw new ArgumentOutOfRangeException("year");

            if (m_standardAlways) 
            {
                return null;
            }
            else
            {
                return new DaylightTime( m_daylightTimeChangeStart.GetDate(year), 
                                         m_daylightTimeChangeEnd.GetDate(year),
                                         m_daylightDelta );
            }
        }
        
        // This method can be ambiguous during daylight changes.
        public override bool IsDaylightSavingTime( DateTime time )
        {
            return IsDaylightSavingTime(time, false);
        }

        // This method is unambiguous during daylight changes.
        public virtual bool IsDaylightSavingTimeUniversalTime( DateTime time )
        {
            time = time.Add(m_standardOffset);
            return IsDaylightSavingTime(time, true);
        }

        private bool IsDaylightSavingTime( DateTime time, bool fromUtcTime )
        {
            // If this time zone is never in daylight saving, then
            // return false.
            if (m_standardAlways) 
                return false;

            // Get the daylight saving time start and end for this
            // time's year.
            DaylightTime daylightTimes = GetDaylightChanges(time.Year);

            // Return whether the time is within the daylight saving
            // time for this year.
            return IsDaylightSavingTime(time, daylightTimes, fromUtcTime);
        }

        public new bool IsDaylightSavingTime( DateTime time, DaylightTime daylightTimes )
        {
            return IsDaylightSavingTime(time, daylightTimes, false);
        }

        private bool IsDaylightSavingTime( DateTime time, DaylightTime daylightTimes, bool fromUtcTime )
        {
            // Mirrors .NET Framework TimeZone functionality, which 
            // does not throw an exception.
            if (daylightTimes == null)
                return false;

            DateTime daylightStart  = daylightTimes.Start;
            DateTime daylightEnd = daylightTimes.End;
            TimeSpan daylightDelta = daylightTimes.Delta;

            // If the time came from a utc time, then the delta must be
            // removed from the end time, because the end of daylight
            // saving time is described using using a local time (which
            // is currently in daylight saving time).
            if (fromUtcTime)
                daylightEnd = daylightEnd.Subtract(daylightDelta);

            // Northern hemisphere (normally)
            // The daylight saving time of the year falls between the
            // start and the end dates.
            if (daylightStart < daylightEnd)
            {
                // The daylight saving time of the year falls between the
                // start and the end dates.
                if ( time >= daylightStart && time < daylightEnd )
                {
                    // If the time was taken from a UTC time, then do not apply
                    // the backward compatibility.
                    if (fromUtcTime) 
                    {
                        return true;
                    }
                    // Backward compatiblity with .NET Framework TimeZone.
                    // If the daylight saving delta is positive, then there is a
                    // period of time which does not exist (between 2am and 3am in
                    // most daylight saving time zones) at the beginning of the
                    // daylight saving. This period of non-existant time should be 
                    // considered standard time (not daylight saving).
                    else
                    {
                        if (daylightDelta.Ticks > 0)
                        {
                            if (time < (daylightStart.Add(daylightDelta)))
                                return false;
                            else
                                return true;
                        }   
                        else
                        {
                            return true;
                        }
                    }
                    
                }
                // Otherwise, the time and date is not within daylight
                // saving time.
                else
                {
                    // If the time was taken from a UTC time, then do not apply
                    // the backward compatibility.
                    if (fromUtcTime)
                    {
                        return false;
                    }
                    // Backward compatiblity with .NET Framework TimeZone.
                    // If the daylight saving delta is negative (which shouldn't
                    // happen), then there is a period of time which does not exist
                    // (between 2am and 3am in most daylight saving time zones).
                    // at the end of daylight saving. This period of
                    // non-existant time should be considered daylight saving.
                    else
                    {
                        if (daylightDelta.Ticks < 0) 
                        {
                            if ( time >= daylightEnd &&
                                 time < daylightEnd.Subtract(daylightDelta) )
                                return true;
                            else
                                return false;
                        }
                        else
                        {
                            return false;
                        }
                    }
                }
            }
            // Southern hemisphere (normally)
            // The daylight saving time of the year is after the start,
            // or before the end, but not between the two dates.
            else
            {
                // The daylight saving time of the year is after the start,
                // or before the end, but not between the two dates.
                if (time >= daylightStart)
                {
                    // If the time was taken from a UTC time, then do not apply
                    // the backward compatibility.
                    if (fromUtcTime) 
                    {
                        return true;
                    }
                    // Backward compatiblity with .NET Framework TimeZone.
                    // If the daylight saving delta is positive, then there is a
                    // period of time which does not exist (between 2am and 3am in
                    // most daylight saving time zones) at the beginning of the
                    // daylight saving. This period of non-existant time should be 
                    // considered standard time (not daylight saving).
                    else
                    {
                        if (daylightDelta.Ticks > 0)
                        {
                            if (time < (daylightStart.Add(daylightDelta))) 
                                return false;
                            else
                                return true;
                        }
                        else
                        {
                            return true;
                        }
                    }
                }
                // The current time is before the end of daylight saving, so
                // it is during daylight saving.
                else if (time < daylightEnd)
                {
                    return true;
                }
                // Otherwise, the time and date is not within daylight
                // saving time.
                else
                {
                    // If the time was taken from a UTC time, then do not apply
                    // the backward compatibility.
                    if (fromUtcTime)
                    {
                        return false;
                    }
                    // Backward compatiblity with .NET Framework TimeZone.
                    // If the daylight saving delta is negative (which shouldn't
                    // happen), then there is a period of time which does not exist
                    // (between 2am and 3am in most daylight saving time zones).
                    // at the end of daylight saving. This period of
                    // non-existant time should be considered daylight saving.
                    else
                    {
                        if (daylightDelta.Ticks < 0)
                        {
                            if ( time >= daylightEnd &&
                                 time < daylightEnd.Subtract(daylightDelta))
                                return true;
                            else
                                return false;
                        }
                        else
                        {
                            return false;
                        }
                    }
                }
            }
        }

        public virtual bool IsAmbiguous( DateTime time )
        {
            // If this time zone is never in daylight saving, then
            // return false.
            if (m_standardAlways)
                return false;

            // Get the daylight saving time start and end for this
            // time's year.
            DaylightTime daylightTimes = GetDaylightChanges(time.Year);

            // Return whether the time is within the ambiguous
            // time for this year.
            return IsAmbiguous(time, daylightTimes);
        }

        public bool IsAmbiguous( DateTime time, DaylightTime daylightTimes )
        {
            // Mirrors .NET Framework TimeZone functionality, which 
            // does not throw an exception.
            if (daylightTimes == null)
                return false;

            DateTime daylightStart = daylightTimes.Start;
            DateTime daylightEnd = daylightTimes.End;
            TimeSpan daylightDelta = daylightTimes.Delta;

            // The ambiguous time is at the end of the daylight
            // saving time when the delta is positive.
            if (daylightDelta.Ticks > 0)
            {
                if ( time < daylightEnd &&
                     daylightEnd.Subtract(daylightDelta) <= time )
                    return true;
               
            }
            // The ambiguous time is at the start of the daylight
            // saving time when the delta is negative.
            else if (daylightDelta.Ticks < 0)
            {
                if ( time < daylightStart &&
                     daylightStart.Add(daylightDelta) <= time )
                    return true;
            }
            
            return false;
        }


        public override TimeSpan GetUtcOffset( DateTime time )
        {
            // If this time zone is never in daylight saving, then
            // return the standard offset.
            if (m_standardAlways)
                return m_standardOffset;
            // If the time zone is in daylight saving, then return
            // the daylight saving offset.
            else if (IsDaylightSavingTime(time))
                return m_daylightOffset;
            // Otherwise, return the standard offset.
            else
                return m_standardOffset;
        }

        public override DateTime ToLocalTime( DateTime time )
        {
            time = time.Add(m_standardOffset);

            if (!m_standardAlways)
                if (IsDaylightSavingTime(time, true))
                    time = time.Add(m_daylightDelta);

            return time;
        }


        // This can return an incorrect time during the time change
        // between standard and daylight saving time, because
        // times near the daylight saving switch can be ambiguous.
        //
        // For example, if daylight saving ends at:
        // "2000/10/29 02:00", and fall back an hour, then is:
        // "2000/10/29 01:30", during daylight saving, or not?
        //
        // Consequently, this function is provided for backwards
        // compatiblity only, and should be deprecated and replaced
        // with the overload that allows daylight saving to be
        // specified.
        public override DateTime ToUniversalTime( DateTime time )
        {
            if (m_standardAlways)
            {
                return time.Subtract(m_standardOffset);
            }
            else
            {
                if (IsDaylightSavingTime(time)) 
                    return time.Subtract(m_daylightOffset);
                else
                    return time.Subtract(m_standardOffset);
            }
        }

        // This overload allows the status of daylight saving
        // to be specified along with the time. This conversion
        // is unambiguous and always correct.
        public DateTime ToUniversalTime( DateTime time, bool daylightSaving )
        {
            if (m_standardAlways)
            {
                return time.Subtract(m_standardOffset);
            }
            else
            {
                if (daylightSaving)
                    return time.Subtract(m_daylightOffset);
                else
                    return time.Subtract(m_standardOffset);
            }
        }
    }
}