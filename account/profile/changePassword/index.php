<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_page(true, function (Account $account, bool $isLoggedIn) {
    $token = get_form_get("token");

    if (!empty($token)) {
        if (isset($_POST["change"])) {
            $password = get_form_post("password");

            if ($password == get_form_post("repeat_password")) {
                $result = $account->getPassword()->completeChange($token, $password);
                $result = $result->getMessage();

                if (!empty($result)) {
                    if ($isLoggedIn) {
                        account_page_redirect($account, true, $result);
                    } else {
                        account_page_redirect(null, false, $result);
                    }
                } else {
                    account_page_redirect(null, false, null);
                }
            } else {
                redirect_to_url("?message=Passwords do not match each other&token=$token");
            }
        }

        echo "<div class='area'>
                <div class='area_form'>
                    <form method='post'>
                        <input type='password' name='password' placeholder='New Password' minlength=8 maxlength=64>
                        <input type='password' name='repeat_password' placeholder='Repeat New Password' minlength=8 maxlength=64>
                        <input type='submit' name='change' value='Complete Change Password' class='button' id='blue'>
                    </form>
                </div>
            </div>";
    } else {
        account_page_redirect($account, true, null);
    }
});
