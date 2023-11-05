<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_page(true, function () {
    global $website_account_url;
    redirect_to_url($website_account_url . "/profile");
});
