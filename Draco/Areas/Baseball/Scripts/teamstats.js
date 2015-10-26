function initViewModel(accountId, teamSeasonId, isAdmin, isTeamAdmin) {
    initKOHelpers();

    var statsElem = document.getElementById("teamstats");
    if (statsElem) {

        ko.validation.makeBindingHandlerValidatable('editablefield');

        var teamstatsVM = new TeamStatsVM(accountId, teamSeasonId, isAdmin, isTeamAdmin);
        ko.applyBindings(teamstatsVM, statsElem);
        $("th").tooltip({ container: 'body' });
    }
}

var PlayerBatStatsVM = function (data, parent, accountId) {

    var self = this;

    self.accountId = accountId;
    // make a function to prevent object thinking it changed when
    // the parent changes.
    self.parent = function () {
        return parent;
    };

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

    //self.AB.extend({
    //    validation: {
    //        validator: function (val) {
    //            return false;
    //        },
    //        message: 'AB must be something.'
    //    }
    //});

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

        return (+self.TB.dynamicVal() / +self.AB()).toFixed(3);
    });

    self.OPS.dynamicVal = ko.computed(function () {
        return (+self.SLG.dynamicVal() + +self.OBA.dynamicVal()).toFixed(3);
    });

    self.PlayerName.LastName = ko.computed(function () {
        if (self.PlayerName()) {
            var n = self.PlayerName().split(',');
            return n[0] + ', ' + n[1].charAt(1) + '.';
        }

        return '';
    });

    self.firstChange = true;

    // track changes so we know what to save.
    self.hasChanged = ko.computed(function () {

        ko.toJS(self);

        if (self.firstChange) {
            self.firstChange = false;
            return;
        }

        self.saveChanges();
    });

    self.saveChanges = function (asSync) {

        if (self.TeamId() == 0 || self.GameId() == 0 || self.PlayerId() == 0)
            return;

        if (+self.AB() < (+self.H() + +self.SO() + +self.RE())) {
            alert(self.PlayerName() + ": At bats must be greater than or equal to hits + strikeouts + safe of error");
            return;
        }

        if (+self.H() < (+self.D() + +self.T() + +self.HR())) {
            alert(self.PlayerName() + ": Hits must be greater than or equal to doubles + triples + home runs");
            return;
        }

        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.TeamId() + '/game/' + self.GameId() + '/gameplayerbatstats/' + self.PlayerId();

        var data = self.toJS();

        var asyncCall = !asSync;

        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            async: asyncCall,
            success: function (stats) {
                self.parent().getBatStatsTotals();

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

var PlayerPitchStatsVM = function (data, parent, accountId) {

    var self = this;

    self.accountId = accountId;
    // make a function to prevent object thinking it changed when
    // the parent changes.
    self.parent = function () {
        return parent;
    };

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

    self.IPDecimal.calculateIP = function () {
        var ipDecimal = +self.IPDecimal();
        var wholeIP = Math.floor(ipDecimal);
        var decimalPart = Math.round(((ipDecimal % 1.0) + .0000001) * 10);

        return wholeIP + (decimalPart / 3.0);
    };

    self.K9.dynamicVal = ko.computed(function () {
        if (+self.IPDecimal() <= 0)
            return "0.0";

        var ip = self.IPDecimal.calculateIP();
        var k9 = +self.SO() / ip * 9.0;
        return (Math.floor(10 * k9) / 10).toFixed(1);
    });

    self.BB9.dynamicVal = ko.computed(function () {
        if (+self.IPDecimal() <= 0)
            return "0.0";

        var ip = self.IPDecimal.calculateIP();
        var bb9 = +self.BB() / ip * 9.0;
        return (Math.floor(10 * bb9) / 10).toFixed(1);
    });

    self.OBA.dynamicVal = ko.computed(function () {
        if (+self.AB() <= 0)
            return ".000";

        return (self.H() / self.AB()).toFixed(3).replace(/^0+/, '');
    });

    self.SLG.dynamicVal = ko.computed(function () {
        if (+self.AB() <= 0)
            return ".000";

        var TB = (self.D() * 2) + (self.T() * 3) + (self.HR() * 4) + (self.H() - self.D() - self.T() - self.HR());
        return (self.TB() / self.AB()).toFixed(3);
    });

    self.WHIP.dynamicVal = ko.computed(function () {
        if (+self.IPDecimal() <= 0)
            return "0.00";

        var ip = self.IPDecimal.calculateIP();
        return ((+self.H() + +self.BB()) / ip).toFixed(2);
    });

    self.ERA.dynamicVal = ko.computed(function () {
        if (+self.IPDecimal() <= 0)
            return "0.00";

        var ip = self.IPDecimal.calculateIP();
        return ((+self.ER() * 9) / ip).toFixed(2);
    });

    self.PlayerName.LastName = ko.computed(function () {
        if (self.PlayerName()) {
            var n = self.PlayerName().split(',');
            return n[0] + ', ' + n[1].charAt(1) + '.';
        }

        return '';
    });

    self.firstChange = true;

    // track changes so we know what to save.
    self.hasChanged = ko.computed(function () {

        ko.toJS(self);

        if (self.firstChange) {
            self.firstChange = false;
            return;
        }

        self.saveChanges();

        //if (self !== lastPitchPlayerModified) {
        //    if (self.TeamId() == 0 || self.GameId() == 0 || self.PlayerId() == 0)
        //        return;

        //    if (lastPitchPlayerModified)
        //        lastPitchPlayerModified.saveChanges();

        //    lastPitchPlayerModified = self;
        //}
    });

    self.saveChanges = function (asSync) {

        if (self.TeamId() == 0 || self.GameId() == 0 || self.PlayerId() == 0)
            return;

        if (+self.BF() < (+self.H() + +self.BB() + +self.HBP() + +self.SO())) {
            alert(self.PlayerName() + ": Batters faced must be greater than or equal to hits + walks + hit by pitch + strikeouts");
            return;
        }

        if (+self.ER() > +self.R()) {
            alert(self.PlayerName() + ": Earned runs must be less than or equal to runs");
            return;
        }

        if (+self.H() < (+self.D() + +self.T() + +self.HR())) {
            alert(self.PlayerName() + ": Hits must be greater than or equal to doubles + triples + home runs");
            return;
        }

        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.TeamId() + '/game/' + self.GameId() + '/gameplayerpitchstats/' + self.PlayerId();

        var data = self.toJS();

        var IPParts = (data.IPDecimal + '').split(".");

        data.IP = IPParts[0] | 0;
        data.IP2 = IPParts[1] | 0;

        var asyncCall = !asSync;

        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            async: asyncCall,
            success: function (stats) {
                self.parent().getPitchStatsTotals();
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

var TeamStatsVM = function (accountId, teamSeasonId, isAdmin, isTeamAdmin) {
    var self = this;
    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.isTeamAdmin = isTeamAdmin;
    self.teamSeasonId = teamSeasonId;

    self.gameSummary = ko.observable();
    self.initialGameSummary = '';

    self.editGameSummaryMode = ko.observable(false);
    self.enterEditGameSummary = function () {
        self.initialGameSummary = self.gameSummary();
        self.editGameSummaryMode(true);
    }
    self.cancelEditGameSummary = function () {
        self.gameSummary(self.initialGameSummary);
        self.editGameSummaryMode(false);
    }

    self.saveGameSummary = function (gameText) {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/gamesummary/' + self.selectedGame();

        var gameId = self.selectedGame();

        $.ajax({
            type: "POST",
            url: url,
            data: {
                GameId: gameId,
                TeamId: self.teamSeasonId,
                Recap: self.gameSummary()
            },
            success: function (stats) {
                self.editGameSummaryMode(false);
            }
        });
    }

    self.selectedGame = ko.observable();
    self.selectedGame.subscribe(function () {

        if (self.selectedGame() == 0)
        {
            $('#statsTab a:first').tab('show');
        }
        self.getPlayersBatStats();
        self.getPlayersPitchStats();
        self.getGameSummary();

        self.getAvailableBatPlayers();
        self.getAvailablePitchPlayers();

    });

    self.availableBatPlayers = ko.observableArray();
    self.playerBatStats = ko.observableArray();
    self.batStatsTotals = ko.observable();
    self.isBatLoading = ko.observable(false);
    self.isPitchLoading = ko.observable(false);

    self.addPlayerToBatStats = function (player) {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/game/' + self.selectedGame() + '/gameplayerbatstats/' + player.Id;

        $.ajax({
            type: "POST",
            url: url,
            success: function (stats) {
                var playerBatStats = new PlayerBatStatsVM(stats, self, self.accountId);

                self.playerBatStats.push(playerBatStats);
                self.availableBatPlayers.remove(player);
            }
        });
    }

    self.getAvailableBatPlayers = function () {

        self.availableBatPlayers.removeAll();

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

                    self.availableBatPlayers(mapPlayers);
                }
            });
        }
    }

    self.getPlayersBatStats = function () {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/gamebatstats';
        
        if (self.selectedGame() > 0) {
            url = url + '/' + self.selectedGame();
        }

        self.isBatLoading(true);

        $.ajax({
            type: "GET",
            url: url,
            success: function (stats) {

                var playerStats = $.map(stats, function (stat) {
                    return new PlayerBatStatsVM(stat, self, self.accountId);
                });

                self.playerBatStats(playerStats);
                self.isBatLoading(false);
            }
        });

        self.getBatStatsTotals();
    }

    self.getBatStatsTotals = function () {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/gamebatstatstotals';

        if (self.selectedGame() > 0) {
            url = url + '/' + self.selectedGame();
        }

        $.ajax({
            type: "GET",
            url: url,
            success: function (stat) {
                if (stat)
                    self.batStatsTotals(new PlayerBatStatsVM(stat, self, self.accountId));
                else
                    self.batStatsTotals(null);
            }
        });

    }

    self.deleteBatStat = function (stat) {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/game/' + self.selectedGame() + '/gameplayerbatstats/' + stat.PlayerId();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.playerBatStats.remove(stat);
                self.getBatStatsTotals();
                self.readdAvailableBatStatPlayer(stat.PlayerId());
            }
        });
    };

    self.readdAvailableBatStatPlayer = function (playerId) {
        var url = window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/players/' + playerId;

        $.ajax({
            type: "GET",
            url: url,
            success: function (player) {
                self.availableBatPlayers.push({
                    Id: player.Id,
                    PhotoUrl: player.Contact.PhotoURL,
                    Name: player.Contact.FullName
                });

                self.availableBatPlayers.sort(function (left, right) {
                    var lName = left.Name.toUpperCase();
                    var rName = right.Name.toUpperCase();
                    return lName == rName ? 0 : (lName < rName ? -1 : 1);

                });
            }
        });

    };

    self.availablePitchPlayers = ko.observableArray();
    self.playerPitchStats = ko.observableArray();
    self.pitchStatsTotals = ko.observable();

    self.addPlayerToPitchStats = function (player) {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/game/' + self.selectedGame() + '/gameplayerpitchstats/' + player.Id;

        $.ajax({
            type: "POST",
            url: url,
            success: function (stats) {
                var playerStats = new PlayerPitchStatsVM(stats, self, self.accountId);

                self.playerPitchStats.push(playerStats);
                self.availablePitchPlayers.remove(player);
            }
        });
    }

    self.getAvailablePitchPlayers = function () {

        self.availablePitchPlayers.removeAll();

        if (self.selectedGame() <= 0)
            return;

        if (self.isAdmin || self.isTeamAdmin) {
            var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/nopitchstats/' + self.selectedGame();

            $.ajax({
                type: "GET",
                url: url,
                success: function (players) {
                    var mapPlayers = $.map(players, function (player) {
                        return {
                            Id: player.Id,
                            PhotoUrl: player.PhotoURL,
                            Name: player.LastName + ", " + player.FirstName + ((player.MiddleName) ? " " + player.MiddleName : "")
                        };
                    });

                    self.availablePitchPlayers(mapPlayers);
                }
            });
        }
    }

    self.getPlayersPitchStats = function () {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/gamepitchstats';

        if (self.selectedGame() > 0) {
            url = url + '/' + self.selectedGame();
        }

        self.isPitchLoading(true);

        $.ajax({
            type: "GET",
            url: url,
            success: function (stats) {

                var playerStats = $.map(stats, function (stat) {
                    return new PlayerPitchStatsVM(stat, self, self.accountId);
                });

                self.playerPitchStats(playerStats);
                self.isPitchLoading(false);
            }
        });

        self.getPitchStatsTotals();
    }

    self.deletePitchStat = function (stat) {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/game/' + self.selectedGame() + '/gameplayerpitchstats/' + stat.PlayerId();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.playerPitchStats.remove(stat);
                self.getPitchStatsTotals();
                self.readdAvailablePitchStatPlayer(stat.PlayerId());
            }
        });
    };

    self.readdAvailablePitchStatPlayer = function (playerId) {
        var url = window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/players/' + playerId;

        $.ajax({
            type: "GET",
            url: url,
            success: function (player) {
                self.availablePitchPlayers.push({
                    Id: player.Id,
                    PhotoUrl: player.Contact.PhotoURL,
                    Name: player.Contact.FullName
                });

                self.availablePitchPlayers.sort(function (left, right) {
                    var lName = left.Name.toUpperCase();
                    var rName = right.Name.toUpperCase();
                    return lName == rName ? 0 : (lName < rName ? -1 : 1);

                });
            }
        });

    };


    self.getPitchStatsTotals = function () {
        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/gamepitchstatstotals';

        if (self.selectedGame() > 0) {
            url = url + '/' + self.selectedGame();
        }

        $.ajax({
            type: "GET",
            url: url,
            success: function (stat) {
                if (stat)
                    self.pitchStatsTotals(new PlayerPitchStatsVM(stat, self, self.accountId));
                else
                    self.pitchStatsTotals(null);
            }
        });
    }

    self.getGameSummary = function () {

        if (self.selectedGame() <= 0) {
            self.gameSummary('');
            return;
        }

        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/gamesummary' + '/' + self.selectedGame();

        $.ajax({
            type: "GET",
            url: url,
            success: function (gameSummary) {
                self.gameSummary(gameSummary);
                tinymce.get('gameSummaryText').setContent(self.gameSummary());
            }
        });
    }

    if (self.isAdmin || self.isTeamAdmin) {
        $('.statsTable').editableTableWidget();
        // if showing all games, don't allow edit.
        $('.statsTable').on('beforeEdit', function () {
            return self.selectedGame() != 0;
        }).on('change', function (evt, text) {
        });
    }
}

