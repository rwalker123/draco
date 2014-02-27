var WorkoutRegistrantViewModel = function (parent) {
    var self = this;

    self.Id = ko.observable(0);
    self.Phone = ko.observable('');
    self.Name = ko.observable('');
    self.Age = ko.observable('');
    self.Positions = ko.observable('');
    self.Email = ko.observable('');
    self.interestInManage = ko.observable(false);
    self.whereHeardOption = ko.observable('');
    self.parent = parent;

    self.removeRegistrant = function () {
        alert('not implemented');
    }

    self.editRegistrant = function () {
        alert('not implemented');
    }
}

var WorkoutViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.Id = ko.observable('');
    self.WorkoutDate = ko.protectedObservable('');
    self.DisplayDate = ko.computed(function () {
        return moment(self.WorkoutDate()).format("dddd, MMMM Do YYYY");
    })
    self.WorkoutTime = ko.protectedObservable('');
    self.WorkoutLocation = ko.protectedObservable('0');
    self.WorkoutField = ko.protectedObservable('');
    self.Comments = ko.protectedObservable('');
    self.Description = ko.protectedObservable('');

    self.fieldUrl = ko.computed(function () {
        return window.config.rootUri + '/baseball/fields/index/' + self.accountId + '/' + self.WorkoutLocation();
    });

    self.sendEmail = ko.observable(false);
    self.emailText = ko.observable();
    self.emailSubject = ko.observable();

    self.NumRegistered = ko.observable('0');
    self.registerForWorkout = ko.observable(false);
    self.viewMode = ko.observable(true);
    self.editRegistrantsMode = ko.observable(false);

    self.registerData = new WorkoutRegistrantViewModel(self);
    self.workoutRegistrants = ko.observableArray();

    self.sendEmailMode = function () {
        self.viewMode(false); 
        self.editRegistrantsMode(false); 
        self.sendEmail(true); 
    }

    self.stopRegistrantEdit = function () {
        self.editRegistrantsMode(false);
        self.viewMode(true);
    }

    self.editRegistrants = function () {
        if (self.editRegistrantsMode())
            return;

        if (self.NumRegistered() == 0)
            return;

        self.editRegistrantsMode(true);
        self.viewMode(false);
        self.sendEmail(false);

        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/registrants/' + self.Id(),
            success: function (regs) {
                var mappedRegs = $.map(regs, function (reg) {
                    var regvm = new WorkoutRegistrantViewModel(self);
                    regvm.Id(reg.Id);
                    regvm.Phone(reg.Phone1);
                    regvm.Name(reg.Name);
                    regvm.Age(reg.Age);
                    regvm.Positions(reg.Positions);
                    regvm.Email(reg.Email);
                    regvm.interestInManage(reg.WantToManager);
                    regvm.whereHeardOption(reg.WhereHeard);

                    return regvm;
                });

                self.workoutRegistrants(mappedRegs);
 
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });

    }

    self.cancelSendEmail = function () {
        self.sendEmail(false);
        self.viewMode(true);

        self.emailSubject('');
        self.emailText('');

        // tinyMCE editor will not bind two-ways, have to manually set the control
        // when changing the data model.
        tinymce.get(self.Id() + '_workoutEmailEditor').setContent('');
    }

    self.sendEmailToRegistrants = function () {
        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/email/' + self.Id(),
            data: {
                Subject: self.emailSubject(),
                Message: self.emailText(),
            },
            success: function (result) {
                if (result)
                    alert("Could not send to the following: " + result);
                else
                    alert('email sent.');

                self.cancelSendEmail();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.startRegisterForWorkout = function () {
        self.registerForWorkout(true);
    }

    self.registerWorkoutData = function (w) {

        if (!w.Name()) {
            alert("Please enter your name.");
            return;
        }

        if (!w.Age()) {
            alert("Please enter your age.");
            return;
        }

        if (!w.Email()) {
            alert("Please enter an email address.")
        }

           
        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/register/' + w.parent.Id(),
            data: {
                Phone1: w.Phone(),
                Name: w.Name(),
                Age: w.Age(),
                Positions: w.Positions(),
                Email: w.Email(),
                WantToManage: w.interestInManage(),
                whereHeard: w.whereHeardOption()
            },
            success: function (workoutId) {
                self.registerForWorkout(false);
                alert('You are now registered for the workout.');
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });

    }

    self.endRegisterForWorkout = function () {
        this.registerForWorkout(false);
    }

    self.commit = function () {
        self.WorkoutDate.commit();
        self.WorkoutTime.commit();
        self.WorkoutLocation.commit();
        self.WorkoutField.commit();
        self.Comments.commit();
        self.Description.commit();
    }

    self.clearData = function () {

        self.WorkoutDate('');
        self.WorkoutTime('');
        self.WorkoutLocation('0');
        self.WorkoutField('');
        self.Description('');
        self.Comments('');

        self.commit();
    }
}

var WorkoutsViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.workoutAvailableFields = ko.observableArray();
    self.workouts = ko.observableArray();
    self.whereHeardOptions = ko.observableArray();
    self.newWhereHeardName = ko.observable();
    
    self.viewMode = ko.observable(true);
    self.editWorkoutMode = ko.observable(false);
    self.editWhereHeard = ko.observable(false);

    self.newWorkout = new WorkoutViewModel(self.accountId, self.isAdmin);

    // track whether we are editing a "new" workout or an existing workout.
    self.currentEditWorkout = ko.observable(self.newWorkout);

    self.startWorkoutWhereHeardEdit = function () {
        if (self.editWhereHeard()) {
            self.stopWorkoutWhereHeardAdd();
        }
        else {
            self.stopWorkoutAdd();
            self.editWhereHeard(true);
        }
    }

    self.startWorkoutAdd = function () {
        if (self.viewMode()) {
            self.stopWorkoutWhereHeardAdd();
            self.currentEditWorkout(self.newWorkout);
            self.viewMode(false);
        }
        else
            self.stopWorkoutAdd();
    }

    self.stopWorkoutAdd = function () {
        self.viewMode(true);
    }

    self.stopWorkoutWhereHeardAdd = function () {
        self.editWhereHeard(false);
    }

    self.getAvailableFields = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/FieldsAPI/' + self.accountId,
            success: function (fields) {
                var mappedFields = $.map(fields, function (field) {
                    return {
                        Id: field.Id,
                        Name: field.Name
                    };
                });

                self.workoutAvailableFields(mappedFields);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            },
            complete: function () {
                // load workouts after fields so field name can be used.
                self.loadWorkoutAnnouncements();
            }
        });

    }

    self.getWhereHeardOptions = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/whereheard',
            success: function (options) {
                self.whereHeardOptions(options);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.addNewWhereHeard = function () {
        var stringList = $.map(self.whereHeardOptions(), function (option) {
            return option;
        });

        stringList.push(self.newWhereHeardName())

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/whereheard',
            data: {
                WhereHeardList: stringList
            },
            success: function (whereHeard) {
                self.whereHeardOptions.push(self.newWhereHeardName());

                self.whereHeardOptions.sort();
                self.newWhereHeardName('');
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.removeWhereHeard = function (o) {
        var stringList = $.map(self.whereHeardOptions(), function (option) {
            return option;
        });

        var index = stringList.indexOf(o);
        if (index == -1)
            return;

        stringList.splice(index, 1);

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/whereheard',
            data: {
                WhereHeardList: stringList
            },
            success: function (whereHeard) {
                self.whereHeardOptions.remove(o);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.getFieldName = function (fieldId) {
        var result = $.grep(self.workoutAvailableFields(), function (e) { return e.Id == fieldId });
        if (result.length == 0)
            return '';
        else
            return result[0].Name;
    }

    self.addNewWorkout = function (w) {
        var type;

        if (self.editWorkoutMode())
            type = "PUT";
        else
            type = "POST";

        if (w.Description.uncommitValue().length <= 0) {
            alert("enter a title");
            return;
        }

        if (!w.WorkoutDate.uncommitValue()) {
            alert("enter a workout date");
            return;
        }

        if (!w.WorkoutTime.uncommitValue()) {
            alert("enter a workout time");
            return;
        }

        $.ajax({
            type: type,
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/workouts',
            data: {
                Id: w.Id() || 0,
                Description: w.Description.uncommitValue(),
                WorkoutDate: w.WorkoutDate.uncommitValue(),
                WorkoutTime: w.WorkoutTime.uncommitValue(),
                WorkoutLocation: w.WorkoutLocation.uncommitValue(),
                Comments: w.Comments.uncommitValue()
            },
            success: function (workoutId) {
                w.WorkoutField(self.getFieldName(w.WorkoutLocation.uncommitValue()));
                w.commit();

                if (!self.editWorkoutMode()) {
                    var workout = new WorkoutViewModel(self.accountId, self.isAdmin);

                    workout.Id(workoutId);
                    workout.Comments(w.Comments());
                    workout.Description(w.Description());
                    workout.WorkoutLocation(w.WorkoutLocation());
                    workout.WorkoutDate(new Date(w.WorkoutDate()));
                    workout.WorkoutTime(w.WorkoutTime());
                    workout.WorkoutField(self.getFieldName(workout.WorkoutLocation.uncommitValue()));

                    workout.commit();

                    self.workouts.push(workout);

                    w.clearData();

                    // tinyMCE editor will not bind two-ways, have to manually set the control
                    // when changing the data model.
                    tinymce.get('workoutEditor').setContent('');
                }
                else
                    self.cancelEditMode();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.postTwitter = function (workout) {
        alert("not implemented");
    }

    self.editWorkout = function (workout) {
        self.currentEditWorkout(workout);
        self.editWorkoutMode(true);
        self.viewMode(false);
    }

    self.cancelEditMode = function () {
        if (self.editWorkoutMode()) {
            self.editWorkoutMode(false);
            self.viewMode(true);
        }
        else {
            self.newWorkout.commit();
            self.newWorkout.clearData();
        }
    }

    self.deleteWorkout = function (workout) {

        $("#deleteWorkoutModal").modal("show");

        $("#confirmWorkoutDeleteBtn").one("click", function () {
            self.makeWorkoutDeleteCall(workout)
        });
    }

    self.makeWorkoutDeleteCall = function (workout) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/workouts/' + workout.Id(),
            success: function (workoutId) {
                self.workouts.remove(workout);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });

    }

    self.loadWorkoutAnnouncements = function () {
        var url = window.config.rootUri + '/api/WorkoutsAPI/' + self.accountId + '/';
        if (self.isAdmin)
            url += 'workouts';
        else
            url += 'activeworkouts';

        $.ajax({
            type: "GET",
            url: url,
            success: function (workouts) {
                var mappedFields = $.map(workouts, function (w) {
                    var workout = new WorkoutViewModel(self.accountId, self.isAdmin);
                    
                    workout.Id(w.Id);
                    workout.Comments(w.Comments);
                    workout.Description(w.Description);
                    workout.WorkoutLocation(w.WorkoutLocation);
                    workout.WorkoutDate(w.WorkoutDate);
                    workout.WorkoutTime(moment(w.WorkoutTime).format("h:mm a"));
                    workout.WorkoutField(self.getFieldName(w.WorkoutLocation));
                    workout.NumRegistered(w.NumRegistered);
                    workout.commit();

                    return workout;
                });

                self.workouts(mappedFields);
                self.getWhereHeardOptions();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });

    }

    self.getAvailableFields();
};
