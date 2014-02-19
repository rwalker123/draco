function InitViewModels(accountId, accountName, firstYear, twitterAccountName, facebookFanPage, showPhotoGallery, isAdmin ) {
    var editAccountVM = new EditAccountNameViewModel(accountId, accountName, firstYear, twitterAccountName);
    ko.applyBindings(editAccountVM, document.getElementById("accountName"));

    var twitterFeed = document.getElementById("twitterFeed");
    if (twitterFeed) {
        var twitterVM = new TwitterViewModel(accountId, isAdmin);
        ko.applyBindings(twitterVM, twitterFeed);
        twitterVM.loadTwitterScript();
    }

    var facebookFeed = document.getElementById("facebookFeed");
    if (facebookFeed) {
        var facebookVM = new FacebookViewModel(accountId, facebookFanPage, isAdmin);
        ko.applyBindings(facebookVM, facebookFeed);
    }

    if (showPhotoGallery) {
        var photoGalleryVM = new PhotoGalleryViewModel(accountId, isAdmin);
        photoGalleryVM.init();
        ko.applyBindings(photoGalleryVM, document.getElementById("photoGallery"));
    }
}

// edit account name
var EditAccountNameViewModel = function (accountId, accountName, firstYear, twitterAccountName) {
    var self = this;
    self.accountId = accountId;

    self.name = ko.protectedObservable(accountName);
    self.firstYear = ko.protectedObservable(firstYear);
    self.twitterAccount = ko.protectedObservable(twitterAccountName);
    self.viewMode = ko.observable(true);
    self.hasYear = ko.computed(function() {
        return !!self.firstYear;
    });

    self.availableYears = [];

    self.fillYears = function() {
        var numYears = 100;
        var dt = (new Date()).getFullYear();

        for (var i = 0; i < numYears; ++i)
        {
            self.availableYears.push(dt);
            --dt;
        }
    }

    self.fillYears();

    self.editAccountName = function () {
        self.viewMode(false);
    }
    self.saveAccountName = function () {

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/AccountAPI/' + accountId + '/AccountName',
            data: {
                Id: self.name.uncommitValue(),
                Year: self.firstYear.uncommitValue(),
                TwitterAccount: self.twitterAccount.uncommitValue()
            },
            success: function (accountName) {
                if (self.twitterAccount.uncommitValue() != self.twitterAccount())
                    window.location.reload();
                else {
                    self.commitChanges();
                    self.viewMode(true);
                    window.location.hash = 'update';
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.cancelEdit = function () {
        self.resetChanges();
        self.viewMode(true);
    }


    self.commitChanges = function () {
        self.doAction(self, "commit");
        self.doAction(self.details, "commit");
    }

    self.resetChanges = function () {
        self.doAction(self, "reset");
        self.doAction(self.details, "reset");
    }

    self.doAction = function (target, action) {
        for (var key in target) {
            var prop = target[key];
            if (ko.isWriteableObservable(prop) && prop[action]) {
                prop[action]();
            }
        }
    }
}

// twitter view model
var TwitterViewModel = function (accountId, isAdmin) {
    var self = this;
    
    self.accountId = accountId;
    self.isAdmin = isAdmin;

    // twitter script displayed in input field.
    self.twitterScript = ko.observable();

    // twitter script in div element that renders the twitter page.
    self.htmlTwitterScript = ko.observable();

    self.displayTwitterFeed = ko.computed(function () {
        return (self.isAdmin || self.htmlTwitterScript())
    }, self);

    self.loadTwitterScript = function () {
        $.ajax({
            type: "GET",
            dataType: "json",
            url: window.config.rootUri + '/api/AccountAPI/' + self.accountId + '/TwitterScript',
            success: function (data) {
                self.htmlTwitterScript(data);
                setTimeout(function () {
                    twttr.widgets.load();
                }, 1000);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.saveTwitterScript = function () {
        $.ajax({
            type: "PUT",
            dataType: "json",
            url: window.config.rootUri + '/api/AccountAPI/' + self.accountId + '/SaveTwitterScript',
            data: {
                Script: self.twitterScript()
            },
            success: function (data) {
                self.htmlTwitterScript(self.twitterScript());
                twttr.widgets.load();
                self.twitterScript('');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("Caught error: Status: " + jqXHR.status + ". Error: " + errorThrown);
            }
        });
    }
}

// facebook fan page
var FacebookViewModel = function (accountId, fanPage, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.isEditMode = ko.observable(false);

    self.fanPage = ko.observable(fanPage);
    self.editFanPage = ko.observable(fanPage);

    self.fanPageUrl = ko.computed(function () {
        return 'http://www.facebook.com/' + self.fanPage();
    }, self);

    self.isVisible = ko.computed(function () {
        return (self.fanPage() || self.isAdmin);
    }, self);

    self.saveFanPage = function () {
        self.fanPage(self.editFanPage);
    }

    self.cancelSaveFanPage = function () {
        self.editFanPage(self.fanPage);
    }
}

// you tube view model
var youTubeViewModel = function(accountId, id) {
    var self = this;

    self.accountId = accountId;

    // declare ko stuff here, otherwise it is static to the class.
    self.userId = ko.observable(id);
    self.viewMode = ko.observable(true);
    self.videosVisible = ko.observable(true); 
    self.viewUserId = ko.computed(function() {
        if (!self.userId()) {
            return '{enter a YouTube id}';
        }

        return self.userId();
    }, this);

    self.editYouTube = function () {
        self.savedId = self.userId();
        self.viewMode(false);
    }

    self.saveUserId = function () {
        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/AccountAPI/' + self.accountId + '/YouTubeUserId',
            data: {
                Id: self.userId()
            },
            success: function (userId) {
                loadVideos(userId);
                self.viewMode(true);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.resetUserId = function () {
        self.userId(self.savedId);
        self.viewMode(true);
    }
}

var PhotoGalleryViewModel = function (accountId, isAdmin) {
    var self = this;

    self.selectedFileNameDefaultText = "Select a file or drag/drop an image here.";

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.viewMode = ko.observable(true);
    self.selectedFileName = ko.observable(self.selectedFileNameDefaultText);
    self.photoGalleryVisible = ko.observable(true);
    self.photoGalleryTitle = ko.observable("");
    self.photoGalleryCaption = ko.observable("");
    self.photoGalleryItemsCount = ko.observable();
    self.selectedPhotoAlbum = ko.observable();
    self.photoGalleryItems = ko.observableArray();
    self.photoAlbums = ko.observableArray();
    self.newPhotoAlbumName = ko.observable();

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/PhotoGallery';
    }, self);

    self.init = function () {
        if (self.isAdmin)
            self.loadPhotoAlbums();

        self.loadPhotos();
        self.initFileUpload();
    }

    self.deletePhotoAlbum = function () {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId + '/albums/' + self.selectedPhotoAlbum(),
            success: function (id) {
                self.photoAlbums.remove(function (item)
                {
                    return item.id == id;
                });
                $('#photoAlbumSelect').selectpicker('refresh');
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.addPhotoAlbum = function () {
        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId + '/albums',
            data: {
                Id: self.newPhotoAlbumName()
            },
            success: function (photoAlbum) {
                var album = {
                    name: photoAlbum.Title,
                    id: photoAlbum.Id
                };

                self.photoAlbums.push(album);

                self.selectedPhotoAlbum(photoAlbum.Id);
                self.newPhotoAlbumName("");
                $('#photoAlbumSelect').selectpicker('refresh');
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.startEditMode = function () {
        if (self.isAdmin)
            self.viewMode(false);
    }

    self.endEditMode = function () {
        self.viewMode(true);
    }

    self.getFileNameExtension = function (filename) {
        var a = filename.split(".");
        if (a.length === 1 || (a[0] === "" && a.length === 2)) {
            return "";
        }
        return a.pop().toLowerCase();
    }

    self.editPhoto = function (photo) {
        photo.viewMode(false);
        $('#photoGalleryCarousel').carousel('pause');
    }

    self.savePhoto = function (photo) {
        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId + '/photos/' + photo.Id,
            data: {
                Id: photo.Id,
                Title: photo.photoHeading.uncommitValue(),
                Caption: photo.photoCaption.uncommitValue(),
                AlbumId: photo.photoAlbumId.uncommitValue()
            },
            success: function (photoAlbum) {
                photo.photoHeading.commit();
                photo.photoCaption.commit();
                photo.photoAlbumId.commit();
                photo.viewMode(true);
                $('#photoGalleryCarousel').carousel('cycle');
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.endEditPhoto = function (photo) {
        photo.photoHeading.reset();
        photo.photoCaption.reset();
        photo.photoAlbumId.reset();
        photo.viewMode(true);
        $('#photoGalleryCarousel').carousel('cycle');
    }

    self.deletePhoto = function (photo) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId + '/photos/' + photo.Id,
            success: function (id) {

                photo.Id = -1;
                photo.photoHeading("[deleted]");
                photo.photoHeading.commit();
                photo.photoCaption("");
                photo.photoCaption.commit();
                photo.viewMode(true);
                // DELETING was messing up control. For now, just
                // mark it deleted and it will be gone the next refresh
                // of page.
                //self.photoGalleryItems.remove(function (item)
                //{
                //    return item.Id == id;
                //});
                //var count = self.photoGalleryItemsCount();
                //--count;
                //self.photoGalleryItemsCount(count);

            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });

    }

    self.loadPhotos = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId + '/photos',
            success: function (photos) {
                var count = 0;
                var mappedPhotos = $.map(photos, function (photo) {
                    ++count;
                    return {
                        Id: photo.Id,
                        photoUrl: photo.PhotoURL,
                        photoHeading: ko.protectedObservable(photo.Title),
                        photoCaption: ko.protectedObservable(photo.Caption),
                        photoAlbumId: ko.protectedObservable(photo.AlbumId),
                        viewMode: ko.observable(true)
                    };
                });

                self.photoGalleryItems(mappedPhotos);
                self.photoGalleryItemsCount(count);

                $('.photoGalleryItemAlbum').selectpicker();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }

    self.initFileUpload = function () {
        var elem = $("#photoGallerySelectedFileName");

        elem.bind('dragenter', function (e) {
            $(this).addClass('dragover');
        });

        elem.bind('dragleave drop', function (e) {
            $(this).removeClass('dragover');
        });

        $('#photogalleryupload')
            .fileupload({
                dataType: 'json',
                dropZone: elem,
                url: self.fileUploaderUrl(),
                add: function (e, data) {
                    var ext = self.getFileNameExtension(data.files[0].name);
                    var validExtension = $.inArray(ext, ['gif', 'jpeg', 'jpg', 'png', 'bmp']);
                    if (validExtension == -1) {
                        return false;
                    }
                    // if we have a selected file, button is already visible.
                    if (self.selectedFileName() == self.selectedFileNameDefaultText ||
                        self.selectedFileName() == '') {
                        data.context = $('<button/>')
                            .text('Upload')
                            .attr('class', 'btn btn-primary')
                            .appendTo($('#pg'))
                            .click(function () {
                                data.context = $('<p/>').text('Uploading...').replaceAll($(this));
                                data.submit();
                            });
                    }

                    self.selectedFileName(data.files[0].name);
                },
                fail: function (e, data) {
                    alert("Caught error: Status: " + data.jqXHR.status + ". Error: " + data.errorThrown + "\n. responseText: " + data.jqXHR.responseText);
                    $('#pg').html('');
                    data.context = $('<button/>')
                        .text('Upload')
                        .attr('class', 'btn btn-primary')
                        .appendTo($('#pg'))
                        .click(function () {
                            data.context = $('<p/>').text('Uploading...').replaceAll($(this));
                            data.submit();
                        });
                },
                done: function (e, data) {
                    if (data.result) {

                        var photo = data.result;

                        self.photoGalleryItemsCount(self.photoGalleryItemsCount() + 1);
                        self.photoGalleryItems.push({
                            Id: photo.Id,
                            photoUrl: photo.PhotoURL,
                            photoHeading: ko.protectedObservable(photo.Title),
                            photoCaption: ko.protectedObservable(photo.Caption),
                            photoAlbumId: ko.protectedObservable(photo.AlbumId),
                            viewMode: ko.observable(true),
                        });

                        $('.photoGalleryItemAlbum').selectpicker();

                        self.selectedFileName(self.selectedFileNameDefaultText);
                        self.photoGalleryCaption("");
                        self.photoGalleryTitle("");
                        $("#pg").html('');
                    }
                }
            })
        .bind('fileuploadsubmit', function (e, data) {
            data.formData = {
                Id: 0,
                Title: self.photoGalleryTitle(),
                Caption: self.photoGalleryCaption(),
                AlbumId: self.selectedPhotoAlbum()
            };
        });
    }

    self.loadPhotoAlbums = function () {
        $.ajax({
            type: "GET",
            url: window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId + '/albums',
            success: function (photoAlbums) {
                var mappedAlbums = $.map(photoAlbums, function (album) {
                    return {
                        name: album.Title,
                        id: album.Id
                    };
                });
                
                self.photoAlbums(mappedAlbums);
                self.photoAlbums.unshift({
                    name: 'default',
                    id: 0
                });

                self.selectedPhotoAlbum(0);
                $('#photoAlbumSelect').selectpicker();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status == 404)
                    return;

                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + "\n. responseText: " + xhr.responseText);
            }
        });
    }
}
