<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_account_page(false, function (Account $account) {
    if ($account->exists()) {
        echo json_encode($account->getTwoFactorAuthentication()->verify(get_form_get("token"))->getMessage());
    } else {
        echo json_encode("No account found.");
    }
});
