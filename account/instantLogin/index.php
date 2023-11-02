<?php
require_once '/var/www/.structure/library/account/api/tasks/loader.php';
load_page(false, function (Account $account, bool $isLoggedIn, AccountSession $session) {
    if ($isLoggedIn) {
        account_page_redirect($account, true, null);
    } else {
        $twoFactor = $session->getTwoFactorAuthentication();
        $twoFactor = $twoFactor->verify(get_form_get("token"));
        account_page_redirect($twoFactor->getObject(), $twoFactor->isPositiveOutcome(), $twoFactor->getMessage());
    }
});
