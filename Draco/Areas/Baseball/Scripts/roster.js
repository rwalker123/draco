function InitRosterViewModel(accountId, isAdmin, isTeamAdmin, teamId) {
    var rosterElem = document.getElementById("roster");
    if (rosterElem) {

        $.ui.autocomplete.prototype._renderItem = function (ul, item) {
            var li = $("<li>");
            li.data("item.autocomplete", item);
            var photoURL = item.PhotoURL ? item.PhotoURL : window.config.rootUri + '/Images/defaultperson.png';
            li.append("<a><img width='40px' height='30px' style='vertical-align: middle' src='" + photoURL + "' /><span style='font-weight: 600'>" + item.label + "</span></a>");
            li.appendTo(ul);

            return li;
        };

        var rosterVM = new RosterViewModel(accountId, isAdmin, isTeamAdmin, teamId);
        rosterVM.init();
        ko.applyBindings(rosterVM, rosterElem);
    }
}

var PlayerViewModel = function (accountId, data) {
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

    self.Contact.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/ContactPhoto/' + self.Contact.Id();
    });

    self.DateAdded.Formatted = ko.computed(function () {
        return self.DateAdded() ? moment(self.DateAdded()).format("MM DD, YYYY") : '';
    });

    self.Contact.DateOfBirth.Formatted = ko.computed(function () {
        return self.Contact.DateOfBirth() ? moment(self.Contact.DateOfBirth()).format("MMM DD, YYYY") : '';
    });

    self.Id.viewMode = ko.observable(true);

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var RosterViewModel = function (accountId, isAdmin, isTeamAdmin, teamId) {
    var self = this;

    self.accountId = accountId;
    self.teamId = teamId;
    self.isAdmin = isAdmin;
    self.isTeamAdmin = isTeamAdmin;

    self.players = ko.observableArray();

    self.signPlayerVisible = ko.observable(false);

    self.selectedPlayer = ko.observable();

    self.init = function () {
        var elem = $("#handoutSelectedFileName");

        elem.bind('dragenter', function (e) {
            $(this).addClass('dragover');
        });

        elem.bind('dragleave drop', function (e) {
            $(this).removeClass('dragover');
        });


        self.loadPlayers();
    }

    self.isPlayerSelected = ko.computed(function () {
        return self.selectedPlayer();
    })

    // save player data while editing, restore if cancelled.
    var savedPlayer;

    self.editPlayer = function (player) {
        savedPlayer = player.toJS();

        player.Id.viewMode(!player.Id.viewMode());
    }

    self.cancelEditPlayer = function (player) {
        player.update(savedPlayer);
        player.Id.viewMode(true);
    }

    self.editPlayerNumber = function (player) {

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/playernumber/' + player.Id(),
            data: {
                PlayerNumber: player.PlayerNumber(),
            },
            success: function () {

                player.PlayerNumber();
                player.Id.viewMode(true);
            }
        });
    }

    self.savePlayer = function (player) {

        var data = player.toJS();

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/roster/' + player.Id(),
            data: data,
            success: function (item) {
                player.update(item);
                player.Id.viewMode(true);
            }
        });

    }

    self.showSignPlayer = function () {
        if (self.signPlayerVisible()) {
            self.signPlayerVisible(false);
        }
        else {
            self.signPlayerVisible(true);
        }
    }

    self.releasePlayer = function (player) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/roster/' + player.Id(),
            success: function () {
                self.players.remove(player);
            }
        });
    }

    self.deletePlayer = function (player) {
        $("#deletePlayerModal").modal("show");

        $("#confirmPlayerDeleteBtn").one("click", function () {
            self.makePlayerDeleteCall(player)
        });
    }

    self.makePlayerDeleteCall = function (player) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/players/' + player.Id(),
            success: function () {
                self.players.remove(player);
            }
        });

    }

    self.signPlayer = function () {
        if (!self.selectedPlayer())
            return;

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/Team/' + self.teamId + '/roster/' + self.selectedPlayer().id,
            success: function (item) {
                var player = new PlayerViewModel(self.accountId, item);

                self.players.push(player);
                self.players.sort(function (left, right) {
                    var lName = left.Contact.FullName().toUpperCase();
                    var rName = right.Contact.FullName().toUpperCase();
                    return lName == rName ? 0 : (lName < rName ? -1 : 1);
                });

                self.selectedPlayer(null);
                $("input.autocomplete").val('');

            }
        });
    }

    self.loadPlayers = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/players',
            success: function (data) {
                var mappedPlayers = $.map(data, function (item) {
                    return new PlayerViewModel(self.accountId, item);
                });

                self.players(mappedPlayers);
            }
        });

    }

    self.getPlayers = function (request, response) {
        var searchTerm = this.term;

        $.ajax({
            url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + self.teamId + '/availableplayers',
            data: {
                lastName: searchTerm,
                firstName: '',
                page: 1
            },
            success: function (data) {

                var results = $.map(data, function (item) {
                    var fullName = item.LastName + ", " + item.FirstName;
                    if (item.MiddleName)
                        fullName += " " + item.MiddleName;

                    return {
                        label: fullName,
                        Id: item.Id,
                        PhotoURL: item.PhotoURL,
                        FirstName: item.FirstName,
                        LastName: item.LastName
                    }
                });
                response(results);
            }
        });
    }

    self.selectPlayer = function (e, ui) {
        if (ui && ui.item) {
            self.selectedPlayer({
                id: ui.item.Id,
                text: ui.item.value,
                logo: ui.item.PhotoURL,
                hasLogo: (!!ui.item.PhotoURL)
            });
        }

        return true;
    }

}