# Nextpertise Zipcheck Wordpress Plugin

## Installation
You can download a ZIP version of the plugin [here](https://github.com/Nextpertise/wordpress-zipcheck/archive/master.zip). This ZIP can be uploaded to your WordPress installation (WP Admin -> Plugins -> Add New -> Upload Plugin). After installing the plugin, don't forget to enable it on the plugins page!

## Requirements
This plugin adds a lot of capabilities to a form, but, for customizability, it doesn't add the form itself. In order for the plugin to work correctly, your HTML needs to follow some requirements:

 *  Form needs to have the class `zipcode-form`.
 *  Form needs to have autocomplete turned off (`autocomplete="off"`).
 *  Form needs to have the following 3 inputs, with at least these attributes. Feel free to add classes, name, id, etc.
    - `<input type="text" class="zipcheck-zipcode" required>` 
    - `<input type="text" class="zipcheck-housenr" required>`
    - `<input type="text" class="zipcheck-ext">`
 * Every input needs to have a parent `<div class="form-grp">` of which the input is the only child. The `div` is used to append the autocomplete & dropdown icon.  
 * On your results page, there needs to be a `<div class="postcode-result">`. All the results will be appended to this box. Results will automatically be ordered in the correct way.

## Optional features
 * On your results page, you can add a loader (spinning circle, wait message, etc.) with classes `postcode-result-box` and `spinner-box`. This loader will automatically be hidden when results are loaded.
 * On your results page, you can add a container with class `.postcode-text-part`. When there is at least one result, this container will contain a `h2` element with the adress and a `p` element with extra info. If there are no results, this container will contain a `h2` element with an error.

## Configuration
* Input your Nextpertise API Basic Auth credentials on the plugin settings page (WP Admin -> Settings -> Zipcheck).
* Specify the results page on the plugin settings page. You should input the WordPress title of the page. There is an autocomplete dropdown that will help you.

## Customizing
You can add your own CSS to the form directly, or via extra classes. The results can be customized by editing the following classes:
 * `postcode-result`
 * `postcode-result-box` (Contains both results and loader.) 
 * `result-item` (Will always be used together with `postcode-result-box`. Selector: `.postcode-result-box.result-item`).
 * `postcode-left-part`
 * `postcode-right-part`
 * `postcode-text-part`

## Example HTML Form
```
<form class="zipcode-form" autocomplete="off" action="postcode-check/">
   <div class="row">

      <!-- Zipcode input -->
      <div class="form-grp">
         <input name="zipcheck-zipcode" type="text" class="input-grp zipcheck-zipcode" placeholder="Postcode" required>
      </div>

      <!-- Housenumber input with dropdownlist  -->
      <div class="form-grp">
         <input name="zipcheck-housenr" type="text" class="input-grp zipcheck-housenr" placeholder="Huisnummer" required>
      </div>

      <!-- Housenumber extenstion with dropdownlist -->
      <div class="form-grp">
         <input name="zipcheck-ext" type="text" class="input-grp zipcheck-ext"  placeholder="Toevoeging">
      </div>

      <!-- Submit button -->
      <button type="submit">Zoek</button>

   </div>
</form>
  ```
   
