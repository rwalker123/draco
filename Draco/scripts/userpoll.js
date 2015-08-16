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

	self.transformDataToResults = function(poll) {
		if (!poll || !poll.Options)
			return poll;

		$.each(poll.Options, function(index, option) {
			var result = ko.utils.arrayFirst(poll.Results, function (result) {
				return result.OptionId == option.Id;
			});

			// need to add options that have no votes to results.
			if (result) {
				result.OptionText = option.OptionText;
			} else {
				result = {}
				result.OptionId = option.Id;
				result.OptionText = option.OptionText;
				result.TotalVotes = 0;

				poll.Results.splice(index, 0, result);
			}
		});

		return poll;
	}
    
	data = self.transformDataToResults(data);

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

    self.Results.NewOptionText = ko.observable();

    self.addOption = function () {
        if (!self.Results.NewOptionText())
            return;

        self.Results.push(new PollOptionViewModel({
            OptionId: 0,
            OptionText: self.Results.NewOptionText()
        }));

        self.Results.NewOptionText('');
    }

    self.removeOption = function (option) {
        if (option.TotalVotes() > 0) {
            $("#deleteUserPollOptionModal").modal("show");

            $("#confirmOptionDeleteBtn").one("click", function () {
                self.Results.remove(option);
            });

        }
        else {
            self.Results.remove(option);
        }
    }

    self.moveOptionUp = function (option) {
        var index = self.Results.indexOf(option);
        if (index > 0) {
            self.Results.remove(option);
            self.Results.splice(index - 1, 0, option);
        }
    }

    self.moveOptionDown = function (option) {
        var index = self.Results.indexOf(option);
        if (index < self.Results().length - 1) {
            self.Results.remove(option);
            self.Results.splice(index + 1, 0, option);
        }
    }

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
		data = self.transformDataToResults(data);

        self.totalVotes(0);
        ko.mapping.fromJS(data, self);
    }

	self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

	self.toOptionsJS = function () {
		var js = ko.mapping.toJS(self);

		if(js.hasOwnProperty("Results")){
            js.Options = js.Results;
            delete js.Results;
        }

        $.each(js.Options, function (index, option) {
			option.Id = option.OptionId;
			delete option.OptionId;	
		});

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
        Active: true,
        Results: [],
        HasVoted: false,
        OptionSelected: ''
    };

    self.currentPoll = ko.observable(new PollViewModel(self.emptyPoll, self.accountId, self.contactId));

    self.newPoll = function () {
        self.currentPoll().update(self.emptyPoll);
        self.editPollMode(!self.editPollMode());
    }

    self.cancelEdit = function () {
        self.currentPoll().update(self.emptyPoll);
        self.editPollMode(false);
    }

    self.saveChanges = function (userPoll) {
        if (userPoll.Id()) {
            self.updatePoll(userPoll);
        }
        else {
            self.addPoll(userPoll);
        }
    }

    self.updatePoll = function (userPoll) {
        var data = userPoll.toOptionsJS();
        if (!data.OptionSelected)
            data.OptionSelected = 0;

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/UserPollAPI/' + self.accountId + '/polls/' + data.Id,
            data: data,
            success: function (pollData) {
                var poll = ko.utils.arrayFirst(self.userPolls(), function (item) {
                    return item.Id() == pollData.Id;
                });

                if (poll)
                    poll.update(pollData);

                self.cancelEdit();
            },
            error: function (a, b, c) {
                if (a.responseJSON && a.responseJSON.ModelState) {
                    var ms = a.responseJSON.ModelState;
                    for (var prop in ms) {
                        if (ms.hasOwnProperty(prop))
                            alert(ms[prop]);
                    }
                }
			}
        });
    }

    self.addPoll = function (userPoll) {
        var data = userPoll.toJS();
        data.OptionSelected = 0;

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/UserPollAPI/' + self.accountId + '/polls',
            data: data,
            success: function (pollData) {
                self.userPolls.push(new PollViewModel(pollData, self.accountId, self.contactId));
                self.cancelEdit();
            }
        });
    }

    self.editPoll = function (poll) {
        self.currentPoll().update(poll.toJS());
        self.editPollMode(true);
    }

    self.deletePoll = function (poll) {
        $("#deleteUserPollModal").modal("show");

        $("#confirmDeleteBtn").one("click", function () {
            self.performDeletePoll(poll);
        });
    }

    self.performDeletePoll = function (poll) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/UserPollAPI/' + self.accountId + '/polls/' + poll.Id(),
            success: function () {
                self.userPolls.remove(poll);
            }
        });
    }

    self.showInactivePolls = ko.observable(false);
    self.toggleInactivePolls = function () {

        self.cancelEdit();
        self.showInactivePolls(!self.showInactivePolls());

        self.getUserPolls();
    }

    self.getUserPolls = function () {
        var url;

        if (self.showInactivePolls())
            url = window.config.rootUri + '/api/UserPollAPI/' + self.accountId + '/polls';
        else
            url = window.config.rootUri + '/api/UserPollAPI/' + self.accountId + '/activepolls';

        self.userPolls(null);

        $.ajax({
            type: "GET",
            url: url,
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
