const HARDCODED_MAPPINGS = {
  22000: '22 Mbps',
  50000: '50 Mbps',
  512000: '500 Mbps',
  524000: '500 Mbps',
};

const SORT_LIST = ["KPNWBAFIBER", "KPNWBAFTTH/FTTO", "KPNWBAVPLUS", "KPNWBAVVDSL", "KPNWBAVDSL", "KPNWBAADSL", "KPNWBABVDSL", 
                   "TELE2FIBER", "ZIGGOFIBER", "KPNWEASFIBER", "EUROFIBERFIBER", "TELE2COPPER", "KPNWEASCOPPER"]

// See https://github.com/Nextpertise/imp_portal/blob/master/src/filters/bandwidth.js for details. 
function createSpeedDisplayValue(_value) {
  const value = Number(_value);

  const isLessThanAMb = value < 1024;
  const isLessThan3Mb = value < 3000;
  const isGreaterThan95Mb = value > 95000 && value < 1000000;
  const isLessThan1Gb = value < 1000000;

  if (HARDCODED_MAPPINGS[value]) {
      return HARDCODED_MAPPINGS[value];
  }
  if (isLessThanAMb) {
      return `${value} Kbps`;
  }
  if (isLessThan3Mb) {
      const mbValue = parseFloat((value / 1024).toFixed(2));
      return `${mbValue} Mbps`;
  }
  if (isGreaterThan95Mb) {
      const mbValue = Math.round(value / 1024);
      const roundedMbValue = Math.ceil(mbValue / 10) * 10;

      return `${roundedMbValue} Mbps`;
  }
  if (isLessThan1Gb) {
      return `${Math.round(value / 1024)} Mbps`;
  }
  return `${Math.round(value / 1024 / 1024)} Gbps`;
}

function showOfferForm( dhis ) {
  let params = getParameters();
  let zipcode = params['zipcheck-zipcode'].toUpperCase();
  let housenr = params['zipcheck-housenr'];
  let housenrext = params['zipcheck-ext'];
  let street = jQuery(".zipcheck-street").html();
  let city = jQuery(".zipcheck-city").html();
  let title = jQuery(dhis).parent().parent().find(".zipcheck-title").html();
  let provider = jQuery(dhis).parent().parent().find(".zipcheck-provider").html();
  let upload = jQuery(dhis).parent().parent().find(".zipcheck-maxupload").html();
  let download = jQuery(dhis).parent().parent().find(".zipcheck-maxdownload").html();

  jQuery('.request-popup input[name="zip-street"]').val(street);
  jQuery('.request-popup input[name="zip-housenr"]').val(housenr);
  jQuery('.request-popup input[name="zip-housenrext"]').val(housenrext);
  jQuery('.request-popup input[name="zip-zipcode"]').val(zipcode);
  jQuery('.request-popup input[name="zip-city"]').val(city);
  jQuery('.request-popup input[name="zip-title"]').val(title);
  jQuery('.request-popup input[name="zip-provider"]').val(provider);
  jQuery('.request-popup input[name="zip-upload"]').val(upload);
  jQuery('.request-popup input[name="zip-download"]').val(download);

  let modal = document.getElementById("request-modal");
  modal.style.display = "block";
}

// Extract params from URL.
// Not using native functionality because it is not supported in all browsers. 
function getParameters() {
  query = window.location.search.substring(1);
  let vars = query.split("&");
  let results = {};
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    var key = decodeURIComponent(pair[0]);
    var value = decodeURIComponent(pair[1]);
    // If first entry with this name
    if (typeof results[key] === "undefined") {
      results[key] = decodeURIComponent(value);
      // If second entry with this name
    } else if (typeof results[key] === "string") {
      var arr = [results[key], decodeURIComponent(value)];
      results[key] = arr;
      // If third or later entry with this name
    } else {
      results[key].push(decodeURIComponent(value));
    }
  }
  return results;
}



