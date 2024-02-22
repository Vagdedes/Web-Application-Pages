<?php
require_once '/var/www/.structure/library/base/utilities.php';
require_once '/var/www/.structure/library/memory/init.php';

$website = "https://www.idealistic.ai";
$path = $_GET["path"];
$division = "Box-sc-g0xbh4-0 cTsUqU js-snippet-clipboard-copy-unpositioned";
$cacheKey = array(
    "github-reader",
    $path
);
$file = get_key_value_pair($cacheKey);

if ($file === null) {
    $file = @file_get_contents("https://github.com/IdealisticAI/"
        . ($_GET["repo"] ?? ".github")
        . "/blob/main/"
        . ($_GET["path"] ?? "README") . ".md");
    set_key_value_pair($cacheKey, $file, "5 minutes");
}
if ($file === false) {
    header("Location: " . $website);
    exit();
} else {
    echo $file;
}
?>
<script type="text/javascript">
    window.onload = function () {
        let element = document.body.getElementsByClassName("<?php echo $division; ?>");

        if (element.length > 0) {
            document.body.innerHTML = element[0].innerHTML;
            document.title = "Idealistic AI";
            document.querySelector('meta[name="description"]').setAttribute("content", "Science, technology & engineering.");

            for (let i = 0; i < document.scripts.length; i++) {
                document.scripts[i].remove();
            }
        } else {
            window.location.replace("<?php echo $website?>");
        }
    };
</script>