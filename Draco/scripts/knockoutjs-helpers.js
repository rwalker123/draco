function initKOHelpers() {

    // tinymce
    ko.bindingHandlers.tinymce = {
        init: function (element, valueAccessor, allBindingsAccessor, context) {
            var options = allBindingsAccessor().tinymceOptions || {};
            var modelValue = valueAccessor();
            var value = ko.utils.unwrapObservable(valueAccessor());
            var el = $(element);

            // default options.
            var mce_config = {
                // Location of TinyMCE script
                script_url: '/scripts/tiny_mce/tiny_mce.js',

                // General options
                theme : "advanced",
                // Theme options
                theme_advanced_buttons1 : "save,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,formatselect,fontselect,fontsizeselect",
                theme_advanced_buttons2 : "cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,image,cleanup,code,|,forecolor,backcolor",
                theme_advanced_buttons3 : "",
                theme_advanced_toolbar_location : "top",
                theme_advanced_toolbar_align : "left",
                theme_advanced_statusbar_location : "bottom",
                theme_advanced_resizing : false,

                //handle edits made in the editor
                setup: function (ed) {
                    ed.onChange.add(function (ed, l) {
                        if (ko.isWriteableObservable(modelValue)) {
                            modelValue(l.content);
                        }
                    })
                },
            };

            // add user options.
            mce_config = $.extend(mce_config, options);

            //handle destroying an editor (based on what jQuery plugin does)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).parent().find("span.mceEditor,div.mceEditor").each(function (i, node) {
                    var ed = tinyMCE.get(node.id.replace(/_parent$/, ""));
                    if (ed) {
                        ed.remove();
                    }
                });
            });

            //$(element).tinymce(mce_config);
            setTimeout(function () { el.tinymce(mce_config); }, 0);
            el.html(value);
        },
        update: function (element, valueAccessor, allBindingsAccessor, context) {
            var el = $(element)
            var value = ko.utils.unwrapObservable(valueAccessor());
            var id = el.attr('id')

            //handle programmatic updates to the observable
            // also makes sure it doesn't update it if it's the same. 
            // otherwise, it will reload the instance, causing the cursor to jump.
            if (id) {
                var content = tinyMCE.getInstanceById(id).getContent({ format: 'raw' })
                if (content !== value) {
                    el.html(value);
                }
            }
        }
    };

    // jQuery autocomplete..
    ko.bindingHandlers.autocomplete = {
        init: function (element, params) {
            $(element).autocomplete(params());

            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).autocomplete("destroy");
            });
        },
        update: function (element, params) {
            $(element).autocomplete("option", "source", params().source);
        }
    };

    // Here's a custom Knockout binding that makes elements shown/hidden via jQuery's fadeIn()/fadeOut() methods
    // Could be stored in a separate utility library
    ko.bindingHandlers.fadeVisible = {
        init: function (element, valueAccessor) {
            // Initially set the element to be instantly visible/hidden depending on the value
            var value = valueAccessor();
            $(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
        },
        update: function (element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            ko.utils.unwrapObservable(value) ? $(element).show('slow') : $(element).hide();
        }
    };

    ko.bindingHandlers.imageUploader = {
        init: function (element, valueAccessor) {
            $(element).bind('dragenter', function (e) {
                $(this).addClass('over');
            });

            $(element).bind('dragleave drop', function (e) {
                $(this).removeClass('over');
            });

            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).attr('data-url', value);
            $(element).fileupload({
                dataType: 'json',
                dropZone: $(element),
                add: function (e, data) {

                    // set opacity of current image and show busy cusor.
                    $(element).fadeTo('fast', 0.4);
                    //busyElem.show('fast');

                    data.submit();
                },
                done: function (e, data) {
                    var seconds = new Date().getTime() / 1000;
                    $(element).attr("src", data.result + "?" + seconds);
                },
                always: function (e, data) {
                    //remove opacity, hide progress
                    $(element).fadeTo('fast', 1.0);
                    //busyElem.hide('fast');
                }
            });

            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).fileupload("destroy");
            });
        }
    };

    ko.bindingHandlers.phoneNumber = {
        init: function (element, valueAccessor) {
            $(element).mask("(999) 999-9999");

            //handle the field changing
            ko.utils.registerEventHandler(element, "change", function () {
                var observable = valueAccessor();
                observable($(element).val());
            });

            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).mask("destroy");
            });

            if (ko.bindingHandlers.validationCore)
                ko.bindingHandlers.validationCore.init(element, valueAccessor, allBindingsAccessor);
        },
        update: function (element, valueAccessor) {
            // First get the latest data that we're bound to
            var value = valueAccessor();

            // Next, whether or not the supplied model property is observable, get its current value
            var valueUnwrapped = ko.utils.unwrapObservable(value);

            $(element).val(valueUnwrapped); // Make the element visible
        }
    };

    ko.bindingHandlers.datepicker = {
        current: '',

        init: function (element, valueAccessor, allBindingsAccessor) {
            //initialize datepicker with some optional options
            var options = allBindingsAccessor().datepickerOptions || {};
            $(element).datepicker(options);

            var startdate = allBindingsAccessor().datepickerStartDate;
            if (startdate)
                $(element).datepicker('setDate', startdate);

            //handle the field changing
            ko.utils.registerEventHandler(element, "change", function () {
                var observable = valueAccessor();
                observable($(element).val());
                if (observable.isValid && observable.isValid()) {
                    observable($(element).datepicker("getDate"));

                    $(element).blur();
                }
            });

            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).datepicker("destroy");
            });

            if (ko.bindingHandlers.validationCore)
                ko.bindingHandlers.validationCore.init(element, valueAccessor, allBindingsAccessor);

        },
        update: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());

            //handle date data coming via json from Microsoft
            if (String(value).indexOf('/Date(') == 0) {
                value = new Date(parseInt(value.replace(/\/Date\((.*?)\)\//gi, "$1")));
            }

            current = $(element).datepicker("getDate");

            if (value && value - current !== 0) {
                $(element).datepicker("setDate", value);
            }
        }
    };

    ko.bindingHandlers['optionsTitle'] = {
        'update': function (element, valueAccessor, allBindingsAccessor) {
            var allBindings = allBindingsAccessor();
            //get our array of options
            var options = ko.utils.unwrapObservable(allBindings['options']);
            //get the property that contains our title
            var property = ko.utils.unwrapObservable(valueAccessor());

            //get the option elements for this select element
            var optionElements = $("option", element);
            //if a caption was specified, then skip it when assigning title
            var skipCaption = allBindings["optionsCaption"] ? 1 : 0;

            //loop through options and assign title to appropriate optionElement
            for (var i = 0, j = options.length; i < j; i++) {
                var option = optionElements[i + skipCaption];
                option.title = options[i][property];
            }
        }
    };

    //wrapper to an observable that requires accept/cancel
    ko.protectedObservable = function (initialValue) {
        //private variables
        var _temp = initialValue;
        var _actual = ko.observable(initialValue);

        var result = ko.dependentObservable({
            read: _actual,
            write: function (newValue) {
                _temp = newValue;
            }
        });

        result.uncommitValue = function () {
            return _temp;
        };

        //commit the temporary value to our observable, if it is different
        result.commit = function () {
            if (_temp !== _actual()) {
                _actual(_temp);
            }
        };

        //notify subscribers to update their value with the original
        result.reset = function () {
            _actual.valueHasMutated();
            _temp = _actual();
        };

        return result;
    };
}
