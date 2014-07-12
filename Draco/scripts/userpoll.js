function initUserPollViewModel(accountId, isAdmin, contactId) {

    var userPollElem = document.getElementById("userPollView");
    if (userPollElem) {
        var userPollVM = new UserPollViewModel(accountId, isAdmin, contactId);
        ko.applyBindings(userPollVM, userPollElem);
    }
}

var PollOptionViewModel = function (data) {
    var self = this;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
        //'Results': {
        //    create: function (options) {
        //        self.totalVotes(self.totalVotes() + options.data.TotalVotes);
        //        return new PollOptionViewModel(options.data);
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

var PollViewModel = function (data, accountId, contactId) {
    var self = this;

    self.accountId = accountId;
    self.contactId = contactId;

    self.totalVotes = ko.observable(0);

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
        'Results': {
            create: function (options) {
                self.totalVotes(self.totalVotes() + options.data.TotalVotes);
                return new PollOptionViewModel(options.data);
            },
        //    update: function (options) {
        //        return options.data;
        //    }
        }
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.OptionSelected.NewOption = ko.observable();
    self.OptionSelected.Text = ko.computed(function () {
        var selectedOption = ko.utils.arrayFirst(self.Results(), function (item) {
            return item.OptionId() == self.OptionSelected();
        });

        if (selectedOption)
            return selectedOption.OptionText();
        else
            return '';

    });

    self.vote = function () {
        if (!self.OptionSelected.NewOption())
        {
            alert("select an option, then click vote");
            return;
        }

        self.recordVote(function () {
            self.totalVotes(self.totalVotes() + 1);
            self.HasVoted(true);
            self.OptionSelected(self.OptionSelected.NewOption());

            self.OptionSelected.NewOption('');

            // increase total votes in selected option
            var selectedOption = ko.utils.arrayFirst(self.Results(), function (item) {
                return item.OptionId() == self.OptionSelected();
            });

            if (selectedOption) {
                selectedOption.TotalVotes(selectedOption.TotalVotes() + 1);
            }
        });
    }


    self.revote = function () {
        if (!self.OptionSelected.NewOption()) {
            alert("select an option, then click vote");
            return;
        }

        self.recordVote(function () {
            if (self.OptionSelected() == self.OptionSelected.NewOption()) {
                self.OptionSelected.NewOption('');
                return;
            }

            // decrease total votes in selected option
            var selectedOption = ko.utils.arrayFirst(self.Results(), function (item) {
                return item.OptionId() == self.OptionSelected();
            });

            if (selectedOption) {
                selectedOption.TotalVotes(selectedOption.TotalVotes() - 1);
            }

            // set to new value.
            self.OptionSelected(self.OptionSelected.NewOption());
            self.OptionSelected.NewOption('');

            // increase total votes in selected option
            var selectedOption = ko.utils.arrayFirst(self.Results(), function (item) {
                return item.OptionId() == self.OptionSelected();
            });

            if (selectedOption) {
                selectedOption.TotalVotes(selectedOption.TotalVotes() + 1);
            }
        });
    }

    self.recordVote = function (callback) {
        var url = window.config.rootUri + '/api/UserPollAPI/' + self.accountId + '/recordVote/' + self.Id();

        $.ajax({
            type: "PUT",
            url: url,
            data: {
                ContactId: self.contactId,
                QuestionId: self.Id(),
                OptionId: self.OptionSelected.NewOption()
            },
            success: function () {
                callback();
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


var UserPollViewModel = function (accountId, isAdmin, contactId) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.contactId = contactId;

    self.userPolls = ko.observableArray();
    self.editPollMode = ko.observable(false);

    self.emptyPoll = {
        Id: 0,
        AccountId: self.accountId,
        Question: '',
        Active: false,
        Results: [],
        HasVoted: false,
        OptionSelected: ''
    };

    self.currentPoll = ko.observable(new PollViewModel(self.emptyPoll, self.accountId, self.contactId));

    self.getUserPolls = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/UserPollAPI/' + self.accountId + '/activepolls',
            success: function (polls) {
                var pollsMap = $.map(polls, function (poll) {
                    return new PollViewModel(poll, self.accountId, self.contactId);
                });

                self.userPolls(pollsMap);
            }
        });
    }

    self.getUserPolls();
}
