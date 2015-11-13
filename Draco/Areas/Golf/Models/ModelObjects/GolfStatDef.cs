using System.Collections.Generic;

namespace SportsManager.Golf.Models
{
    public class GolfStatDef
    {
        public long Id { get; set; } // Id (Primary key)
        public string Name { get; set; } // Name
        public string ShortName { get; set; } // ShortName
        public int DataType { get; set; } // DataType
        public bool IsCalculated { get; set; } // IsCalculated
        public bool IsPerHoleValue { get; set; } // IsPerHoleValue
        public string FormulaCode { get; set; } // FormulaCode
        public string ValidationCode { get; set; } // ValidationCode
        public string ListValues { get; set; } // ListValues

        // Reverse navigation
        public virtual ICollection<GolferStatsConfiguration> GolferStatsConfigurations { get; set; } // GolferStatsConfiguration.FK_GolferStatsConfiguration_GolfStatDef

        public GolfStatDef()
        {
            GolferStatsConfigurations = new List<GolferStatsConfiguration>();
        }
    }
}