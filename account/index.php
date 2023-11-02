<?php
require_once '/var/www/.structure/library/design/account/loader.php';
load_page(true, function () {
    global $website_account_url;
    redirect_to_url($website_account_url . "/profile");
});
