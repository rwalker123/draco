using System;
using System.Linq;
using System.Collections.Generic;

using SportsManager;
using SportsManager.Model;

namespace DataAccess.Golf
{
    /// <summary>
    /// Summary description for GolferStats
    /// </summary>
    public static class GolferStats
    {
        public static IEnumerable<GolfStatDef> GetGolferStatisticDefs()
        {
            DB db = DBConnection.GetContext();

            return (from gs in db.GolfStatDefs
                    select gs);
        }

        public static long AddGolfStat(GolfStatDef gs)
        {
            try
            {
                DB db = DBConnection.GetContext();
                
                db.GolfStatDefs.InsertOnSubmit(gs);
                db.SubmitChanges();
            }
            catch (Exception ex)
            {
                Globals.LogException(ex);
            }

            return gs.id;
        }

        public static bool ModifyGolfStat(GolfStatDef gs)
        {
            try
            {
                DB db = DBConnection.GetContext();

                GolfStatDef cur = (from gsd in db.GolfStatDefs
                                   where gsd.id == gs.id
                                   select gsd).FirstOrDefault();

                cur.Name = gs.Name;
                cur.ShortName = gs.ShortName;

                cur.DataType = gs.DataType;
                cur.FormulaCode = gs.FormulaCode;
                cur.IsCalculated = gs.IsCalculated;
                cur.IsPerHoleValue = gs.IsPerHoleValue;
                cur.ListValues = gs.ListValues;
                cur.ValidationCode = gs.ValidationCode;
                
                db.SubmitChanges();
            }
            catch (Exception ex)
            {
                Globals.LogException(ex);
            }

            return true;
        }

        public static bool DeleteGolfStat(GolfStatDef gs)
        {
            try
            {
                DB db = DBConnection.GetContext();

                db.GolfStatDefs.DeleteOnSubmit(
                    (from gsd in db.GolfStatDefs
                    where gsd.id == gs.id
                    select gsd).FirstOrDefault()
                    );
                db.SubmitChanges();
            }
            catch (Exception ex)
            {
                Globals.LogException(ex);
            }

            return true;
        }

        public static IEnumerable<GolfStatDef> GetGolferAssociatedStatDefs(long contactId)
        {
            DB db = DBConnection.GetContext();

            return (from gsc in db.GolferStatsConfigurations
                    join gsd in db.GolfStatDefs on gsc.StatId equals gsd.id
                    into j1
                    from gsc_gsd in j1
                    where gsc.ContactId == contactId
                    select gsc_gsd);
        }

        public static IEnumerable<GolfStatDef> GetGolferNotAssociatedStatDefs(long contactId)
        {
            DB db = DBConnection.GetContext();

            return (from gsd in db.GolfStatDefs
                    select gsd).Except(from gsc in db.GolferStatsConfigurations
                                       join gsd in db.GolfStatDefs on gsc.StatId equals gsd.id
                                       into j1
                                       from gsc_gsd in j1
                                       where gsc.ContactId == contactId
                                       select gsc_gsd);
        }

        public static long AddGolferStatAssociation(long contactId, long statId)
        {
            long newId = 0;

            try
            {
                DB db = DBConnection.GetContext();

                int recCount = (from gsc in db.GolferStatsConfigurations
                                where gsc.ContactId == contactId && gsc.StatId == statId
                                select gsc.id).Count();

                if (recCount == 0)
                {
                    GolferStatsConfiguration newConfig = new GolferStatsConfiguration();
                    newConfig.ContactId = (int)contactId;
                    newConfig.StatId = statId;

                    db.GolferStatsConfigurations.InsertOnSubmit(newConfig);

                    db.SubmitChanges();

                    newId = newConfig.id;
                }
            }
            catch (Exception ex)
            {
                Globals.LogException(ex);
            }

            return newId;
        }

        public static void RemoveGolferStatAssociation(long contactId, long statId)
        {
            DB db = DBConnection.GetContext();

            var gscs = (from gsc in db.GolferStatsConfigurations
                        where gsc.ContactId == contactId && gsc.StatId == statId
                        select gsc);

            if (gscs != null)
            {
                db.GolferStatsConfigurations.DeleteAllOnSubmit(gscs);

                db.SubmitChanges();
            }
        }
    }
}
