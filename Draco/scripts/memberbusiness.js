function initMemberBusinessViewModel(accountId, isAdmin, contactId) {

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

    self.memberBusinesses = ko.observableArray();
    self.userBusiness = ko.observable(new MemberBusinessViewModel({
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
    }, self.accountId));

    self.saveEditBusiness = function (data) {
        
        var url = '';
    }

    self.getMemberBusinesses = function () {

        var url = window.config.rootUri + '/api/MemberBusinessAPI/' + self.accountId;

        $.ajax({
            type: "GET",
            url: url,
            success: function (sponsors) {
                var mappedSponsors = $.map(sponsors, function (sponsor) {
                    return new MemberBusinessViewModel(sponsor, self.accountId);
                });

                self.memberBusinesses(mappedSponsors);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

    }

    self.getMemberBusinesses();

}
