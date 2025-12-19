<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_account_page(function (Account $account) {
    if ($account->exists()) {
        echo json_encode("Your account is already verified.");
    } else if ($account->getPermissions()->isAdministrator()) {
        echo json_encode($account->getTwoFactorAuthentication()->verify(get_form_get("token"))->getMessage());
    } else {
        echo json_encode("You must be an administrator to verify two-factor authentication.");
    }
});
