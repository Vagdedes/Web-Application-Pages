<?php
require '/var/www/.structure/library/account/api/tasks/loader.php';
load_account_page(function (Account $account) {
    echo @json_encode($account->getActions()->logOut()->getMessage());
});