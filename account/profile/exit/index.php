<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_page(false, function (Account $account, bool $isLoggedIn) {
    global $website_account_url;

    if ($isLoggedIn && $account->getActions()->logOut()->isPositiveOutcome()) {
        redirect_to_url($website_account_url . "/profile/?message=You have been logged out");
    } else {
        redirect_to_url($website_account_url . "/profile");
    }
});