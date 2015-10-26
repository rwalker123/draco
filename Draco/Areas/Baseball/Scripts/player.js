function initPlayerViewModel(accountId) {

    initKOHelpers();

    var playerElem = document.getElementById("playerView");
    if (playerElem) {
        var playerVM = new PlayerViewModel(accountId);
        ko.applyBindings(playerVM, playerElem);

        $("th").tooltip({ container: 'body' });
    }
}


var PlayerViewModel = function (accountId) {
    var self = this;
    
    self.accountId = accountId;

    self.foundPlayer = ko.observable();

    self.loadPlayer = function () {
        if (!self.foundPlayer() || !self.foundPlayer().Id) {
            return;
        }

        window.location = window.config.rootUri + '/baseball/player/contact/' + self.accountId + '/' + self.foundPlayer().Id;
    }

    self.getPlayers = function (query, syncResults, asyncResults) {

        $.ajax({
            url: window.config.rootUri + '/api/UserRolesAPI/' + self.accountId + '/SearchContacts',
            dataType: "json",
            data: {
                lastName: query,
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
                asyncResults(results);
            },
        });
    }
}