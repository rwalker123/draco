function initViewModel(accountId) {
    initKOHelpers();

    $(document).bind('drop dragover', function (e) {
        e.preventDefault();
    });

    $.ui.autocomplete.prototype._renderItem = function (ul, item) {
        var li = $("<li>");
        li.data("item.autocomplete", item);
        var photoURL = item.PhotoURL ? item.PhotoURL : window.config.rootUri + '/Images/defaultperson.png';
        li.append("<a><img width='40px' height='30px' style='vertical-align: middle' src='" + photoURL + "' /><span style='font-weight: 600'>" + item.label + "</span></a>");
        li.appendTo(ul);

        return li;
    };

    var umpireData = new UmpiresClass(accountId);
    ko.applyBindings(umpireData);
    umpireData.populateUmpires();
}

var UmpireClass = function (accountId) {
    var self = this;
    self.accountId = accountId;

    self.id = 0;
    self.contactId = ko.observable('');
    self.firstName = ko.observable('');
    self.middleName = ko.observable('');
    self.lastName = ko.observable('');
    self.photoUrl = '';

    self.fullName = ko.computed(function () {
        var fullName = self.lastName() + ', ' + self.firstName();
        if (self.middleName())
            fullName += ' ' + self.middleName();

        return fullName;
    }, this);

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/ContactPhoto/' + self.contactId();
    }, this);

    self.details = {};
    self.details.loaded = false;
    self.details.email = ko.observable('');
    self.details.address = ko.observable('');
    self.details.city = ko.observable('');
    self.details.state = ko.observable('');
    self.details.zip = ko.observable('');
    self.details.phone1 = ko.observable('');
    self.details.phone2 = ko.observable('');
    self.details.phone3 = ko.observable('');

    self.detailsVisible = ko.observable(true);

}

var UmpiresClass = function (accountId) {
    var self = this;
    self.accountId = accountId;

    self.umpires = ko.observableArray([]);

    self.selectedPlayer = ko.observable(null);
    self.hasSelectedPlayer = ko.computed(function () {
        return self.selectedPlayer() != null;
    }, self);

    self.getPlayers = function (request, response) {
        var searchTerm = this.term;

        $.ajax({
            url: window.config.rootUri + '/api/UmpireAPI/' + self.accountId + '/AvailableUmpires',
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

    self.addUmpire = function () {
        if (!self.hasSelectedPlayer())
            return;

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/UmpireAPI/' + self.accountId + '/AddUmpire/' + self.selectedPlayer().id,
            dataType: "json",
            success: function (data) {
                self.populateUmpires();
            }
        });
    }

    self.populateUmpires = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/UmpireAPI/' + self.accountId,
            success: function (data) {
                var mappedUsers = $.map(data, function (item) {
                    var umpire = new UmpireClass(item.AccountId);
                    umpire.id = item.Id;
                    umpire.contactId(item.ContactId);
                    umpire.firstName(item.FirstName);
                    umpire.lastName(item.LastName);
                    umpire.middleName(item.MiddleName);
                    umpire.photoUrl = item.PhotoURL;
                    return umpire;
                });

                self.umpires(mappedUsers);
                self.refreshUmpireList();
            }
        });
    }

    self.makeAccordion = function () {
        $("#accordion").accordion({
            heightStyle: 'content',
            autoHeight: false,
            collapsible: true,
            active: false,
            header: 'h3',
            beforeActivate: function (event, ui) {
                if (ui.newPanel !== undefined && ui.newPanel.length > 0) {

                    var vm = ko.dataFor(ui.newPanel[0]);
                    if (vm && vm.details && !vm.details.loaded) {
                        self.fillUmpireDetails(vm);
                    }
                }
            },
            changestart: function (event, ui) {
                var clicked = $(this).find('.ui-state-active').attr('id');
                $('#' + clicked).load('/widgets/' + clicked);
            }
        });
    }

    self.makeAccordion();

    self.refreshUmpireList = function () {
        var a = $("#accordion");
        a.accordion('destroy');
        self.makeAccordion();

        // refresh insists on setting the first item expanded
        //a.accordion("refresh");
    }

    self.deleteUmpire = function (umpire) {
        // make Ajax call to save.
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/UmpireAPI/' + self.accountId + '/RemoveUmpire/' + umpire.id,
            success: function (data) {
                // remove from data model.
                self.umpires.remove(umpire);
            }
        });
    }

    self.fillUmpireDetails = function (userData) {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/ContactsAPI/' + self.accountId + '/GetContactDetails/' + userData.contactId(),
            success: function (data) {
                if (data) {
                    window.location.hash = 'update';

                    userData.details.email(data.Email);
                    userData.details.address(data.StreetAddress);
                    userData.details.city(data.City);
                    userData.details.state(data.State);
                    userData.details.zip(data.Zip);
                    userData.details.phone1(data.Phone1);
                    userData.details.phone2(data.Phone2);
                    userData.details.phone3(data.Phone3);

                    userData.details.loaded = true;
                }
            }
        });
    }

}

