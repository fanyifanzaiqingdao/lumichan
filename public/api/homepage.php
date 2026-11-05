<?php
require __DIR__ . "/_public_content.php";
require __DIR__ . '/_lib.php';
require __DIR__ . '/_homepage.php';

api_cors_and_method(['GET']);

$json = content_homepage();

public_content_json( ['ok' => true, 'homepage' => homepage_public($json)]);
