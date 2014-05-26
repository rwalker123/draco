function initTeamViewModel(accountId, teamSeasonId, teamId, teamName, isAdmin) {

    var teamElem = document.getElementById("teamInfo");
    if (teamElem) {
        var teamVM = new TeamViewModel(accountId, teamSeasonId, teamId, teamName, isAdmin);
        ko.applyBindings(teamVM, teamElem);
    }
}

self.TeamViewModel = function (accountId, teamSeasonId, teamId, teamName, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.teamSeasonId = teamSeasonId;
    self.teamId = teamId;
    self.isAdmin = isAdmin;

    self.teamName = ko.observable(teamName);

    self.viewMode = ko.observable(true);

    var originalTeamName = '';

    self.editTeamName = function () {
        originalTeamName = self.teamName();
        self.viewMode(false);
    }

    self.saveTeamName = function () {

        var url = window.config.rootUri + '/api/TeamAPI/' + self.accountId + '/Team/' + self.teamSeasonId + '/teamname';
        $.ajax({
            type: "PUT",
            data: {
                Id: self.teamSeasonId,
                AccountId: self.accountId,
                Name: self.teamName()
            },
            url: url,
            success: function () {
                self.viewMode(true);
            }
        });
    }

    self.cancelEdit = function () {
        self.teamName(originalTeamName);
        self.viewMode(true);
    }

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/TeamLogo/' + self.teamId;
    });

}