<?php

return [

    'paths' => [
        'api/*',
        'mdrrmo/bookings/public',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://booking.estancia.website',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];
