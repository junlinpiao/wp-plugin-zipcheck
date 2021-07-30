<?php
/**
* Plugin Name: Nextpertise Postcode Check
* Description: Nextpertise plugin that checks the services we can provide at a certain adress.
* Version: 0.1
* Author: Nathan Klumpenaar | Nextpertise
* Author URI: https://www.nextpertise.nl/
**/

/// --------------------------------------------------------------------------------------------------------------
/// ADMIN/SETTINGS PAGE
/// --------------------------------------------------------------------------------------------------------------


/// Register settings page functions
add_action('admin_menu', 'nextzipcheck_create_settings_page');
add_action('admin_init', 'nextzipcheck_setup_settings_sections');
add_action('admin_init', 'nextzipcheck_setup_input_fields');

/// Create settings page
function nextzipcheck_create_settings_page() {
    // Add the menu item and page
    $page_title = 'Zipcheck Settings';
    $menu_title = 'Zipcheck';
    $capability = 'manage_options';
    $slug = 'nextzipcheck_settings';
    $callback = 'nextzipcheck_create_settings_content';

    add_submenu_page('options-general.php', $page_title, $menu_title, $capability, $slug, $callback);
}

/// Create everything on the settings page
function nextzipcheck_create_settings_content(){ ?>
    <div class="wrap">
        <h2>Zipcheck Settings</h2>
        <form method="post" action="options.php">
            <?php
                settings_fields('nextzipcheck_settings');
                do_settings_sections('nextzipcheck_settings');
                submit_button();
            ?>
        </form>
    </div> 
<?php }

function nextzipcheck_setup_settings_sections(){
    add_settings_section('nextzipcheck_api_credentials', 'Nextpertise API credentials', 'nextzipcheck_section_callback', 'nextzipcheck_settings');
    add_settings_section('nextzipcheck_results_settings', 'Results settings', 'nextzipcheck_section_callback', 'nextzipcheck_settings');
}

function nextzipcheck_section_callback($arguments) {
    switch( $arguments['id'] ){
        case 'nextzipcheck_api_credentials':
            echo 'Input your Nextpertise API Basic Auth username and key.<br>This plugin needs permissions for <i>postcodes</i> and <i>basicbroadband</i>.';
            break;
        case 'nextzipcheck_results_settings':
            echo 'These settings will affect your results page.';
            break;
    }
}

function nextzipcheck_setup_input_fields(){
    $fields = array(
        array(
            'uid' => 'nextzipcheck_username',
            'label' => 'Username',
            'section' => 'nextzipcheck_api_credentials',
            'type' => 'text',
            'options' => false,
            'placeholder' => '',
            'helper' => '',
            'supplemental' => '',
            'default' => ''
        ),
        array(
            'uid' => 'nextzipcheck_password',
            'label' => 'Password',
            'section' => 'nextzipcheck_api_credentials',
            'type' => 'password',
            'options' => false,
            'placeholder' => '',
            'helper' => '',
            'supplemental' => '',
            'default' => ''
        ),
        array(
            'uid' => 'nextzipcheck_results_page',
            'label' => 'Page',
            'section' => 'nextzipcheck_results_settings',
            'type' => 'text-datalist',
            'options' => false,
            'placeholder' => '',
            'helper' => '',
            'supplemental' => '',
            'default' => ''
        ),
    );
    foreach( $fields as $field ){
        add_settings_field($field['uid'], $field['label'], 'nextzipcheck_create_input_fields', 'nextzipcheck_settings', $field['section'], $field);
        register_setting('nextzipcheck_settings', $field['uid']);
    }
}

