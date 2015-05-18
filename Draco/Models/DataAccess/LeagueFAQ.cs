namespace SportsManager.Models.DataAccess
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("LeagueFAQ")]
    public partial class LeagueFAQ
    {
        public long id { get; set; }

        public long AccountId { get; set; }

        [Required]
        public string Question { get; set; }

        [Column(TypeName = "text")]
        [Required]
        public string Answer { get; set; }

        public virtual Account Account { get; set; }
    }
}
