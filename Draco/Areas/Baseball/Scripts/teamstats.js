function initViewModel(accountId, teamSeasonId, isAdmin, isTeamAdmin) {
    initKOHelpers();

    var statsElem = document.getElementById("teamstats");
    if (statsElem) {

        ko.validation.makeBindingHandlerValidatable('editablefield');

        var teamstatsVM = new TeamStatsVM(accountId, teamSeasonId, isAdmin, isTeamAdmin);
        ko.applyBindings(teamstatsVM, statsElem);
    }
}

// track the last player modified, save occurs when you go to new
// player, change selected game, or leave page.
var lastPlayerModified = undefined;

var PlayerBatStatsVM = function (data, accountId) {

    var self = this;

    self.accountId = accountId;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        //'LastPost': {
        //    create: function (options) {
        //        if (options.data)
        //            return ko.observable(new MessagePostViewModel(options.data, self.userId, self.isAdmin));
        //        else
        //            return ko.observable();
        //    }
            //    update: function (options) {
            //        return options.data;
            //    }
        //}
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.TB.dynamicVal = ko.computed(function () {
        var numSingles = Math.max(0, +self.H() - (+self.D() + +self.T() + +self.HR()));
        
        return numSingles + (+self.D() * 2) + (+self.T() * 3) + (+self.HR() * 4);
    });
    
    self.PA.dynamicVal = ko.computed(function () {
        return (+self.AB() + +self.BB() + +self.HBP() + +self.INTR() + +self.SH() + +self.SF());
    });

    self.AVG.dynamicVal = ko.computed(function () {
        if (+self.AB() <= 0)
            return ".000";

        return (+self.H() / +self.AB()).toFixed(3).replace(/^0+/, '');
    });

    self.OBA.dynamicVal = ko.computed(function () {
        if ((+self.AB() + +self.BB() + +self.HBP()) <= 0)
            return ".000";

        return ((+self.H() + +self.BB() + +self.HBP()) / (+self.AB() + +self.BB() + +self.HBP())).toFixed(3).replace(/^0+/, '');
    });

    self.SLG.dynamicVal = ko.computed(function () {
        if (+self.AB() <= 0)
            return ".000";

        return (+self.TB() / +self.AB()).toFixed(3);
    });

    self.OPS.dynamicVal = ko.computed(function () {
        return (+self.SLG.dynamicVal() + +self.OBA.dynamicVal()).toFixed(3);
    });

    self.firstChange = true;

    // track changes so we know what to save.
    self.hasChanged = ko.computed(function () {

        ko.toJS(self);

        if (self.firstChange) {
            self.firstChange = false;
            return;
        }

        if (self !== lastPlayerModified) {
            if (lastPlayerModified)
                lastPlayerModified.saveChanges();

            lastPlayerModified = self;
        }
    });

    self.saveChanges = function () {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.TeamId() + '/game/' + self.GameId() + '/gameplayerbatstats/' + self.PlayerId();

        var data = self.toJS();

        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function (stats) {
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var PlayerPitchStatsVM = function () {

    var self = this;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        //'LastPost': {
        //    create: function (options) {
        //        if (options.data)
        //            return ko.observable(new MessagePostViewModel(options.data, self.userId, self.isAdmin));
        //        else
        //            return ko.observable();
        //    }
        //    update: function (options) {
        //        return options.data;
        //    }
        //}
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.saveChanges = function () {
        alert("Saving: " + self.Id());
    }

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var TeamStatsVM = function (accountId, teamSeasonId, isAdmin, isTeamAdmin) {
    var self = this;
    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.isTeamAdmin = isTeamAdmin;
    self.teamSeasonId = teamSeasonId;

    self.selectedGame = ko.observable();
    self.selectedGame.subscribe(function () {
        if (lastPlayerModified) {
            lastPlayerModified.saveChanges();
            lastPlayerModified = undefined;
        }

        self.getAvailableBatPlayers();
        self.getPlayersBatStats();
    });

    self.availablePlayers = ko.observableArray();
    self.playerBatStats = ko.observableArray();

    self.addPlayerToBatStats = function (player) {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/game/' + self.selectedGame() + '/gameplayerbatstats/' + player.Id;

        $.ajax({
            type: "POST",
            url: url,
            success: function (stats) {
                var playerBatStats = new PlayerBatStatsVM(stats, self.accountId);

                self.playerBatStats.push(playerBatStats);
                self.availablePlayers.remove(player);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.getAvailableBatPlayers = function () {

        self.availablePlayers.removeAll();

        if (self.selectedGame() <= 0)
            return;

        if (self.isAdmin || self.isTeamAdmin) {
            var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/nobatstats/' + self.selectedGame();

            $.ajax({
                type: "GET",
                url: url,
                success: function (players) {
                    var mapPlayers = $.map(players, function (player) {
                        return {
                            Id: player.Id,
                            PhotoUrl: player.PhotoURL,
                            Name: player.LastName + ", " + player.FirstName +  ((player.MiddleName) ? " " + player.MiddleName : "")
                        };
                    });

                    self.availablePlayers(mapPlayers);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
                }
            });
        }
    }

    self.getPlayersBatStats = function () {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/gamebatstats';
        
        if (self.selectedGame() > 0) {
            url = url + '/' + self.selectedGame();
        }

        $.ajax({
            type: "GET",
            url: url,
            success: function (stats) {

                var playerStats = $.map(stats, function (stat) {
                    return new PlayerBatStatsVM(stat, self.accountId);
                });

                self.playerBatStats(playerStats);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    if (self.isAdmin || self.isTeamAdmin) {
        $('#statsTable').editableTableWidget();
    }
}

