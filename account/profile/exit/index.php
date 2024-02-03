<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_page(false, function (Account $account) {
    echo json_encode($account->getActions()->logOut()->getMessage());
});