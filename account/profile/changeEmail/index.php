<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_page(true, function (Account $account, bool $isLoggedIn) {
    $token = get_form_get("token");

    if (!empty($token)) {
        $result = $account->getEmail()->completeVerification($token);
        account_page_redirect($account, true, $result->getMessage());
    } else if ($isLoggedIn && isset($_POST["change"])) {
        $result = $account->getEmail()->requestVerification(get_form_post("email"));
        $result = $result->getMessage();

        if (!empty($result)) {
            $account->getNotifications()->add(AccountNotifications::FORM, "green", $result, "1 minute");
        }
    }
    account_page_redirect($account, $isLoggedIn, null);
});
