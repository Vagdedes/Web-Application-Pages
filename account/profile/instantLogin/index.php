<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_page(false, function (Account $account, bool $isLoggedIn) {
    if ($isLoggedIn) {
        account_page_redirect($account, true, null);
    } else {
        $twoFactor = $account->getTwoFactorAuthentication();
        $twoFactor = $twoFactor->verify(get_form_get("token"));
        account_page_redirect($twoFactor->getObject(), $twoFactor->isPositiveOutcome(), $twoFactor->getMessage());
    }
});
