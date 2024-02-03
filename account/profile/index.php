<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_page(false, function (Account $account) {
    if ($account->exists()) {
        echo json_encode($account->getObject());
        echo "<br><a href='" . get_user_url() . "exit'>Log Out</a>";
    } else {
        if (isset($_POST["log_in"])) {
            if (!is_google_captcha_valid()) {
                echo json_encode("Please complete the bot verification.");
            } else {
                $email = get_form_post("email");

                if (!is_email($email)) {
                    redirect_to_url("?message=Please enter a valid email address");
                } else {
                    $account = $account->getNew(null, $email);

                    if ($account->exists()) {
                        $result = $account->getActions()->logIn(get_form_post("password"));

                        if ($result->isPositiveOutcome()) {
                            $redirectURL = $forceRedirectURL !== null ? $forceRedirectURL : get_form_get("redirectURL");

                            if (get_domain_from_url($redirectURL, true) == get_domain(false)) {
                                redirect_to_url($redirectURL);
                            } else {
                                echo json_encode($result->getMessage());
                            }
                        } else {
                            echo json_encode($result->getMessage());
                        }
                    } else {
                        echo json_encode(null, "Account with this email does not exist.");
                    }
                }
            }
        }
        echo "<form method='post'>
                <input type='email' name='email' placeholder='Email Address' minlength=5 maxlength=384>
                <input type='password' name='password' placeholder='Password' minlength=8 maxlength=384>
                <input type='submit' name='log_in' value='Log In'>

                 <div class='recaptcha'>
                    <div class='g-recaptcha' data-sitekey=6Lf_zyQUAAAAAAxfpHY5Io2l23ay3lSWgRzi_l6B></div>
                </div>
            </form>";
    }
}, "profile");
