function initScheduleViewModel(accountId, isAdmin, allUmpires) {
    initKOHelpers();

    var scheduleElem = document.getElementById("schedule");
    if (scheduleElem) {
        ko.validation.rules['mustNotEqual'] = {
            validator: function (val, otherVal) {
                return val !== otherVal;
            },
            message: 'The home team and away team must be different'
        };
        ko.validation.registerExtenders();


        var scheduleVM = new ScheduleViewModel(accountId, isAdmin, allUmpires);
        ko.applyBindings(scheduleVM, scheduleElem);
    }
}

var GameDayViewModel = function (theDate) {
    var self = this;
    
    self.date = ko.observable(new Date(theDate));
    self.games = ko.observableArray();
    self.monthDayNumber = ko.computed(function () {
        return self.date().getDate();
    });
}

var GameViewModel = function (data) {
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

    self.GameDate.extend({ required: true });
    self.GameDate.TimeText = ko.observable(moment(self.GameDate() || new Date()).format("h:mm a"));
    self.GameDate.DateText = ko.observable(self.GameDate());

    self.HomeTeamId.extend({ required: true });
    self.AwayTeamId.extend({ required: true }).extend({ mustNotEqual: self.HomeTeamId });
    self.GameType.extend({ required: true });

    self.GameStatus.isFinal = ko.computed(function () {
        return self.GameStatus() > 0;
    });

    self.GameStatus.Text = ko.computed(function () {
        if (self.GameStatus() == 1)
            return "F";
        else if (self.GameStatus() == 2)
            return "R";
        else if (self.GameStatus() == 3)
            return "P";
        else if (self.GameStatus() == 4)
            return "FG";
        else if (self.GameStatus() == 5)
            return "DNR";
        else
            return "I";
    });

    self.Umpires = ko.observableArray();
    self.updateUmpires = function () {
        if (self.Umpire1()) {
            self.Umpires.push(self.Umpire1());
        }
        if (self.Umpire2()) {
            self.Umpires.push(self.Umpire2());
        }
        if (self.Umpire3()) {
            self.Umpires.push(self.Umpire3());
        }
        if (self.Umpire4()) {
            self.Umpires.push(self.Umpire4());
        }
    }

    self.updateUmpires();

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
        self.Umpires.removeAll();
        self.updateUmpires();
        self.GameDate.TimeText(moment(self.GameDate()).format("h:mm a"));
        self.GameDate.DateText(self.GameDate());
    }

    self.toJS = function () {
        var gameTime = new Date("1/1/1980 " + self.GameDate.TimeText());
        var gameDate = new Date(self.GameDate.DateText());
        gameDate.setHours(gameTime.getHours());
        gameDate.setMinutes(gameTime.getMinutes());

        var js = ko.mapping.toJS(self);

        js.GameDate = moment(gameDate).format("MM/DD/YYYY h:mm a");
        js.Umpire1 = self.Umpires()[0] || 0;
        js.Umpire2 = self.Umpires()[1] || 0;
        js.Umpire3 = self.Umpires()[2] || 0;
        js.Umpire4 = self.Umpires()[3] || 0;

        return js;
    }


}

