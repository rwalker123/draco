using ModelObjects;
using System;

namespace SportsManager.Golf.Models
{
    public class GolfLeagueSetup
    {
        public long Id { get; set; } // Id (Primary key)
        public long AccountId { get; set; } // AccountId
        public long PresidentId { get; set; } // PresidentId
        public long VicePresidentId { get; set; } // VicePresidentId
        public long SecretaryId { get; set; } // SecretaryId
        public long TreasurerId { get; set; } // TreasurerId
        public int LeagueDay { get; set; } // LeagueDay
        public DateTime FirstTeeTime { get; set; } // FirstTeeTime
        public int TimeBetweenTeeTimes { get; set; } // TimeBetweenTeeTimes
        public int HolesPerMatch { get; set; } // HolesPerMatch
        public int TeeOffFormat { get; set; } // TeeOffFormat
        public int IndNetPerHolePts { get; set; } // IndNetPerHolePts
        public int IndNetPerNinePts { get; set; } // IndNetPerNinePts
        public int IndNetPerMatchPts { get; set; } // IndNetPerMatchPts
        public int IndNetTotalHolesPts { get; set; } // IndNetTotalHolesPts
        public int IndNetAgainstFieldPts { get; set; } // IndNetAgainstFieldPts
        public int IndNetAgainstFieldDescPts { get; set; } // IndNetAgainstFieldDescPts
        public int IndActPerHolePts { get; set; } // IndActPerHolePts
        public int IndActPerNinePts { get; set; } // IndActPerNinePts
        public int IndActPerMatchPts { get; set; } // IndActPerMatchPts
        public int IndActTotalHolesPts { get; set; } // IndActTotalHolesPts
        public int IndActAgainstFieldPts { get; set; } // IndActAgainstFieldPts
        public int IndActAgainstFieldDescPts { get; set; } // IndActAgainstFieldDescPts
        public int TeamNetPerHolePts { get; set; } // TeamNetPerHolePts
        public int TeamNetPerNinePts { get; set; } // TeamNetPerNinePts
        public int TeamNetPerMatchPts { get; set; } // TeamNetPerMatchPts
        public int TeamNetTotalHolesPts { get; set; } // TeamNetTotalHolesPts
        public int TeamNetAgainstFieldPts { get; set; } // TeamNetAgainstFieldPts
        public int TeamActPerHolePts { get; set; } // TeamActPerHolePts
        public int TeamActPerNinePts { get; set; } // TeamActPerNinePts
        public int TeamActPerMatchPts { get; set; } // TeamActPerMatchPts
        public int TeamActTotalHolesPts { get; set; } // TeamActTotalHolesPts
        public int TeamActAgainstFieldPts { get; set; } // TeamActAgainstFieldPts
        public int TeamAgainstFieldDescPts { get; set; } // TeamAgainstFieldDescPts
        public int TeamNetBestBallPerHolePts { get; set; } // TeamNetBestBallPerHolePts
        public int TeamActBestBallPerHolePts { get; set; } // TeamActBestBallPerHolePts
        public bool UseTeamScoring { get; set; } // UseTeamScoring
        public bool UseIndividualScoring { get; set; } // UseIndividualScoring

        // Foreign keys
        public virtual Account Account { get; set; } // FK_GolfLeagueSetup_Accounts
        public virtual Contact Contact_PresidentId { get; set; } // FK_GolfLeagueSetup_Contacts
        public virtual Contact Contact_SecretaryId { get; set; } // FK_GolfLeagueSetup_Contacts2
        public virtual Contact Contact_TreasurerId { get; set; } // FK_GolfLeagueSetup_Contacts3
        public virtual Contact Contact_VicePresidentId { get; set; } // FK_GolfLeagueSetup_Contacts1
    }
}