jQuery(document).ready(function($) {
  // Used to check if all the calls have been completed.
  let necessaryProviderCalls;
  let completedProvidercalls = 0;
  // Stores all the results and is sorted after every call.
  let resultsList = [];

  // Get the modal
  var modal = document.getElementById("request-modal");
  var span = document.getElementsByClassName("popup-close")[0];
  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = "none";
    }
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
  }

  function hideLoader(){
    $(".postcode-result-box.spinner-box").hide(300);
  }

  // Sorts the list that has all the different options.
  function sortAllResults(){
    function buildString(result){
      if(result['provider'].toUpperCase() === "KPNWBA"){
        return (result['provider'] + result['header']).toUpperCase();
      }else{
        return (result['provider'] + result['carrier']).toUpperCase();
      }
    }

    // Sorts the list based on SORT_LIST
    resultsList.sort(function(a, b){
      let aString = buildString(a);
      let bString = buildString(b);
      try{
        if(SORT_LIST.indexOf(aString) > SORT_LIST.indexOf(bString)){
          return -1;
        }else{
          return 1
        }
      }catch (error) {
        return 0;
      }
    });
  }

  // Renders the list. Should be called after sortAllResults()
  function renderAllResults(){
    $(".result-item").remove();
    $.each(resultsList, function(index, result){
      $(".postcode-result").prepend(createResultBox(result));
    });
  }


  // Adds the address to the header.
  function updateHeaderContent(address){
    let subtitle = "<p>Beschikbare producten op</p>";
    let title_housenrext = address['housenrext'] === "" ? "" : "-" + address['housenrext'];
    let title = "<h2><span class='zipcheck-street'>" + address["street"] + "</span> " + address['housenr'].toString() + title_housenrext + " in <span class='zipcheck-city'>" + address['municipality'] + "</span></h2>";

    $(".postcode-text-part").html(subtitle + title);
  }

  // Show message if no results are found
  function updateHeaderNoResults(zipcode, housenr, ext){
    ext = ext === "" ? "" : "-" + ext;
    let title = "<h2>Geen resultaten gevonden voor " + zipcode.toUpperCase() + " " + housenr + ext + ".</h2>";

    $(".postcode-text-part").html(title);
  }
  

  // Gets a list of all the available providers.
  // Uses a callback for browser compatiblity.
  function listProviders(callback){
    $.ajax(zipcheck_ajax.ajax_url, {
      method: 'POST',
      data: {'action': 'nextzipcheck_get_all_providers'},
      success: function(data){
          callback(JSON.parse(data));
      }
    })
  }

  // Gets the actual data from the provider.
  function getProviderAvailableData(callback, provider, zipcode, housenr, ext=""){
    $.ajax(zipcheck_ajax.ajax_url, {
      method: 'POST',
      data: {
        'action': 'nextzipcheck_get_available_per_provider',
        'zipcode': zipcode,
        'housenr': housenr,
        'housenrext': ext,
        'provider': provider
      },
      success: function(data){
          callback(JSON.parse(data));
      }
    })
  }

  // Gets data for each provider, loops over the data, adds data to resultlist, calls the sort and render functions.
  function getAndInsertDataFromProviders(providerList){
    let params = getParameters();
    params['zipcheck-ext'] = params['zipcheck-ext'] !== "undefined" ? params['zipcheck-ext'] : ""
    necessaryProviderCalls = providerList.length;

    $.each(providerList, function(index, val){
      // Gets data from API for each provider.
      getProviderAvailableData(
        function(data){
          // Handles loader card
          completedProvidercalls++;
          if(completedProvidercalls >= necessaryProviderCalls){
            hideLoader();
          }

          // Check if provider actually has data.
          if (data !== null && data !== "null"){
            // Updates header with address.
            updateHeaderContent(data['address'])

            // Loops over data and sorts and renders cards.
            $.each(data['available'], function(providerName, provider){
              $.each(provider, function(header, result){
                result['header'] = header;
                result['provider'] = providerName;
                resultsList.push(result);
              });
            });
            sortAllResults();
            renderAllResults();
          }
          
          // Check if there are any results
          if(completedProvidercalls >= necessaryProviderCalls && resultsList.length === 0){
            // Show error message if there are no results
            updateHeaderNoResults(params['zipcheck-zipcode'], params['zipcheck-housenr'], params['zipcheck-ext']);
          }
        },
        val, 
        params['zipcheck-zipcode'],
        params['zipcheck-housenr'],
        params['zipcheck-ext'],
      )
    });
  }

  // Create the HTML within JavaScript. Using normal `+` instead of template literals for IE 11 support.  
  function createResultBox(result){
    // let title = "<h3>" + result['header'].replace('Fiber', 'Glasvezel') + "</h3>";

    // rui code
    let tmp_header = result['header'].replace('SDSL.bis', 'SDSL');
    if ( result['provider'].toUpperCase() == 'TELE2' ) {
      tmp_header = 'Tele2 ' + tmp_header;
    }
    if ( tmp_header.toUpperCase() == 'FIBER' && result['area'].toUpperCase() == 'FTTH' ) {
      tmp_header = tmp_header + 'To The Home';
    } else if ( tmp_header.toUpperCase() == 'FIBER' && result['area'].toUpperCase() == 'FTTO' ) {
      tmp_header = tmp_header + 'To The Office';
    }

    let title = "<h3 class='zipcheck-title'>Hovotech " + tmp_header + "</h3>";
    let subtitle = "<p> via <span class='zipcheck-provider'>" + result['provider'] + "</span></p>";
    let speedup = '<h3><img src="https://nextpertise.nl/wp-content/uploads/2018/10/arrow-up.svg" alt="down"><span class="zipcheck-maxupload">' + createSpeedDisplayValue(result['max_upload']) + '</span></h3>';
    let speeddown = '<h3><img src="https://nextpertise.nl/wp-content/uploads/2018/10/arrow-down.svg" alt="down"><span class="zipcheck-maxdownload">' + createSpeedDisplayValue(result['max_download']) + '</span></h3>';
    let shouldAddDivider = (result['area'] !== undefined && result['area'] != "" && result['distance'] !== undefined && result['distance'] != "")
    let area =  result['area'] + (shouldAddDivider ? ", " : "") + result['distance'].replace(";", ", ");
    let smallSubText = (result['carrier'].toUpperCase() === "COPPER" && result['provider'].toUpperCase() === "KPNWBA") ? "Verwachte snelheid" : "";

    let html = '\
      <div class="postcode-result-box result-item">\
        <div class="postcode-left-part">\
          ' + title + subtitle + '\
        </div>\
        <div class="postcode-offer-part">\
          <button class="blue-btn zipcheck-offer-btn" onclick="showOfferForm(this);">Offerte</button>\
        </div>\
        <div class="postcode-right-part">\
          <div class="speed-part">\
          ' + speeddown + speedup + '\
          </div>\
          <p>' + area + smallSubText + '</p>\
        </div>\
        <div class="postcode-offer-part mobile">\
          <button class="blue-btn zipcheck-offer-btn" onclick="showOfferForm(this);">Offerte</button>\
        </div>\
        <p><p>\
      </div>\
    ';

    return html;
  }

  // Sets the inputs to the inputs submitted.
  function populateState(params){
    params['zipcheck-ext'] = params['zipcheck-ext'] !== "undefined" ? params['zipcheck-ext'] : ""

    global_zipcode = params['zipcheck-zipcode'];
    global_housenr_zipcode = global_zipcode;
    global_housenr = params['zipcheck-housenr'];

    $(".results .zipcheck-zipcode").val(global_zipcode);
    $(".results .zipcheck-housenr").val(global_housenr);
    $(".results .zipcheck-ext").val(params['zipcheck-ext']);
    
    $(document).trigger("zipcheck-results-init");
  }


  listProviders(getAndInsertDataFromProviders);
  populateState(getParameters());

});
