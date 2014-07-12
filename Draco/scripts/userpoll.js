function initUserPollViewModel(accountId, isAdmin) {

    var userPollElem = document.getElementById("userPollView");
    if (userPollElem) {
        var userPollVM = new UserPollViewModel(accountId, isAdmin);
        ko.applyBindings(userPollVM, userPollElem);
    }
}

var PollViewModel = function (data, accountId) {
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


var UserPollViewModel = function (data, accountId) {
    var self = this;

    self.accountId = accountId;

    self.userPolls = ko.observableArray();
    self.editPollMode = ko.observable(false);

    self.emptyPoll = {
        Id: 0,
        AccountId: self.accountId,
        Question: '',
        Active: false
    };

    self.currentPoll = ko.observable(new PollViewModel(self.emptyPoll, self.accountId));
}
