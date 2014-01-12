(function ($) {
    var methods = {
        // methods go here and are called like: $('').customSelect('methodName', args);
        init: function (opts) {
            // there's no need to do $(this) because
            // "this" is already a jquery object

            // Create some defaults, extending them with any options that were provided
            var settings = $.extend({
                options: []
            }, opts);

            // maintain chainability.
            return this.each(function () {

                $("<span />", {
                    'class': 'selected'
                }).appendTo($(this));

                $("<span />", {
                    'class': 'selectArrow',
                    'text': '▼'
                }).appendTo($(this));

                var optionsContainer = $("<div />", {
                    'class': 'selectOptions'
                }).appendTo($(this));

                $.each(settings.options, function () {
                    $("<span />", {
                        'class': 'selectOption',
                        'text': this.text
                    }).data('customSelect', {
                        value: this.value
                    }).appendTo(optionsContainer);
                });


                $(this).children('span.selected').html($(this).children('div.selectOptions').children('span.selectOption:first').html());
                $(this).children('span.selected').change(function (e, elem) {
                    console.log("selected value: " + $(elem).data('customSelect').value);
                    if (settings.selectionChanged)
                        settings.selectionChanged(elem, $(elem).data('customSelect').value);
                });

                $(this).attr('value', $(this).children('div.selectOptions').children('span.selectOption:first').attr('value'));

                $(this).children('span.selected,span.selectArrow').click(function () {
                    if ($(this).parent().children('div.selectOptions').css('display') == 'none') {
                        $(this).parent().children('div.selectOptions').css('display', 'block');
                    }
                    else {
                        $(this).parent().children('div.selectOptions').css('display', 'none');
                    }
                });

                $(this).find('span.selectOption').click(function () {
                    $(this).parent().css('display', 'none');
                    $(this).closest('div.selectBox').attr('value', $(this).attr('value'));
                    var selectedElement = $(this).parent().siblings('span.selected');
                    selectedElement.html($(this).html());
                    selectedElement.trigger('change', $(this));
                });
            });
        },
    };

    $.fn.customSelect = function (method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.customSelect');
        }
    };
})(jQuery);


