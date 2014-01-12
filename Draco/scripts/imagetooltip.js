    $(document).ready(function () {

        // Match all link elements with href attributes within the content div
        $('img[tooltip]').each(function () {
            $(this).qtip({
                content: $(this).attr('tooltip'),
                style: {
                    border: {
                        width: 2,
                        radius: 5
                    },
                    padding: 3,
                    textAlign: 'left',
                    tip: true, // Give it a speech bubble tip with automatic corner detection
                    name: 'dark' // Style it according to the preset 'cream' style
                }
            });
        });

    });
