using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SportsManager.Baseball.ViewModels.API
{
    public class FieldViewModel
    {
        public long Id { get; set; } 
        public long AccountId { get; set; }
        [Required]
        [StringLength(25)]
        public string Name { get; set; }
        [Required]
        [StringLength(5)]
        public string ShortName { get; set; }
        [StringLength(255)]
        public string Comment { get; set; }
        [StringLength(255)]
        public string Address { get; set; }
        [StringLength(25)]
        public string City { get; set; }
        [StringLength(25)]
        public string State { get; set; }
        [StringLength(10)]
        public string ZipCode { get; set; }
        [StringLength(255)]
        public string Directions { get; set; }
        [StringLength(15)]
        public string RainoutNumber { get; set; }
        [StringLength(25)]
        public string Latitude { get; set; }
        [StringLength(25)]
        public string Longitude { get; set; }
        //public DbGeography LocationGeo { get; set; }
    }
}