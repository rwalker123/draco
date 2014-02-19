var HandoutViewModel = function (accountId, isAdmin) {
    var self = this;

    self.selectedFileNameDefaultText = "Select a file or drag/drop a handout here.";

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.selectedFileName = ko.observable(self.selectedFileNameDefaultText);

    self.readyToUpload = ko.observable(false);
    self.isUploading = ko.observable(false);

    self.handouts = ko.observableArray();

    self.handoutDescription = ko.observable('');
    self.viewMode = ko.observable(true);

    self.editHandoutMode = ko.observable(false);

    // using with: currentHandout messes up the editor. Parse
    // out into handoutEdit_XX fixes it.
    self.currentHandout = ko.observable();
    self.handoutEdit_Description = ko.observable('');
    self.handoutEdit_FileName = ko.observable('');
    self.handoutEdit_Id = 0;

    self.initFileUpload = function () {
        var elem = $("#handoutSelectedFileName");

        elem.bind('dragenter', function (e) {
            $(this).addClass('dragover');
        });

        elem.bind('dragleave drop', function (e) {
            $(this).removeClass('dragover');
        });

        $('#handoutupload')
            .fileupload({
                dataType: 'json',
                dropZone: elem,
                url: self.fileUploaderUrl(),
                add: function (e, data) {
                    var ext = self.getFileNameExtension(data.files[0].name);
                    var invalidExtension = $.inArray(ext, ['exe', 'bat', 'com', 'sh']);
                    if (invalidExtension != -1) {
                        return false;
                    }
                    // if we have a selected file, button is already visible.
                    if (!self.readyToUpload()) {
                        $('#handoutUploadBtn').one('click', function () {
                            self.readyToUpload(false);
                            self.isUploading(true);
                            data.submit();
                        });
                    }

                    self.selectedFileName(data.files[0].name);
                    self.readyToUpload(true);
                },
                fail: function (e, data) {
                    alert("Caught error: Status: " + data.jqXHR.status + ". Error: " + data.errorThrown + "\n. responseText: " + data.jqXHR.responseText);

                    self.readyToUpload(true);
                    self.isUploading(false);
                    
                    $('#handoutUploadBtn').one('click', function () {
                        self.readyToUpload(false);
                        self.isUploading(true);
                        data.submit();
                    });
                },
                done: function (e, data) {
                    var handout = data.result;

                    self.handouts.push({
                        Id: handout.Id,
                        HandoutURL: handout.HandoutURL,
                        Description: ko.observable(handout.Description),
                        FileName: ko.observable(handout.FileName),
                        viewMode: ko.observable(true)
                    });


                    self.isUploading(false);
                    self.readyToUpload(false);
                    self.handoutDescription('');
                    self.selectedFileName('');
                }
            })
        .bind('fileuploadsubmit', function (e, data) {
            data.formData = {
                Id: 0,
                Description: self.handoutDescription()
            };
        });
    }

    self.loadHandouts = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/HandoutsAPI/' + self.accountId + '/handouts',
            success: function (handouts) {
                var mappedHandouts = $.map(handouts, function (handout) {
                    return {
                        Id: handout.Id,
                        HandoutURL: handout.HandoutURL,
                        Description: ko.observable(handout.Description),
                        FileName: ko.observable(handout.FileName),
                        viewMode: ko.observable(true)
                    };
                });

                self.handouts(mappedHandouts);

                $('#enterHandoutDescription').wysiwyg({ toolbarSelector: '[data-role=enterHandoutDescription-toolbar]' });
                $('#handoutEditor').wysiwyg({ toolbarSelector: '[data-role=handoutEditor-toolbar]' });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.endHandoutAdd = function () {
        self.viewMode(true);
    }

    self.startHandoutAdd = function () {
        self.viewMode(false);
    }

    self.startHandoutEdit = function (handout) {
        self.currentHandout(handout);
        self.handoutEdit_Description(handout.Description());
        self.handoutEdit_FileName(handout.FileName());
        self.handoutEdit_Id = handout.Id;

        handout.viewMode(false);
        self.editHandoutMode(true);
    }

    self.endHandoutEdit = function (handout) {
        $.each(self.handouts(), function (index, handout) {
            if (handout.Id == self.handoutEdit_Id) {
                handout.viewMode(true);
                return 0;
            }
        });

        self.editHandoutMode(false);

        self.handoutEdit_Description('');
        self.handoutEdit_FileName('');
    }

    self.saveHandout = function (handout) {
        // mouse only changes (select/formatting) aren't picked up by knockoutjs,
        // just grab the html here.
        self.handoutEdit_Description($('#handoutEditor').html());

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/HandoutsAPI/' + self.accountId + '/handouts/' + self.handoutEdit_Id,
            data: {
                Id: self.handoutEdit_Id,
                Description: self.handoutEdit_Description(),
                FileName: self.handoutEdit_FileName()
            },
            success: function (id) {

                // update the handout.
                $.each(self.handouts(), function (index, handout) {
                    if (handout.Id == self.handoutEdit_Id) {
                        handout.Description(self.handoutEdit_Description());
                        handout.FileName(self.handoutEdit_FileName());
                        handout.viewMode(true);
                        return 0;
                    }
                });

                self.handoutEdit_Id = 0;
                self.handoutEdit_Description('');
                self.handoutEdit_FileName('');

                self.editHandoutMode(false);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });


    }

    self.deleteHandout = function (handout) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/HandoutsAPI/' + self.accountId + '/handouts/' + handout.Id,
            success: function (id) {
                self.handouts.remove(function (item) {
                    return item.Id == id;
                });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/Handout';
    }, self);

    self.getFileNameExtension = function (filename) {
        var a = filename.split(".");
        if (a.length === 1 || (a[0] === "" && a.length === 2)) {
            return "";
        }
        return a.pop().toLowerCase();
    }

    self.initFileUpload();
    self.loadHandouts();
};
