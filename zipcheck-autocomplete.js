const MAXDROPDOWNLENGTH = 100;
if (typeof $ === 'undefined') {
  $ = jQuery;
}
function autocomplete(inp, arr) {

    // the autocomplete function takes two arguments,
    // the text field element and an array of possible autocompleted values:
    var $inp = $(inp);
    var currentFocus;

    // Removes autocomplete, adds dash icon, stops functions.
    if(!arr){
      removeInputIcons();
      closeInputList($inp);
      $inp.off(".zipcheckautocomplete");
      return;
    }
    // Adds the dropdown icon if there are dropdown options.
    if(arr.length > 0){
      addDropdownIcon();
    }

    $inp.on("input.zipcheckautocomplete focus.zipcheckautocomplete", function(e) {
        closeInputList($inp);
        var a, b, i, val = this.value;
        var dropdownlength = 0;
        currentFocus = -1;
        // create a DIV element that will contain the items (values):
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
          if (((arr[i].toString().substr(0, val.length).toUpperCase() === val.toUpperCase()) || val === "" || val === null) && dropdownlength < MAXDROPDOWNLENGTH) {
            dropdownlength++;

            b = document.createElement("DIV");
            b.innerHTML = "<strong>" + arr[i].toString().substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].toString().substr(val.length);

            b.innerHTML += "<input type='hidden' value='" + arr[i].toString() + "'>";
                b.addEventListener("click", function(e) {
                  // insert the value for the autocomplete text field:
                  inp.value = this.getElementsByTagName("input")[0].value;
                  $inp.trigger('change');
                  closeAllLists();
                  currentFocus = -1;
                });
            a.appendChild(b);
          }
        }
    });

    $inp.on("keydown.zipcheckautocomplete", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");

        if (e.keyCode == 40) {
          // On arrow DOWN keypress
          if(!(e.target.parentNode.querySelector(".autocomplete-items"))){
            // If there is no autocomplete open on this input, open it.
            $inp.trigger('focus');
          }else{
            // If there is a autocomplete open, go through list.
            currentFocus++;
            addActive(x);
          }
        } else if (e.keyCode == 38) {
          // On arrow UP keypress
          currentFocus--;
          addActive(x);
        } else if (e.keyCode == 13) {
          // On ENTER keypress
          if (currentFocus > -1) {
            e.preventDefault();
            // Simulate click on active item
            if (x) x[currentFocus].click();
          }
        }else if (e.keyCode == 9 || e.keyCode == 27){
            // On TAB or ESC keypress
            closeAllLists();
        }
    });

    function addActive(x) {
    // A function to classify an item as "active":
      if (!x) return false;
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      x[currentFocus].classList.add("autocomplete-active");
    }

    function addDropdownIcon(){
        let parent = $(inp.parentNode);
        parent.find('i').remove();
        var i = document.createElement("I");
        i.setAttribute("class", "autocomplete-dropdown-arrow");
        // Show dropdown onclick.
        i.onclick = function (){
          setTimeout(function(){ $inp.trigger('focus'); }, 50);
        }
        inp.parentNode.appendChild(i);
    }
    function removeInputIcons(){
      // Removes all icons from the input. Does not have to be called when switching icons.
      let parent = $(inp.parentNode);
      parent.find('i').remove();
    }

    function removeActive(x) {
    // A function to remove the "active" class from all autocomplete items:
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }

    function closeAllLists(elem) {
      // close all autocomplete lists in the document,
      // except the one passed as an argument.
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
          if (elem != x[i] && elem != inp) {
              x[i].parentNode.removeChild(x[i]);
          }
        }
      }

    function closeInputList($input) {
      // closes the list of the input passed in as an argument.
      $input.siblings('.autocomplete-items').remove();
    }

    document.addEventListener("click", function (e) {
      if((e.target.parentNode.querySelector(".autocomplete-items"))){
        closeAllLists((e.target.parentNode.querySelector(".autocomplete-items")))
      }else{
        closeAllLists(e.target);
      }
    });

    // Open list if loading finishes after input already in focus.
    if(inp === document.activeElement){
        $inp.trigger('focus');
    }
  }

//Save AJAX autocomplete to session.
function saveAutocompleteToSessionCache(data){
  if(data['ext'] !== undefined){
    // Save extensions
    let itemKey = "ext-" + data['housenr'] + data['zipcode'];
    sessionStorage.setItem(itemKey, JSON.stringify(data['ext']));
  }else{
    // Save housnr
    let itemKey = "housenr-" + data['zipcode'];
    sessionStorage.setItem(itemKey, JSON.stringify(data['housenr']));
  }
}

function getAutocompleteFromSessionCache(data, inp){
  let itemKey;
  if(inp === "ext" && data['housenr']){
    // Get extensions
    itemKey = "ext-" + data['housenr'] + data['zipcode'];
  }else if(inp === "housenr"){
    // Get housenr
    itemKey = "housenr-" + data['zipcode'];
  }else{
    return false;
  }
  let saved = sessionStorage.getItem(itemKey);
  return saved ? JSON.parse(saved) : false;
}