var ScheduleViewModel = function (accountId, isAdmin, allUmps) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.viewMode = ko.observable(false);
    self.loadingSchedule = ko.observable(true);
    self.addGameMode = ko.observable(false);
    self.leagueTeams = ko.observableArray([]);
    self.selectedTeam = ko.observable();
    self.selectedLeague = ko.observable();
    self.selectedLeague.subscribe(function () {
        self.populateTeams();
        self.setupMonthData(new Date());
    });

    self.allUmpires = ko.observableArray(allUmps);

    self.currentDate = ko.observable();

    self.currentMonth = ko.computed(function () {
        return moment(self.currentDate()).format("MMMM");
    });

    self.gameMonth = ko.observableArray();


    // template for new game form.
    self.newGame = new GameViewModel({
        HomeTeamName: '',
        AwayTeamName: '',
        GameDate: '',
        HomeTeamId: null,
        AwayTeamId: null,
        GameType: 0,
        GameStatus: 0,
        FieldId: 0,
        FieldName: '',
        Umpire1: 0,
        Umpire2: 0,
        Umpire3: 0,
        Umpire4: 0
    });

    // data for game currently being edit.
    self.editingGame = ko.validatedObservable(new GameViewModel({
        HomeTeamName: '',
        AwayTeamName: '',
        GameDate: '',
        HomeTeamId: 0,
        AwayTeamId: 0,
        GameType: 0,
        GameStatus: 0,
        FieldId: 0,
        FieldName: '',
        Umpire1: 0,
        Umpire2: 0,
        Umpire3: 0,
        Umpire4: 0
    }));

    self.isEditMode = ko.observable(false);
    self.gameEditorTitle = ko.computed(function () {
        if (self.isEditMode())
            return "Edit Game";
        else
            return "Create Game";
    });

    // cache the teams we have retrieved.
    self.teamsCache = {};

    self.enterAddGameMode = function (viewModel) {
        self.viewMode(false);

        self.newGame.GameDate(new Date(viewModel.date()));
        self.newGame.GameDate.DateText(self.newGame.GameDate());

        var data = self.newGame.toJS();
        self.editingGame().update(data);

        self.isEditMode(false);
        self.addGameMode(true);
    }

    self.addGame = function (editGame) {
        if (!self.editingGame.isValid())
            return;

        var newData = self.editingGame().toJS();

        $.ajax({
            type: (self.isEditMode()) ? "PUT" : "POST",
            url: window.config.rootUri + '/api/ScheduleAPI/' + self.accountId + '/league/' + self.selectedLeague() + '/game',
            data: newData,
            success: function (game) {
                self.cancelAddGame();
                if (self.isEditMode()) {
                    var wasFound = false;
                    // find item in calendar so we can update it.
                    $.each(self.gameMonth(), function (index, gameWeek) {
                        $.each(gameWeek(), function (index, gameDay) {
                            var foundItems = $.grep(gameDay.games(), function (e) {
                                return e.Id() == editGame.Id();
                            });

                            if (foundItems.length > 0) {
                                var foundItem = foundItems[0];
                                var newDate = new Date(game.GameDate);
                                var oldDate = new Date(foundItem.GameDate());
                                if (newDate.getMonth() != oldDate.getMonth() ||
                                    newDate.getDay() != oldDate.getDay() ||
                                    newDate.getYear() != oldDate.getYear()) {
                                    // need to remove from here and add to calendar.
                                    gameDay.games.remove(foundItem);
                                    self.addGameToCalendar(game);
                                }
                                else {
                                    foundItem.update(game);
                                    if (newDate != oldDate) {
                                        gameDay.games.sort(self.sortGamesByTime);
                                    }
                                }
                                wasFound = true;
                                return false;
                            }
                        });

                        return !wasFound;
                    });

                }
                else {
                    self.addGameToCalendar(game);
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    self.cancelAddGame = function () {
        self.addGameMode(false);
        self.viewMode(true);
    }

    self.editGame = function (game) {

        var data = game.toJS();
        self.editingGame().update(data);
        self.viewMode(false);
        self.addGameMode(true);
        self.isEditMode(true);
    }

    self.deleteGame = function (game) {

        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/ScheduleAPI/' + self.accountId + '/league/' + self.selectedLeague() + '/game/' + game.Id(),
            success: function () {
                $.each(self.gameMonth(), function (index, gameWeek) {
                    $.each(gameWeek(), function (index, gameDay) {
                        gameDay.games.remove(game);
                    });
                });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.enterGameResults = function (game) {

    }

    self.setupMonthData = function (theDate) {
        theDate.setDate(1);

        self.currentDate(new Date(theDate));
        self.currentDate().setHours(0, 0, 0, 0);

        var startMonth = theDate.getMonth();

        // get back to "Sunday"
        var dayOfWeek = theDate.getDay();
        theDate.setDate(theDate.getDate() - dayOfWeek);
        var startDate = moment(theDate).format("MM-DD-YYYY");

        // now go for 4 weeks.
        while (theDate.getMonth() <= startMonth) {
            theDate.setDate(theDate.getDate() + 7);
        }

        var endDate = moment(theDate).format("MM-DD-YYYY");

        $.ajax({
                type: "GET",
                url: window.config.rootUri + '/api/ScheduleAPI/' + self.accountId + '/league/' + self.selectedLeague() + '/week?startDay=' + startDate + '&endDay=' + endDate,
                success: function (games) {

                    var curDate = new Date(startDate);
                    var stopDate = new Date(endDate);

                    var curGameIndex = 0;

                    while (curDate < stopDate) {
                        var dayNo = 0;
                        var gameWeek = ko.observableArray();

                        while (dayNo < 7) {

                            var viewModel = new GameDayViewModel(curDate);
                            while (curGameIndex < games.length) {
                                var gameDate = new Date(games[curGameIndex].GameDate);
                                gameDate.setHours(0, 0, 0, 0);
                                if (gameDate <= curDate) {
                                    var curGame = games[curGameIndex];
                                    var gameViewModel = new GameViewModel(curGame);
                                    viewModel.games.push(gameViewModel);
                                    ++curGameIndex;
                                }
                                else
                                    break;
                            }
                            gameWeek.push(viewModel);
                            dayNo++;

                            curDate.setDate(curDate.getDate() + 1);
                        }

                        self.gameMonth.push(gameWeek);
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
                },
                complete: function () {
                    self.loadingSchedule(false);
                    self.viewMode(true);
                }
            });
    }

    self.addGameToCalendar = function (game) {

        // find the range of game dates shown, determine if the
        // given game is in that range.
        var startDate = new Date(self.currentDate());

        var startMonth = startDate.getMonth();

        // get back to "Sunday"
        var dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);

        var endDate = new Date(startDate);

        // now go for 4 weeks.
        while (endDate.getMonth() <= startMonth) {
            endDate.setDate(endDate.getDate() + 7);
        }

        var gameDate = new Date(game.GameDate);
        gameDate.setHours(0, 0, 0, 0);
        if (gameDate >= startDate && gameDate <= endDate) {

            var curDate = new Date(startDate);

            var weekNo = 0;
            var gameDay = null;

            while (curDate <= gameDate) {
                var dayNo = 0;

                while (dayNo < 7) {

                    if (+curDate === +gameDate) {
                        var gameWeek = self.gameMonth()[weekNo];
                        gameDay = gameWeek()[dayNo];
                        break;
                    }

                    dayNo++;
                    curDate.setDate(curDate.getDate() + 1);
                }

                if (gameDay) {
                    if (gameDay.games().length == 0) {
                        var newGame = new GameViewModel(game);
                        gameDay.games.push(newGame);
                    }
                    else {
                        var newGame = new GameViewModel(game);
                        gameDay.games.push(newGame);
                        gameDay.games.sort(self.sortGamesByTime);
                    }
                    break;
                }

                weekNo++;
            }
        }
    }

    self.sortGamesByTime = function (g1, g2) {
        var t1 = new Date(g1.GameDate());
        var t2 = new Date(g2.GameDate());

        var hours1 = t1.getHours();
        var hours2 = t2.getHours();

        if (hours1 == hours2) {
            var mins1 = t1.getMinutes();
            var mins2 = t2.getMinutes();

            return mins1 == mins2 ? 0 : mins1 < mins2 ? -1 : 1;
        }
                            
        return hours1 == hours2 ? 0 : hours1 < hours2 ? -1 : 1;
    }

    self.populateTeams = function () {
        if (self.selectedLeague() in self.teamsCache)
            self.leagueTeams(self.teamsCache[self.selectedLeague()]);
        else {

            $.ajax({
                type: "GET",
                url: window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/teams/' + self.selectedLeague(),
                success: function (teams) {
                    self.teamsCache[self.selectedLeague()] = $.map(teams, function (team) {
                        return { Name: team.Name, Id: team.Id };
                    });

                    if (self.teamsCache[self.selectedLeague()].length == 0)
                        self.teamsCache[self.selectedLeague()] = [ { Name: '{no teams in league}', Id: 0 } ];

                    self.leagueTeams(self.teamsCache[self.selectedLeague()]);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
                }
            });
        }
    }

    $("#leagueSelect").selectpicker();
    $("#newGameType").selectpicker();
    $("#newGameField").selectpicker();
    $("#newGameUmpires").selectpicker();
}