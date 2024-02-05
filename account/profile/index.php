<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_account_page(false, function (Account $account) {
    if ($account->exists()) {
        if (array_key_exists("message", $_GET)) {
            redirect_to_url("?");
        }
        $year = date("Y");
        $month = (int)date("m");
        echo "<style>body { font-size: 20px; }</style>";
        echo json_encode($account->getObject());
        echo "<p><a href='https://www.idealistic.ai/contents/?path=finance/input&year=$year&month=$month&domain=vagdedes.com'>Financial Input</a>";
        echo "<p><a href='https://www.idealistic.ai/contents/?path=finance/output&year=$year&month=$month&domain=vagdedes.com'>Financial Output</a>";
        echo "<p><a href='https://www.idealistic.ai/contents/?path=spigotmc/premium/anticheats&year=$year&month=$month&domain=vagdedes.com'>AntiCheat Sales</a>";
        echo "<p><a href='https://docs.google.com/document/d/1EcHFvfM6EgmXVsfpCK-_T3Stfdtg2WTgdg9kIKtdxcM/edit'>My Finances</a>";
        echo "<p><a href='https://www.idealistic.ai/contents/?path=account/panel&platform=1&id=25638'>User Details</a>";
        echo "<p><a href='https://www.idealistic.ai/contents/?path=testing&domain=10.0.0.3'>Testing Page</a>";
        echo "<p><a href='https://wallet.tebex.io'>Tebex Wallet</a>";
        echo "<p><a href='https://myaccount.epsilonnet.gr'>Invoice Tools</a>";
        echo "<p><a href='https://dashboard.stripe.com/'>Stripe</a>";
        echo "<p><a href='" . get_user_url() . "exit'>Log Out</a>";
    } else {
        if (isset($_POST["log_in"])) {
            if (!is_google_captcha_valid()) {
                echo json_encode("Please complete the bot verification.");
            } else {
                $email = get_form_post("email");

                if (!is_email($email)) {
                    echo json_encode("Please enter a valid email address.");
                } else {
                    $account = $account->getNew(null, $email);

                    if ($account->exists()) {
                        $result = $account->getActions()->logIn(get_form_post("password"));

                        if ($result->isPositiveOutcome()) {
                            redirect_to_url(get_user_url());
                        } else {
                            echo json_encode($result->getMessage());
                        }
                    } else {
                        echo json_encode(null, "Account with this email address does not exist.");
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
