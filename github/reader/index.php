<?php
require_once '/var/www/.structure/library/base/utilities.php';

require_once '/var/www/.structure/library/memory/init.php';

$path = $_GET["path"] ?? "";
$cacheKey = array(
    "github-reader",
    $path
);
$file = get_key_value_pair($cacheKey);

if ($file === null) {
    $file = @file_get_contents("https://github.com/IdealisticAI/" . $path);
    $noFile = $file === false;
    set_key_value_pair($cacheKey, $noFile ? "" : $file, "5 minutes");

    if ($noFile) {
        exit();
    }
}
echo $file;
?>
<script type="text/javascript">
    window.onload = function () {
        document.getElementsByTagName("body")[0].innerHTML = document.getElementsByClassName("Box-sc-g0xbh4-0 etfROT")[0].innerHTML;
    }
</script>
