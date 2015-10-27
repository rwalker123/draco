function initKOHelpers() {

    ko.bindingHandlers.hiddenImg = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            element.onerror = function () {
                element.style.display = "none";
            };
            element.onload = function () {
                element.style.display = "";
            };
            element.src = ko.unwrap(valueAccessor());
        }
    };

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

    //<input type="text" data-bind="typeahead: { target: ProductViewModel, datasets: { source: Products }, options: { hint: true, minLength: 3, highlight: true } }" />

    ko.bindingHandlers.typeahead = {
        init: function (element, params) {
            var binding = this;
            var elem = $(element);
            var value = params();

            elem.bind('typeahead:selected', function (e, suggestionObject, datasetName) {
                value.target(suggestionObject);
            });

            if (value.datasets && value.datasets.source)
                value.datasets.source = ko.utils.unwrapObservable(value.datasets.source); 

            elem.typeahead(value.options, value.datasets);
        },
        update: function (element, valueAccessor) {
            var elem = $(element);
            var value = valueAccessor();
            if (value.target() && value.target().label)
                elem.val(value.target().label);
            else
                elem.val(value.target());
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

            var imageElement = $(element).prevAll("img:first");

            imageElement.bind('dragenter', function (e) {
                $(this).addClass('dragover');
            });

            imageElement.bind('dragleave drop', function (e) {
                $(this).removeClass('dragover');
            });

            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).attr('data-url', value);
            $(element).fileupload({
                dataType: 'json',
                dropZone: imageElement,
                add: function (e, data) {

                    // set opacity of current image and show busy cusor.
                    imageElement.fadeTo('fast', 0.4);
                    //busyElem.show('fast');

                    data.submit();
                },
                done: function (e, data) {
                    var seconds = new Date().getTime() / 1000;
                    imageElement.attr("src", data.result + "?" + seconds);
                },
                always: function (e, data) {
                    //remove opacity, hide progress
                    imageElement.fadeTo('fast', 1.0);
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
        init: function (element, valueAccessor, allBindingsAccessor) {
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
            //ko.utils.registerEventHandler(element, "changeDate", function (event) {
            //    var value = valueAccessor();
            //    if (ko.isObservable(value)) {
            //        value(moment(event.date).format("MM DD, YYYY"));
            //    }
            //});

            ko.utils.registerEventHandler(element, "change", function () {
                var value = valueAccessor();
                if (ko.isObservable(value)) {
                    value(element.value);
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
                    //widget.date = new Date(widget.date);
                    widget.date = moment(widget.date).toDate();
                }

                widget.setDate(widget.date); //.value
            }
        }
    };

    ko.bindingHandlers.timepicker = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            //initialize datepicker with some optional options
            var options = allBindingsAccessor().timepickerOptions || {};
            $(element).timepicker(options);

            //when a user changes the time, update the view model
            ko.utils.registerEventHandler(element, "change", function () {
                var value = valueAccessor();
                if (ko.isObservable(value)) {
                    value(element.value);
                }
            });
        },
        update: function (element, valueAccessor) {
            var widget = $(element).data("timepicker");
            //when the view model is updated, update the widget
            if (widget) {
                widget.time = ko.utils.unwrapObservable(valueAccessor());

                if (widget.time)
                    widget.setTime(widget.time); //.value
            }
        }
    };

    ko.bindingHandlers.selectPicker2 = {
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
                $(element).addClass('selectpicker').selectpicker();
            }
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            if ($(element).is('select')) {
                var selectPickerOptions = allBindingsAccessor().selectPickerOptions;
                if (typeof selectPickerOptions !== 'undefined' && selectPickerOptions !== null) {
                    var options = selectPickerOptions.optionsArray,
                        optionsText = selectPickerOptions.optionsText,
                        optionsValue = selectPickerOptions.optionsValue,
                        optionsCaption = selectPickerOptions.optionsCaption,
                        isDisabled = selectPickerOptions.disabledCondition || false,
                        resetOnDisabled = selectPickerOptions.resetOnDisabled || false;
                    if (ko.utils.unwrapObservable(options).length > 0) {
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
                        ko.bindingHandlers.selectedOptions.update(element, valueAccessor, allBindingsAccessor);
                    } else {
                        // call the default Knockout value binding
                        ko.bindingHandlers.value.update(element, valueAccessor, allBindingsAccessor);
                    }
                }

                $(element).selectpicker('refresh');
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
                    if (options !== undefined) 
                        // why only if length() > 0
                        /*&& ko.utils.unwrapObservable(options).length > 0)*/ {
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
                        ko.bindingHandlers.selectedOptions.update(element, valueAccessor, allBindingsAccessor);
                    } else {
                        // call the default Knockout value binding
                        ko.bindingHandlers.value.update(element, valueAccessor, allBindingsAccessor);
                    }
                }

                $(element).selectpicker('refresh');
            }
        }
    };

    ko.bindingHandlers.trimLengthText = {};
    ko.bindingHandlers.trimText = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var trimmedText = ko.computed(function () {
                var untrimmedText = ko.utils.unwrapObservable(valueAccessor());
                var defaultMaxLength = 20;
                var minLength = 5;
                var maxLength = ko.utils.unwrapObservable(allBindingsAccessor().trimTextLength) || defaultMaxLength;
                if (maxLength < minLength) maxLength = minLength;
                if (untrimmedText) {
                    var text = untrimmedText.length > maxLength ? untrimmedText.substring(0, maxLength - 1) + '...' : untrimmedText;
                }
                return text;
            });
            ko.applyBindingsToNode(element, {
                text: trimmedText
            }, viewModel);

            return {
                controlsDescendantBindings: true
            };
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

    // NOTE: to use validation with this call
    //      ko.validation.makeBindingHandlerValidatable('editablefield');
    ko.bindingHandlers.editablefield = {
        init: function (element, valueAccessor) {

            //handle the field changing
            ko.utils.registerEventHandler(element, "change", function (evt, newVal) {
                var observable = valueAccessor();
                observable(newVal);
            });

            //handle disposal (if KO removes by the template binding)
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            });

        },
        update: function (element, valueAccessor) {
            // First get the latest data that we're bound to
            var value = valueAccessor();

            // Next, whether or not the supplied model property is observable, get its current value
            var valueUnwrapped = ko.utils.unwrapObservable(value);

            $(element).text(valueUnwrapped); // Make the element visible
        }
    };

    ko.bindingHandlers.jqAccordion = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var options = valueAccessor();
            $(element).accordion(options);
            $(element).bind("valueChanged", function () {
                ko.bindingHandlers.jqAccordion.update(element, valueAccessor, allBindingsAccessor);
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor) {
            if ($(element).hasClass("ui-accordion")) {
                $(element).accordion("destroy");
            }

            var options = valueAccessor();
            $(element).accordion(options);
        }
    };

    ko.bindingHandlers.numericText = {
        update: function (element, valueAccessor, allBindingsAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor()),
                precision = ko.utils.unwrapObservable(allBindingsAccessor().precision) || ko.bindingHandlers.numericText.defaultPrecision,
                removeLeadingZero = ko.utils.unwrapObservable(allBindingsAccessor().removeLeadingZero),
                formattedValue = value.toFixed(precision);

            if (removeLeadingZero)
                formattedValue = formattedValue.replace(/^0+/, '');

            ko.bindingHandlers.text.update(element, function () { return formattedValue; });
        },
        defaultPrecision: 1
    };
}
