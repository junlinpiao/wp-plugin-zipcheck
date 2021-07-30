// State vars
let global_zipcode;
let global_previous_zipcode_input = "";
let global_housenr_zipcode;
let global_housenr;
let zipcheck_housenr_input_timeout;

const zipcodeRegex = /([1-9][0-9]{3})\s*([a-zA-Z]{2})/;
const zipcodeStartRegex = /([1-9][0-9]{3})/
const housenrRegex = /([0-9]+)[^a-zA-Z\n]?([a-zA-Z])*/;


jQuery(document).ready(function($) {
    $('form.zipcode-form').attr('action', zipcheck_ajax.results_url);

    // Gets the housenumber autocomplete/dropdown array and calls callback with the new data.
    // Using callback because normal async/await is not properly supported on all browsers.
    function getAndUpdateHouseNumbers(zipcode, callback){
        let autocompleteCache = getAutocompleteFromSessionCache({'zipcode': zipcode}, 'housenr');
        if(autocompleteCache){
            callback(autocompleteCache);
            return;
        }
        $.ajax(zipcheck_ajax.ajax_url, {
            method: 'POST',
            data: {'action': 'nextzipcheck_get_housenr', 'zipcode': zipcode},
            success: function(data){
                saveAutocompleteToSessionCache({'zipcode': zipcode, 'housenr': JSON.parse(data)});
                callback(JSON.parse(data));
            }
        })
    }
    // Gets the housenumber extension autocomplete/dropdown array and calls callback with the new data.
    // Using callback because normal async/await is not properly supported on all browsers.
    function getAndUpdateExtensions(zipcode, housenr, callback){
        if(!housenr){return;}
        let autocompleteCache = getAutocompleteFromSessionCache({'zipcode': zipcode, 'housenr': housenr}, 'ext');
        if(autocompleteCache){
            callback(autocompleteCache);
            return;
        }
        $.ajax(zipcheck_ajax.ajax_url, {
            method: 'POST',
            data: {'action': 'nextzipcheck_get_housenrext', 'zipcode': zipcode, 'housenr': housenr},
            success: function(data){
                saveAutocompleteToSessionCache({'zipcode': zipcode, 'housenr': housenr, 'ext': JSON.parse(data)});
                callback(JSON.parse(data));
            }
        })
    }

    // Removes the loadingbar.
    function updateHouseNumberCallback(data){
        let input = $('.zipcheck-housenr');
        let inputContainer = input.parent();
        $("input.zipcheck-housenr").each(function(i){
            autocomplete(this, data);
        });
        inputContainer.removeClass('loader-active');
    }
    function updateExtCallback(data){
        let input = $('.zipcheck-ext');
        let inputContainer = input.parent();
        $("input.zipcheck-ext").each(function(i){
            autocomplete(this, data);
        })
        inputContainer.removeClass('loader-active');
    }

    // Adds the loadingbar and removes old autocompletes..
    function beforeUpdateHouseNumber(){
        let input = $('input.zipcheck-housenr');
        let inputContainer = input.parent();
        inputContainer.addClass('loader-active');
        autocomplete(input[0], false);
    }
    function beforeUpdateExt(){
        let input = $('input.zipcheck-ext');
        let inputContainer = input.parent();
        inputContainer.addClass('loader-active');
        autocomplete(input[0], false);
    }

    // Validate input
    function validateZipcode(zipcode){
        zipcode = $.trim(zipcode);
        if(zipcode.length < 6){
            return false;    
        }
        return zipcodeRegex.test(zipcode);
    }

    function validateHousenr(housenr){
        housenr = $.trim(housenr);
    }

    // Add listeners
    $('.zipcheck-zipcode').bind('input', function(event){
        let zipcode = $(this).val().replace(" ", "");
        $(this).val(zipcode);
        if(validateZipcode(zipcode)){
            beforeUpdateHouseNumber();
            getAndUpdateHouseNumbers(zipcode, updateHouseNumberCallback);
            global_zipcode = zipcode;
            if(global_housenr){
                // If zipcode is changed while a housenumber was already supplied, trigger housenr update.
                $('.zipcheck-housenr').trigger('change');
            }
        }
        if(zipcode !== global_previous_zipcode_input && global_previous_zipcode_input !== ""){
            $('input.zipcheck-housenr').val("");
            $('input.zipcheck-ext').val("");
        }
        global_previous_zipcode_input = zipcode;
    });
    $('.zipcheck-housenr').bind('input', function(event){
        // If no input changes in 300ms, fire change event and get extensions for housenr.
        if(zipcheck_housenr_input_timeout){
            // Cancel timeout since there has been a change
            clearTimeout(zipcheck_housenr_input_timeout);
        }
        if($(this).val()){
            // Don't set timeout if input is empty.
            zipcheck_housenr_input_timeout = setTimeout(function(){
                $('.zipcheck-housenr').trigger('change');
            }, 300)
        }
    });
    $('.zipcheck-housenr').change(function(){
        let housenr = $(this).val();
        if((housenr != global_housenr || global_zipcode != global_housenr_zipcode) && global_zipcode){
            global_housenr = housenr;
            global_housenr_zipcode = global_zipcode;
            beforeUpdateExt();
            getAndUpdateExtensions(global_zipcode, housenr, updateExtCallback);
        }
    });



    // Paste support
    function checkAndUsePastedData(paste){
        if(paste.length > 250){return false}
        
        // usedPaste is used to determine if the default event (paste) needs to be prevented.
        let usedPaste = false;

        // check zipcode
        let zipcodeMatch = paste.match(zipcodeRegex) || paste.match(zipcodeStartRegex);
        if(zipcodeMatch !== null){
            $('input.zipcheck-zipcode').val(zipcodeMatch[0]).trigger('input');
            paste = paste.replace(new RegExp(zipcodeMatch[0].trim(), "gi"), "");
            usedPaste = true;
        }

        // Checks for housenrs with and without extensions;
        let housenrMatch = paste.match(housenrRegex);
        if(housenrMatch !== null){
            usedPaste = true;
            $('input.zipcheck-housenr').val(housenrMatch[1]).trigger('change'); 
            // found extension
            if(housenrMatch.length > 2){
                $('input.zipcheck-ext').val(housenrMatch[2]);
            }
        }
        
        return usedPaste;
        
    }

    $("body").on("paste", function(event){
        let pastedData = event.originalEvent.clipboardData.getData('text');
        if(checkAndUsePastedData(pastedData)){
            event.preventDefault();
        };
    });

    // Init autocomplete
    function autocompleteInit(){
        $('.zipcheck-zipcode').trigger('input');
        $('.zipcheck-housenr').trigger('change');
    }

    $(document).on('zipcheck-results-init', function(){
        autocompleteInit();
        $(document).off('zipcheck-results-init');
    });

});

