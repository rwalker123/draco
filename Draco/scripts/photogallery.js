function InitPhotoGalleryViewModel(accountId, isAdmin, teamId) {
    var photoGalleryElem = document.getElementById("photoGallery");
    if (photoGalleryElem) {
        var photoGalleryVM = new PhotoGalleryViewModel(accountId, isAdmin, teamId);
        photoGalleryVM.init();
        ko.applyBindings(photoGalleryVM, photoGalleryElem);
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
                $('#photoAlbumSelect').selectpicker('refresh');
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
                $('#photoAlbumSelect').selectpicker('refresh');
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

    self.editPhoto = function (photo) {
        photo.viewMode(false);
        $('#photoGalleryCarousel').carousel('pause');
    }

    self.savePhoto = function (photo) {
        var url = window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/team/' + self.teamId;

        url = url + '/photos/' + photo.Id;

        $.ajax({
            type: "PUT",
            url: url,
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

        var url = window.config.rootUri + '/api/PhotoGalleryAPI/' + self.accountId;
        if (self.teamId)
            url = url + '/team/' + self.teamId;

        url = url + '/photos/' + photo.Id;

        $.ajax({
            type: "DELETE",
            url:  url,
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
                        name: album.Title,
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
                $('#photoAlbumSelect').selectpicker();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status == 404)
                    return;

                reportAjaxError(url, xhr, ajaxOptions, thrownError);
            }
        });
    }

}
