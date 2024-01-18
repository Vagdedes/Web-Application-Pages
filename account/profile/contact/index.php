<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_page(true, function (Account $account, bool $isLoggedIn) {
    if (isset($_POST["contact"])) {
        $emailForm = get_form_post("email");
        $subject = get_form_post("subject");
        $info = get_form_post("info");
        $subjectString = strlen($subject);
        $infoString = strlen($info);

        if (($isLoggedIn || is_email($emailForm) && strlen($emailForm) <= 384)
            && $subjectString >= 2 && $subjectString <= 64
            && $infoString >= 24 && $infoString <= 512) {
            $cacheKey = array(get_client_ip_address(), "contact-form");

            if (!$isLoggedIn && !is_google_captcha_valid()) {
                account_page_redirect(null, false, "Please complete the captcha before contacting us.", false);
            } else if (has_memory_cooldown($cacheKey, null, false)) {
                account_page_redirect($account, $isLoggedIn, "Please wait a few minutes before contacting us again.", false);
            } else {
                $content = $account->getEmail()->getSupportEmailDetails($isLoggedIn, $subject, $info, $emailForm);

                if (services_self_email($content[0], $content[1], $content[2])) {
                    has_memory_cooldown($cacheKey, "5 minutes");
                    account_page_redirect($account, $isLoggedIn, "Thanks for taking the time to contact us.");
                } else {
                    global $email_default_email_name;
                    account_page_redirect($account, $isLoggedIn, "An error occurred, please contact us at: " . $email_default_email_name, false);
                }
            }
        } else {
            account_page_redirect($account, $isLoggedIn, "Invalid form details.", false);
        }
    }
    echo "<div class='area' id='darker'>
                <div class='area_logo'>
                    <div class='paper'>
                        <ul>
                            <li class='paper_top'></li>
                            <li></li>
                            <li></li>
                            <li></li>
                            <li></li>
                            <li></li>
                            <li></li>
                            <li></li>
                            <li></li>
                            <li></li>
                        </ul>
                    </div>
                </div>
                <div class='area_title'>
                    Contact Form
                </div>
                <div class='area_text'>
                    Contact us by using the form below.
                </div>
                <div class='area_form'>
                    <form method='post'>";

    if (!$isLoggedIn) {
        echo "<input type='email' name='email' placeholder='Email Address' minlength=5 maxlength=384>";
    }
    echo "<input type='text' name='subject' placeholder='Subject' minlength=2 maxlength=64>
                        <textarea name='info' placeholder='Information regarding communication...' minlength=24 maxlength=2048
                                  style='height: 150px; min-height: 150px;'></textarea>
                        <input type='submit' name='contact' value='Contact Us' class='button' id='blue'>";

    if (!$isLoggedIn) {
        echo "<div class=recaptcha>
                <div class=g-recaptcha data-sitekey=6Lf_zyQUAAAAAAxfpHY5Io2l23ay3lSWgRzi_l6B></div>
            </div>";
    }
    echo "</form></div></div>";
}, true, true);