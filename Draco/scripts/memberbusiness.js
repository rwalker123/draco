function initMemberBusinessViewModel(accountId, isAdmin, contactId) {

    initKOHelpers();

    var memberBusinessElem = document.getElementById("memberBusinessView");
    if (memberBusinessElem) {
        var memberBusinessVM = new MemberBusinessesViewModel(accountId, isAdmin, contactId);
        ko.applyBindings(memberBusinessVM, memberBusinessElem);
    }
}

var MemberBusinessViewModel = function (data, accountId) {
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

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

}

var MemberBusinessesViewModel = function (accountId, isAdmin, contactId) {
    var self = this;

    self.accountId = accountId;
    self.contactId = contactId;
    self.isAdmin = isAdmin;

    self.editMode = ko.observable(false);
    self.startEditBusiness = function () {
        self.editMode(true);
    }

    var emptyBusiness = {
        Id: 0,
        AccountId: self.accountId,
        Name: '',
        StreetAddress: '',
        CityStateZip: '',
        EMail: '',
        Phone: '',
        Website: '',
        Description: '',
        ContactId: self.contactId
    };

    self.memberBusinesses = ko.observableArray();
    self.userBusiness = ko.observable(new MemberBusinessViewModel(emptyBusiness, self.accountId));

    self.saveEditBusiness = function (data) {
        
        var url = window.config.rootUri + '/api/MemberBusinessAPI/' + self.accountId;

        if (data.Id() > 0)
            url = url + "/business/" + data.Id();

        $.ajax({
            type: data.Id() > 0 ? "PUT" : "POST",
            url: url,
            data: data.toJS(),
            success: function (sponsor) {
                self.userBusiness().update(sponsor);

                self.editMode(false);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }
    
    self.cancelEditBusiness = function () {
        self.editMode(false);
    }

    self.deleteBusiness = function (data) {

        var url = window.config.rootUri + '/api/MemberBusinessAPI/' + self.accountId + "/business/" + data.Id();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.userBusiness().update(emptyBusiness);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    self.adminDeleteBusiness = function (data) {

        var url = window.config.rootUri + '/api/MemberBusinessAPI/' + self.accountId + "/business/" + data.Id();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.memberBusinesses.remove(data);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    // 3 columns of member business cards.
    self.newBusinessRowClass = function (index) {
        var i = index();
        return (i % 3 == 0);
    }

    self.getMemberBusinesses = function () {

        var url = window.config.rootUri + '/api/MemberBusinessAPI/' + self.accountId + '/memberbusinesses';

        $.ajax({
            type: "GET",
            url: url,
            success: function (sponsors) {
                var mappedSponsors = $.map(sponsors, function (sponsor) {
                    if (sponsor.Id != self.userBusiness().Id()) {
                        sponsor.AccountId = self.accountId;
                        return new MemberBusinessViewModel(sponsor, self.accountId);
                    }
                });

                self.memberBusinesses(mappedSponsors);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    self.getUserBusiness = function () {
        var url = window.config.rootUri + '/api/MemberBusinessAPI/' + self.accountId + '/userbusiness/' + self.contactId;

        $.ajax({
            type: "GET",
            url: url,
            success: function (sponsor) {
                sponsor.AccountId = self.accountId;

                self.userBusiness().update(sponsor);
                self.getMemberBusinesses();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status == 404) {
                    self.getMemberBusinesses();
                }
                else {
                    alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
                }
            }
        });
    }

    self.getUserBusiness();

}
