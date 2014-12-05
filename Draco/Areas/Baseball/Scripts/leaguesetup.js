function initLeagueSetupData(accountId, currentSeasonId) {
    initKOHelpers();

    var userData = new LeagueSetupClass(accountId, currentSeasonId);
    ko.applyBindings(userData, document.getElementById("leagueSetup"));

    $(document).bind('drop dragover', function (e) {
        e.preventDefault();
    });
}

var SeasonViewModel = function (data) {
    var self = this;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
        //'HomeTeamId': {
        //    create: function (options) {
        //        return ko.observable(options.data);
        //    },
        //    update: function (options) {
        //        return options.data;
        //    }
        //}
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var LeagueViewModel = function (data, accountId) {
    var self = this;

    self.accountId = accountId;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
        //'Divisions': {
        //    create: function (options) {
        //        return new DivisionViewModel(options.data, self.accountId);
        //    }
        //    update: function (options) {
        //        return options.data;
        //    }
        //}
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.Id.isPopulated = ko.observable(false);
    self.Id.newDivisionName = ko.observable();
    self.Id.newDivisionPriority = ko.observable(1);
    self.Id.unassignedTeams = ko.observableArray();
    self.Id.Divisions = ko.observableArray();

    self.populateDivisonData = function () {
        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/DivisionSetup/' + self.Id();
        $.ajax({
            type: "GET",
            url: url,
            success: function (divisionData) {
                var mappedDivisions = $.map(divisionData, function(division) {
                    return new DivisionViewModel(division, self);
                });

                self.Id.Divisions(mappedDivisions);
                self.Id.isPopulated(true);
                self.fillTeamList();
            }
        });
    }

    self.fillTeamList = function () {
        var url = window.config.rootUri + '/api/LeaguesAPI/' + this.accountId + '/UnassignedTeams/' + self.Id();
        $.ajax({
            type: "GET",
            url: url,
            success: function (teams) {
                self.Id.unassignedTeams(teams);
            }
        });
    }

    self.Name.subscribe(function () {
        if (self.Name().length == 0)
            return;

        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/LeagueSetup/' + self.Id();

        $.ajax({
            type: "PUT",
            url: url,
            data: {
                Name: self.Name()
            },
            success: function (leagueId) {
            }
        });
    });

    self.addDivision = function (leagueVM) {

        if (self.Id.newDivisionName().length == 0)
            return;

        if (self.Id.newDivisionPriority().length == 0)
            self.Id.newDivisionPriority(1);

        var sortOrder = self.Id.newDivisionPriority();
        if (isNaN(sortOrder))
            return;

        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/DivisionSetup/' + leagueVM.Id();
        $.ajax({
            type: "POST",
            url: url,
            data: {
                LeagueId: leagueVM.Id(),
                Name: self.Id.newDivisionName(),
                Priority: sortOrder
            },
            success: function (divisionId) {

                var data = {
                    Id: divisionId,
                    LeagueId: leagueVM.Id(),
                    Name: self.Id.newDivisionName(),
                    Priority: sortOrder,
                    Teams: []
                };

                var newDivision = new DivisionViewModel(data, self);

                self.Id.Divisions.push(newDivision);

                self.Id.Divisions.sort(self.sortByPriority);

                // reset the data fields.
                self.Id.newDivisionName('');
                self.Id.newDivisionPriority(1);
            }
        });

    }

    self.deleteDivision = function (divisionVM) {
        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/DivisionSetup/' + divisionVM.Id();
        $.ajax({
            type: "DELETE",
            url: url,
            success: function (divisionId) {
                self.Id.Divisions.remove(divisionVM);
            }
        });
    }

    self.sortDivisions = function () {
        self.Id.Divisions.sort(self.sortByPriority);
    }

    self.sortByPriority = function (left, right) {
        var lDivPriority = left.Priority();
        var rDivPriority = right.Priority();
        return lDivPriority == rDivPriority ? 0 : (lDivPriority < rDivPriority ? -1 : 1);
    }

    self.removeTeamFromDivision = function (teamVM) {
        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/DivisionTeams/' + teamVM.Id();
        $.ajax({
            type: "DELETE",
            url: url,
            success: function (divisionId) {
                var divisionVM = ko.utils.arrayFirst(self.Id.Divisions(), function(div) {
                    return (div.Id() == teamVM.DivisionId());
                });

                if (divisionVM) {
                    divisionVM.Teams.remove(teamVM);
                }

                teamVM.DivisionId(0);
                self.Id.unassignedTeams.push(teamVM.toJS());
            }
        });
    }

    self.addTeamToDivision = function (divisionVM) {
        if (!divisionVM.Id.selectedNewTeam())
            return;

        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/TeamDivision/' + divisionVM.Id();
        $.ajax({
            type: "PUT",
            url: url,
            data: {
                Id: divisionVM.Id.selectedNewTeam()
            },
            success: function (newTeam) {

                var team = ko.utils.arrayFirst(self.Id.unassignedTeams(), function (t) {
                    return t.Id == newTeam.Id;
                });

                if (team) {
                    self.Id.unassignedTeams.remove(team);
                }

                divisionVM.Teams.push(new TeamViewModel(newTeam, self.accountId));
                divisionVM.Teams.sort(self.sortByTeamName);
            }
        });
    }

    self.addNewTeam = function (divisionVM) {
        if (divisionVM.Id.newTeamName().length == 0)
            return;

        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/TeamDivision/' + self.Id();
        $.ajax({
            type: "POST",
            url: url,
            data: {
                AccountId: this.accountId,
                LeagueId: self.Id(),
                DivisionId: divisionVM.Id(),
                Name: divisionVM.Id.newTeamName()
            },
            success: function (team) {

                divisionVM.Teams.push(new TeamViewModel(team, self.accountId));
                divisionVM.Teams.sort(self.sortByTeamName);
                divisionVM.Id.newTeamName('');
            }
        });
    }

    self.sortByTeamName = function (left, right) {
        var lName = left.Name();
        var rName = right.Name();
        return lName == rName ? 0 : (lName < rName ? -1 : 1);
    }

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}


var DivisionViewModel = function (data, leagueVM) {
    var self = this;

    self.accountId = leagueVM.accountId;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
        'Teams': {
            create: function (options) {
                return new TeamViewModel(options.data, self.accountId);
            }
        //    update: function (options) {
        //        return options.data;
        //    }
        }
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.Id.selectedNewTeam = ko.observable();
    self.Id.newTeamName = ko.observable();

    self.Name.subscribe(function () {
        self.updateDivision();
    });
    self.Priority.subscribe(function () {
        self.updateDivision();
    });
    
    self.updateDivision = function () {

        if (self.Name().length == 0)
            return;

        if (isNaN(self.Priority()))
            return;

        var data = self.toJS();

        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/DivisionSetup/' + self.Id();
        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function (obj) {
                leagueVM.sortDivisions();
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

var TeamViewModel = function (data, accountId) {
    var self = this;

    self.accountId = accountId;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
    //'HomeTeamId': {
    //    create: function (options) {
    //        return ko.observable(options.data);
            //    },
        //    update: function (options) {
        //        return options.data;
        //    }
            //}
        }

    ko.mapping.fromJS(data, self.mapping, self);

    self.teamLogoUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/TeamLogo/' + self.TeamId();
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
        }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var LeagueSetupClass = function (accountId, currentSeasonId) {
    var self = this;

    self.accountId = accountId;
    self.currentSeasonId = currentSeasonId;

    self.leagues = ko.observableArray();
    self.seasons = ko.observableArray();
    self.selectedSeasonId = ko.observable();

    self.fillSeasonList = function () {

        $.getJSON(window.config.rootUri + '/api/SeasonsAPI/' + self.accountId + '/Seasons',
			function (data) {
			    var mappedSeasons = $.map(data, function (item) {
			        if (item.Id != self.currentSeasonId) {
			            return new SeasonViewModel(item);
			        }
			    });

			    self.seasons(mappedSeasons);
			});
    }

    self.fillLeagues = function () {
        $.getJSON(window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/Leagues',
			function (data) {

			    var mappedLeagues = $.map(data, function (item) {
			        return new LeagueViewModel(item, self.accountId);
			    });

			    self.leagues(mappedLeagues);

			    if (!self.leagues().length)
			        $('#copyFromSeasonPanel').collapse('show');
			});
    }

    self.newLeagueName = ko.observable();

    self.addLeague = function () {
        if (self.newLeagueName().length == 0)
            return;

        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/LeagueSetup/' + self.currentSeasonId;
        $.ajax({
            type: "POST",
            url: url,
            data: {
                Name: self.newLeagueName()
            },
            success: function (leagueId) {
                var leagueViewModel = new LeagueViewModel({
                    Id: leagueId,
                    Name: self.newLeagueName()
                }, self.accountId);

                self.leagues.push(leagueViewModel);

                $('#copyFromSeasonPanel').collapse('hide');

                self.newLeagueName("");
            }
        });
    }

    self.deleteLeague = function (leagueVM) {

        $("#deleteModal").modal("show");

        $("#confirmDeleteBtn").one("click", function () {
            self.makeLeagueDeleteCall(leagueVM);
        });
    }

    self.makeLeagueDeleteCall = function (leagueVM) {
        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/LeagueSetup/' + leagueVM.Id();
        $.ajax({
            type: "DELETE",
            url: url,
            success: function (deletedLeagueId) {

                self.leagues.remove(leagueVM);
                // if no more leagues, import from previous season becomes a
                // more viable option.
                if (self.leagues().length == 0) {
                    $('#copyFromSeasonPanel').collapse('show');
                }
            }
        });
    }


    self.copySeason = function () {
        if (!self.selectedSeasonId())
            return;

        if (self.leagues().length > 0) {
            $("#copySeasonModal").modal("show");

            $("#confirmCopySeasonBtn").one("click", function () {
                self.performCopySeason();
            });
        }
        else
            self.performCopySeason();
    }

    self.performCopySeason = function () {
        
        var copyFromSeasonId = self.selectedSeasonId();
        var seasonId = self.currentSeasonId;

        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/CopyLeagueSetup/' + seasonId;
        $.ajax({
            type: "POST",
            url: url,
            data: {
                AccountId: this.accountId,
                Id: copyFromSeasonId
            },
            success: function (teamSeasonId) {

                // remove all old leagues
                self.leagues.removeAll();

                // restore...
                self.fillLeagues();

                if (self.seasons().length)
                    $('#copyFromSeasonPanel').collapse('hide');
            }
        });
    }

    $('#accordion').on('shown.bs.collapse', function () {

        //get the anchor of the accordian that does not has the class "collapsed"
        var openAnchor = $(this).find('a[data-toggle=collapse]:not(.collapsed)');
        if (openAnchor && openAnchor.length == 1) {
            var vm = ko.dataFor(openAnchor[0]);
            if (vm && !vm.Id.isPopulated()) {
                vm.populateDivisonData();
            }
        }
    });

    self.fillSeasonList();
    self.fillLeagues();
};

