function initKOHelpers() {

    ko.bindingHandlers.uniqueId = {
        init: function(element, valueAccessor) {
            var value = valueAccessor();
            value.id = value.id || ko.bindingHandlers.uniqueId.prefix + (++ko.bindingHandlers.uniqueId.counter);

            element.id = value.id;
        },
        counter: 0,
        prefix: "unique"
    };

    ko.bindingHandlers.uniqueFor = {
        init: function (element, valueAccessor) {
            var value = valueAccessor();
            value.id = value.id || ko.bindingHandlers.uniqueId.prefix + (++ko.bindingHandlers.uniqueId.counter);

            element.setAttribute("for", value.id);
        }
    };
   
    ko.bindingHandlers.htmlValue = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var updateHandler = function () {
                var modelValue = valueAccessor(),
                    elementValue = element.innerHTML;

                //update the value on keyup
                modelValue(elementValue);
            };

            ko.utils.registerEventHandler(element, "keyup", updateHandler);
            ko.utils.registerEventHandler(element, "input", updateHandler);
        },
        update: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor()) || "",
                current = element.innerHTML;

            if (value !== current) {
                element.innerHTML = value;
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
        init: function (element, valueAccessor, allBindingsAccessor) {
            //initialize datepicker with some optional options
            var options = allBindingsAccessor().datepickerOptions || {};
            $(element).datepicker(options);

            //when a user changes the date, update the view model
            ko.utils.registerEventHandler(element, "changeDate", function (event) {
                var value = valueAccessor();
                if (ko.isObservable(value)) {
                    value(event.date);
                }
            });

            ko.utils.registerEventHandler(element, "change", function () {
                var value = valueAccessor();
                if (ko.isObservable(value)) {
                    value(new Date(element.value));
                }
            });
        },
        update: function (element, valueAccessor) {
            var widget = $(element).data("datepicker");
            //when the view model is updated, update the widget
            if (widget) {
                widget.date = ko.utils.unwrapObservable(valueAccessor());

                if (!widget.date) {
                    return;
                }

                if ($.type(widget.date) === 'string') {
                //if (_.isString(widget.date)) {
                    widget.date = new Date(widget.date);
                }

                widget.setDate(widget.date); //.value
            }
        }
    };

    ko.bindingHandlers.selectPicker = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            if ($(element).is('select')) {
                if (ko.isObservable(valueAccessor())) {
                    if ($(element).prop('multiple') && $.isArray(ko.utils.unwrapObservable(valueAccessor()))) {
                        // in the case of a multiple select where the valueAccessor() is an observableArray, call the default Knockout selectedOptions binding
                        ko.bindingHandlers.selectedOptions.init(element, valueAccessor, allBindingsAccessor);
                    } else {
                        // regular select and observable so call the default value binding
                        ko.bindingHandlers.value.init(element, valueAccessor, allBindingsAccessor);
                    }
                }
                $(element).selectpicker();
            }
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            if ($(element).is('select')) {
                var selectPickerOptions = allBindingsAccessor().selectPickerOptions;
                if (typeof selectPickerOptions !== 'undefined' && selectPickerOptions !== null) {
                    var options = selectPickerOptions.optionsArray,
                        isDisabled = selectPickerOptions.disabledCondition || false,
                        resetOnDisabled = selectPickerOptions.resetOnDisabled || false;
                    if (options !== undefined && ko.utils.unwrapObservable(options).length > 0) {
                        // call the default Knockout options binding
                        ko.bindingHandlers.options.update(element, options, allBindingsAccessor);
                    }
                    if (isDisabled && resetOnDisabled) {
                        // the dropdown is disabled and we need to reset it to its first option
                        $(element).selectpicker('val', $(element).children('option:first').val());
                    }
                    $(element).prop('disabled', isDisabled);
                }
                if (ko.isObservable(valueAccessor())) {
                    if ($(element).prop('multiple') && $.isArray(ko.utils.unwrapObservable(valueAccessor()))) {
                        // in the case of a multiple select where the valueAccessor() is an observableArray, call the default Knockout selectedOptions binding
                        ko.bindingHandlers.selectedOptions.update(element, valueAccessor);
                    } else {
                        // call the default Knockout value binding
                        ko.bindingHandlers.value.update(element, valueAccessor);
                    }
                }

                $(element).selectpicker('refresh');
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
