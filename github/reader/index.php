<?php
$website = "https://www.idealistic.ai";

if (array_key_exists("path", $_GET)) {
    require_once '/var/www/.structure/library/base/utilities.php';
    require_once '/var/www/.structure/library/memory/init.php';

    $path = $_GET["path"];
    $division = "Box-sc-g0xbh4-0 cTsUqU js-snippet-clipboard-copy-unpositioned";
    $cacheKey = array(
        "github-reader",
        $path
    );
    $file = get_key_value_pair($cacheKey);

    if ($file === null || $file === false) {
        $file = @file_get_contents("https://github.com/IdealisticAI/.github/blob/main/" . $path . ".md");
        set_key_value_pair($cacheKey, $file, "5 minutes");

        if ($file === false) {
            header("Location: " . $website);
            exit();
        }
    }
    echo $file;
} else {
    header("Location: " . $website);
    exit();
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