function nextzipcheck_create_input_fields($arguments){
    $value = get_option( $arguments['uid'] ); // Get the current value, if there is one
    if( ! $value ) { // If no value exists
        $value = $arguments['default']; // Set to our default
    }

    // Check which type of field we want
    switch( $arguments['type'] ){
        case 'text':
        case 'password':
            printf('<input name="%1$s" id="%1$s" type="%2$s" placeholder="%3$s" value="%4$s" />', $arguments['uid'], $arguments['type'], $arguments['placeholder'], $value );
            break;
        case 'text-datalist':
            printf('<input name="%1$s" id="%1$s" list="%1$s-datalist" type="%2$s" placeholder="%3$s" value="%4$s" />', $arguments['uid'], $arguments['type'], $arguments['placeholder'], $value );
            printf('<datalist id="%1$s-datalist">', $arguments['uid']);
            if($pages = get_pages()){
                foreach($pages as $page){
                    echo '<option value="' . $page->post_title . '" ' . selected( $page->post_title, $options['post_title'] ) . '>' . $page->ID . '</option>';
                }
            }
            printf('</datalist>');
            break;
    }

    // If there is help text
    if( $helper = $arguments['helper'] ){
        printf( '<span class="helper"> %s</span>', $helper );
    }

    // If there is supplemental text
    if( $supplimental = $arguments['supplemental'] ){
        printf( '<p class="description">%s</p>', $supplimental );
    }
}

/// --------------------------------------------------------------------------------------------------------------
/// ZIPCHECK PLUGIN
/// --------------------------------------------------------------------------------------------------------------


/// Adds plugin JavaScript and CSS to the page
function nextzipcheck_enqueue_scripts(){
    // CSS
    wp_register_style( 'zipcheck_css', plugin_dir_url(__FILE__).'zipcheck.css');
    wp_enqueue_style('zipcheck_css');

    // JavaScript
    wp_register_script('zipcheck-autocomplete_js', plugin_dir_url(__FILE__).'zipcheck-autocomplete.js', array('jquery'));
    wp_register_script('zipcheck-input_js', plugin_dir_url(__FILE__).'zipcheck-input.js', array('jquery', 'zipcheck-autocomplete_js'));
    wp_localize_script('zipcheck-input_js', 'zipcheck_ajax', array('ajax_url'=>admin_url('admin-ajax.php'), 'results_url'=>get_page_link(get_page_by_title(get_option('nextzipcheck_results_page')))));              
    wp_enqueue_script('jquery');
    wp_enqueue_script('zipcheck-autocomplete_js');
    wp_enqueue_script('zipcheck-input_js');

    // Following scripts only need to be enqueued on results (postcode-check) page.
    if(is_page(get_option('nextzipcheck_results_page'))){
        wp_register_script('zipcheck-results_js', plugin_dir_url(__FILE__).'zipcheck-results.js', array('jquery') );
        wp_localize_script('zipcheck-results_js', 'zipcheck_ajax', array( 'ajax_url' => admin_url( 'admin-ajax.php' )));  
        wp_enqueue_script('zipcheck-results_js');
    }
}
add_action( 'wp_enqueue_scripts', 'nextzipcheck_enqueue_scripts' );

/// Register AJAX function for both logged in and logged out users.
add_action( 'wp_ajax_nextzipcheck_get_housenr', 'nextzipcheck_get_housenr' );
add_action( 'wp_ajax_nopriv_nextzipcheck_get_housenr', 'nextzipcheck_get_housenr' );
add_action( 'wp_ajax_nextzipcheck_get_housenrext', 'nextzipcheck_get_housenrext' );
add_action( 'wp_ajax_nopriv_nextzipcheck_get_housenrext', 'nextzipcheck_get_housenrext' );
add_action( 'wp_ajax_nextzipcheck_get_all_providers', 'nextzipcheck_get_all_providers' );
add_action( 'wp_ajax_nopriv_nextzipcheck_get_all_providers', 'nextzipcheck_get_all_providers' );
add_action( 'wp_ajax_nextzipcheck_get_available_per_provider', 'nextzipcheck_get_available_per_provider' );
add_action( 'wp_ajax_nopriv_nextzipcheck_get_available_per_provider', 'nextzipcheck_get_available_per_provider' );

