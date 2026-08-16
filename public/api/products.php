<?php
require __DIR__ . '/_lib.php';

api_cors_and_method(['GET']);

$all = isset($_GET['all']) && $_GET['all'] === '1';
$products = products_load(!$all);

api_json(200, ['ok' => true, 'products' => $products]);
