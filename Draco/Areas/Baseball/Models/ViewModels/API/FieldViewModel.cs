using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
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
        [Required]
        [StringLength(255)]
        public string Comment { get; set; }
        [Required]
        [StringLength(255)]
        public string Address { get; set; }
        [Required]
        [StringLength(25)]
        public string City { get; set; }
        [Required]
        [StringLength(25)]
        public string State { get; set; }
        [Required]
        [StringLength(10)]
        public string ZipCode { get; set; }
        [Required]
        [StringLength(255)]
        public string Directions { get; set; }
        [Required]
        [StringLength(15)]
        public string RainoutNumber { get; set; }
        [Required]
        [StringLength(25)]
        public string Latitude { get; set; }
        [Required]
        [StringLength(25)]
        public string Longitude { get; set; }
        //public DbGeography LocationGeo { get; set; }
    }
}