// returns the HTTP Authorization header. Used in CURLOPT_HTTPHEADER for each request.
function nextzipcheck_create_auth_header(){
    $username = get_option('nextzipcheck_username');
    $password = get_option('nextzipcheck_password');
    $key = base64_encode($username . ':' . $password);
    return "Authorization: Basic " . $key;
}

/// Function that handles ALL api requests.
/// Returns an array containing the response array and success bool.
function nextzipcheck_api_request($url, $request_data){
    if ( ! function_exists( 'curl_init' ) ) {
        return ['success'=>false, 'response'=> 'cURL not installed'];
    }
    $curl = curl_init();

    curl_setopt_array($curl, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => $request_data,
        CURLOPT_HTTPHEADER => array(
            nextzipcheck_create_auth_header(),
            "Content-Type: application/json",
        ),
    ));

    $response = curl_exec($curl);
    $err = curl_error($curl);
    
    if(!$err){
        return ['success'=>true, 'response'=> json_decode($response)];
    }
    return ['success'=>false, 'response'=> $err];
}


/// Function that is invoked by AJAX to get relevant housenumbers
function nextzipcheck_get_housenr(){
    $request_data = json_encode(array(
        "jsonrpc" => "2.0",
        "id" => 1,
        "method" => "get_housenrs",
        "params" => array(
            "zipcode" => strtoupper($_POST['zipcode'])
        )
    ));

    $api_request = nextzipcheck_api_request("https://api.nextpertise.nl/postcodes/v1", $request_data);

    if ($api_request['success']){
        echo json_encode($api_request['response']->result->housenrs);
    }

    wp_die();
}

/// Function that is invoked by AJAX to get relevant exentions
function nextzipcheck_get_housenrext(){
    $curl = curl_init();

    $request_data = json_encode(array(
        "jsonrpc" => "2.0",
        "id" => 1,
        "method" => "get_housenrext",
        "params" => array(
            "zipcode" => strtoupper($_POST['zipcode']),
            "housenr" => (int) strtoupper($_POST['housenr'])
        )
    ));

    $api_request = nextzipcheck_api_request("https://api.nextpertise.nl/postcodes/v1", $request_data);
    
    if($api_request['success']){
        $result = $api_request['response']->result;
        // Merges the results, only keeps the unique values, removes the empty value and converts it to a non associative array.
        $extlist = array_values(array_diff(array_unique(array_merge(["-"], $result->CADASTRAL->housenrexts, $result->KPNWBA->housenrexts, $result->KPNWEAS->housenrexts)), [""]));
        echo json_encode($extlist);
    }

    wp_die();
}

/// Function that is invoked by AJAX to get all providers
function nextzipcheck_get_all_providers(){
    $request_data = json_encode(array(
        "jsonrpc" => "2.0",
        "id" => 1,
        "method" => "list_providers",
        "params" => json_decode ("{}")
    ));

    $api_request = nextzipcheck_api_request("https://api.nextpertise.nl/broadband/v1/", $request_data);
    
    if($api_request['success']){
        $result = $api_request['response']->result;
        echo json_encode($result->providers);
    }
    wp_die();
}

/// Function that is invoked by AJAX to get an overview of the technologies and maximum speeds available at a specific location.
function nextzipcheck_get_available_per_provider(){
    $request_data = json_encode(array(
        "jsonrpc" => "2.0",
        "id" => 1,
        "method" => "zipcode",
        "params" => array(
            "zipcode" => strtoupper($_POST['zipcode']),
            "housenr" => (int) ($_POST['housenr']),
            "housenrext" => str_replace("-", "", ($_POST['housenrext'])),
            "filter" => array(
                "provider" => [$_POST['provider']]
            )
        )
    ));

    $api_request = nextzipcheck_api_request("https://api.nextpertise.nl/broadband/basic/v1", $request_data);

    if($api_request['success']){
        $result = $api_request['response']->result;
        echo json_encode($result);
    }

    wp_die();
}