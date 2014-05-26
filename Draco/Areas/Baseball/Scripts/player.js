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

    self.foundPlayer = undefined;

    self.loadPlayer = function () {
        if (!self.foundPlayer || !self.foundPlayer.id) {
            return;
        }

        window.location = window.config.rootUri + '/baseball/player/contact/' + self.accountId + '/' + self.foundPlayer.id;
    }

    self.getPlayers = function (request, response) {
        var searchTerm = this.term;

        $.ajax({
            url: window.config.rootUri + '/api/UserRolesAPI/' + self.accountId + '/SearchContacts',
            dataType: "json",
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
            },
        });
    }

    self.selectPlayer = function (e, ui) {
        if (ui && ui.item) {
            self.foundPlayer = {
                id: ui.item.Id,
                text: ui.item.value,
                logo: ui.item.PhotoURL,
                hasLogo: (!!ui.item.PhotoURL),
                selected: ko.observable(true)
            };
        }

        return true;
    }

    $.ui.autocomplete.prototype._renderItem = function (ul, item) {
        var li = $("<li>");
        li.data("item.autocomplete", item);
        var photoURL = item.PhotoURL;
        li.append("<a><img onerror=\"this.style.display = 'none';\" width='40px' height='30px' style='vertical-align: middle' src='" + photoURL + "' /><span style='font-weight: 600'>" + item.label + "</span></a>");
        li.appendTo(ul);

        return li;
    };
}