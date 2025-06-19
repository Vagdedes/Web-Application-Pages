<?php
header('Content-type: text/plain');
echo @file_get_contents("https://raw.githubusercontent.com/IdealisticAI/Legal-Information/refs/heads/main/terms/terms_of_service.txt");