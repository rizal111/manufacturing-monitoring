<?php

return [
    'shifts' => [
        'morning' => ['start' => '06:00', 'end' => '14:00'],
        'afternoon' => ['start' => '14:00', 'end' => '22:00'],
        'night' => ['start' => '22:00', 'end' => '06:00'],
    ],

    'working_hours_per_day' => env('PRODUCTION_WORKING_HOURS', 16),

    'oee_targets' => [
        'availability' => env('OEE_TARGET_AVAILABILITY', 90),
        'performance' => env('OEE_TARGET_PERFORMANCE', 95),
        'quality' => env('OEE_TARGET_QUALITY', 99),
        'overall' => env('OEE_TARGET_OVERALL', 85),
    ],

    'downtime_categories' => [
        'mechanical' => 'Mechanical Issues',
        'electrical' => 'Electrical Issues',
        'material' => 'Material Shortage',
        'operator' => 'Operator Related',
        'changeover' => 'Product Changeover',
        'other' => 'Other',
    ],

    'cache_ttl' => [
        'dashboard' => env('CACHE_TTL_DASHBOARD', 300), // 5 minutes
        'reports' => env('CACHE_TTL_REPORTS', 900), // 15 minutes
    ],
];
