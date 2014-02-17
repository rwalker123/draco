var WorkoutsViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.newWorkoutTitle = ko.observable('');
    self.newWorkoutDate = ko.observable('');
    self.newWorkoutTime = ko.observable('');
    self.newWorkoutField = ko.observable('');
    self.newWorkoutDescription = ko.observable('');
    self.workoutAvailableFields = ko.observableArray();
    self.workouts = ko.observableArray();

    self.viewMode = ko.observable(true);

    self.titleMissingError = ko.computed(function () {
        return self.newWorkoutTitle().length == 0;
    }, self);

    self.startWorkoutAdd = function () {
        self.viewMode(false);
    }

    self.stopWorkoutAdd = function () {
        self.viewMode(true);
    }

    self.clearNewData = function () {
        self.newWorkoutTitle('');
        self.newWorkoutDate('');
        self.newWorkoutTime('');
        self.newWorkoutField('');
        self.newWorkoutDescription('');
    }

    self.addNewWorkout = function () {
        if (self.titleMissingError()) {
            return;
        }

        $.ajax({
            type: "POST",
            url: '/api/WorkoutsAPI/' + self.accountId + '/workouts',
            data: {
                Description: self.newWorkoutTitle(),
                WorkoutDate: self.newWorkoutDate(),
                WorkoutTime: self.newWorkoutTime(),
                WorkoutLocation: self.newWorkoutField(),
                Comments: self.newWorkoutDescription()
            },
            success: function (workoutId) {
                self.workouts.push({
                    Id: workoutId,
                    Comments: ko.protectedObservable(self.newWorkoutDescription()),
                    Description: ko.protectedObservable(self.newWorkoutTitle()),
                    WorkoutLocation: ko.protectedObservable(self.newWorkoutField()),
                    WorkoutDate: ko.protectedObservable(moment(self.newWorkoutDate()).format("dddd, MMMM Do YYYY")),
                    WorkoutTime: ko.protectedObservable(moment(self.newWorkoutTime()).format("h:mm a")),
                    NumRegistered: 0,
                    viewMode: ko.observable(true)
                });

                self.clearNewData();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.getAvailableFields = function () {
        $.ajax({
            type: "GET",
            url: '/api/FieldsAPI/' + self.accountId,
            success: function (fields) {
                var mappedFields = $.map(fields, function (field) {
                    return {
                        Id: field.Id,
                        Name: field.Name
                    };
                });

                self.workoutAvailableFields(mappedFields);

                $('#newWorkoutField').selectpicker();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });

    }

    self.loadWorkoutAnnouncements = function () {
        var url = '/api/WorkoutsAPI/' + self.accountId + '/';
        if (self.isAdmin)
            url += 'workouts';
        else
            url += 'activeworkouts';

        $.ajax({
            type: "GET",
            url: url,
            success: function (workouts) {
                var mappedFields = $.map(workouts, function(workout) {
                    return {
                        Id: workout.Id,
                        Comments: ko.protectedObservable(workout.Comments),
                        Description: ko.protectedObservable(workout.Description),
                        WorkoutLocation: ko.protectedObservable(workout.WorkoutLocation),
                        WorkoutDate: ko.protectedObservable(moment(workout.WorkoutDate).format("dddd, MMMM Do YYYY")),
                        WorkoutTime: ko.protectedObservable(moment(workout.WorkoutTime).format("h:mm a")),
                        NumRegistered: workout.NumRegistered,
                        viewMode: ko.observable(true)
                    }
                });

                self.workouts(mappedFields);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });

    }

    self.getAvailableFields();
    self.loadWorkoutAnnouncements();

    $('#newWorkoutEditControl').wysiwyg({ toolbarSelector: '[data-role=newWorkoutEditControl-toolbar]' });
    $('#newWorkoutTime').timepicker({
        minuteStep: 5,
        showInputs: false,
        disableFocus: true
    });
};
