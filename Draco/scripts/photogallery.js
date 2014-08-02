function InitPhotoGalleryViewModel(accountId, isAdmin, teamId) {
    var photoGalleryElem = document.getElementById("photoGallery");
    if (photoGalleryElem) {
        var photoGalleryVM = new PhotoGalleryViewModel(accountId, isAdmin, teamId);
        photoGalleryVM.init();
        ko.applyBindings(photoGalleryVM, photoGalleryElem);
    }
}

var PhotoViewModel = function (data) {
    var self = this;

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

    self.viewMode = ko.observable(true);

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var PhotoGalleryViewModel = function (accountId, isAdmin, teamId) {
    var self = this;

    self.selectedFileNameDefaultText = "Select a file or drag/drop an image here.";

    self.accountId = accountId;
    self.teamId = teamId;
    self.isAdmin = isAdmin;
    self.viewMode = ko.observable(true);
    self.selectedFileName = ko.observable(self.selectedFileNameDefaultText);
    self.photoGalleryTitle = ko.observable("");
    self.photoGalleryCaption = ko.observable("");
    self.photoGalleryItemsCount = ko.observable();
    self.selectedPhotoAlbum = ko.observable();
    self.selectedPhotoAlbum.subscribe(function () {
        self.loadPhotos();
    });
    self.selectedEditPhotoAlbum = ko.observable();
    self.photoGalleryItems = ko.observableArray();
    self.photoAlbums = ko.observableArray();
    self.editablePhotoAlbums = ko.observableArray();
    self.newPhotoAlbumName = ko.observable();

    self.fileUploaderUrl = ko.computed(function () {
        var url = window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/team/' + self.teamId;

        url = url + '/PhotoGallery';

        return url;
    }, self);

    self.init = function () {
        if (!self.teamId) {
            self.loadPhotoAlbums();
            if (isAdmin)
                self.loadEditablePhotoAlbums();
        }
        else {
            self.loadPhotos();
        }

        self.initFileUpload();
    }

    self.deletePhotoAlbum = function () {

        // can't delete team photo album.
        if (self.teamId)
            return;

        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId + '/albums/' + self.selectedEditPhotoAlbum(),
            success: function (id) {
                self.photoAlbums.remove(function (item) {
                    return item.id == id;
                });
                self.editablePhotoAlbums.remove(function (item) {
                    return item.id == id;
                });
            }
        });
    }

    self.addPhotoAlbum = function () {

        // teams only have a single default photo album.
        if (self.teamId)
            return;

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
                self.editablePhotoAlbums.push(album);

                self.selectedEditPhotoAlbum(photoAlbum.Id);
                self.newPhotoAlbumName("");
            }
        });
    }

    self.startEditMode = function () {
        if (self.isAdmin) {
            if (self.viewMode())
                self.viewMode(false);
            else
                self.viewMode(true);
        }
    }

    self.getFileNameExtension = function (filename) {
        var a = filename.split(".");
        if (a.length === 1 || (a[0] === "" && a.length === 2)) {
            return "";
        }
        return a.pop().toLowerCase();
    }

    // copy of data before editing
    self.editingSavedData = null;

    self.editPhoto = function (photo) {
        self.editingSavedData = photo.toJS();
        photo.viewMode(false);
        $('#photoGalleryCarousel').carousel('pause');
    }

    self.savePhoto = function (photo) {
        var url = window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/team/' + self.teamId;

        url = url + '/photos/' + photo.Id();

        var data = photo.toJS();

        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function (newPhoto) {
                photo.update(newPhoto);
                photo.viewMode(true);
                $('#photoGalleryCarousel').carousel('cycle');
            }
        });
    }

    self.endEditPhoto = function (photo) {
        photo.update(self.editingSavedData);
        photo.viewMode(true);
        $('#photoGalleryCarousel').carousel('cycle');
    }

    self.deletePhoto = function (photo) {
        $("#deletePhotoModal").modal("show");

        $("#confirmDeletePhotoBtn").one("click", function () {
            self.performDeletePhoto(photo);
        });

    }

    self.performDeletePhoto = function (photo) {
        var url = window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId;
        if (self.teamId)
            url = url + '/team/' + self.teamId;

        url = url + '/photos/' + photo.Id();

        $.ajax({
            type: "DELETE",
            url:  url,
            success: function (id) {

                photo.Id(-1);
                photo.Title("[deleted]");
                photo.Caption("");
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

            }
        });

    }

    self.loadPhotos = function () {

        var url = window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/team/' + self.teamId;

        url = url + '/photos';
        
        if (!self.teamId)
            url = url + '?album=' + self.selectedPhotoAlbum();

        $.ajax({
            type: "GET",
            url:  url,
            success: function (photos) {
                var count = 0;
                var mappedPhotos = $.map(photos, function (photo) {
                    return new PhotoViewModel(photo);
                });

                self.photoGalleryItems(mappedPhotos);
                self.photoGalleryItemsCount(mappedPhotos.length);
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
                    reportAjaxError(self.fileUploaderUrl(), data.jqXHR, '', data.jqXHR.responseText);
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
                        self.photoGalleryItems.push(new PhotoViewModel(photo));

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
                AlbumId: self.selectedEditPhotoAlbum()
            };
        });
    }

    self.loadPhotoAlbums = function () {
        
        // no albums for team.
        if (self.teamId)
            return;

        var url = window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId + '/albums';
        $.ajax({
            type: "GET",
            url: url,
            success: function (photoAlbums) {
                var mappedAlbums = $.map(photoAlbums, function (album) {
                    return {
                        name: album.Title + ' (' + album.PhotoCount + ')',
                        id: album.Id
                    };
                });

                mappedAlbums.unshift({
                    name: 'default',
                    id: 0
                })
                self.photoAlbums(mappedAlbums);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status == 404)
                    return;

                reportAjaxError(url, xhr, ajaxOptions, thrownError);
            }
        });
    }

    self.loadEditablePhotoAlbums = function () {

        // no albums for team.
        if (self.teamId)
            return;

        var url = window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId + '/editablealbums';
        $.ajax({
            type: "GET",
            url: url,
            success: function (photoAlbums) {
                var mappedAlbums = $.map(photoAlbums, function (album) {
                    return {
                        name: album.Title,
                        id: album.Id
                    };
                });

                self.editablePhotoAlbums(mappedAlbums);
                self.editablePhotoAlbums.unshift({
                    name: 'default',
                    id: 0
                });

                self.selectedEditPhotoAlbum(0);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status == 404)
                    return;

                reportAjaxError(url, xhr, ajaxOptions, thrownError);
            }
        });
    }

}
