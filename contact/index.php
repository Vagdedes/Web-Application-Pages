<!DOCTYPE html>
<html lang="en">
<?php
require_once '/var/www/.structure/library/base/utilities.php';

if (!isset($websiteTitle)) {
    $websiteTitle = "Idealistic AI";
}
if (!isset($domain)) {
    $domain = get_domain();
}
if (!isset($design_directory)) {
    $design_directory = "/var/www/.structure/library/design/account/";
}
?>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title><?php echo $websiteTitle ?></title>
    <meta name="description"
          content="Vagdedes Services powers dozens of Minecraft servers with high-quality plugins. Complete this form to communicate with us.">
    <link rel="shortcut icon" type="image/png" href="https://<?php echo $domain ?>/.images/icon.png">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href='https://<?php echo $domain ?>/.css/universal.css?id=<?php echo rand(0, 2147483647) ?>'>
    <script src="https://www.google.com/recaptcha/api.js"></script>
</head>

<body>

<?php
include($design_directory . "/footer/footerNavigation.php");
require_once '/var/www/.structure/library/base/form.php';
$email = get_form_post("email");
$subject = get_form_post("subject");
$info = get_form_post("info");

$emailString = strlen($email);
$subjectString = strlen($subject);
$infoString = strlen($info);

if ($emailString >= 6 && $emailString <= 384
    && $subjectString >= 2 && $subjectString <= 64
    && $infoString >= 24 && $infoString <= 512) {
    require_once '/var/www/.structure/library/base/communication.php';
    require_once '/var/www/.structure/library/base/cookies.php';
    require_once '/var/www/.structure/library/memory/init.php';

    $cacheKey = array(
        get_client_ip_address(),
        "contact-form"
    );

    if (!is_google_captcha_valid()) {
        echo "<div class='message'>Please complete the bot verification</div>";
    } else if (has_memory_cooldown($cacheKey, null, false)) {
        echo "<div class='message'>Please wait a few minutes before contacting us again</div>";
    } else {
        require_once '/var/www/.structure/library/base/requirements/account_systems.php';
        $application = new Application(null);
        $session = $application->getAccountSession();
        $session = $session->getSession();
        $platformsString = null;

        if ($session->isPositiveOutcome()) {
            $accounts = $session->getObject()->getAccounts()->getAdded();

            if (!empty($accounts)) {
                $platformsString = "Accounts:\r\n";

                foreach ($accounts as $account) {
                    $platformsString .= $account->accepted_account->name . ": " . $account->credential . "\r\n";
                }
                $platformsString .= "\r\n";
            }
        }
        $id = rand(0, 2147483647);
        $email = strip_tags($email);
        $subject = strip_tags($subject);
        $title = get_domain() . " - $subject [ID: $id]";
        $content = "ID: $id" . "\r\n"
            . "Subject: $subject" . "\r\n"
            . "Email: $email" . "\r\n"
            . "\r\n"
            . ($platformsString !== null ? $platformsString : "")
            . strip_tags($info);

        if (services_self_email($email, $title, $content)) {
            has_memory_cooldown($cacheKey, "5 minutes");
            echo "<div class='message'>Thanks for taking the time to contact us</div>";
        } else {
            echo "<div class='message'>An error occurred, please contact us at: $email_default_email_name</div>";
        }
    }
}
?>

<div class="area" id="darker">
    <div class="area_logo">
        <div class="paper">
            <ul>
                <li class="paper_top"></li>
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
    <div class="area_title">
        Contact Form
    </div>
    <div class="area_text">
        Contact us by using the form below.
    </div>
    <div class="area_form">
        <form method="post">
            <input type="text" name="email" placeholder="Email Address" minlength=5 maxlength=384>
            <input type="text" name="subject" placeholder="Subject" minlength=2 maxlength=64>
            <textarea name="info" placeholder="Information regarding contact..." minlength=24 maxlength=512
                      style="height: 150px; min-height: 150px;"></textarea>
            <input type="submit" value="CONTACT US" class="button" id="green">

            <div class=recaptcha>
                <div class=g-recaptcha data-sitekey=6Lf_zyQUAAAAAAxfpHY5Io2l23ay3lSWgRzi_l6B></div>
            </div>
        </form>
    </div>
</div>

<?php include($design_directory . "/footer/footer.php"); ?>
</body>

</html>
