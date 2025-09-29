<?php
// /Config/config.php
return [
    'OPENAI_API_KEY' => 'minkode',
    'OPENAI_MODEL'   => 'gpt-4o',
    'OPENAI_BASE'    => 'https://api.openai.com/v1',
    'TIMEOUT'        => 60,

    // ← match navnet du faktisk har lagt i /config/
    'CA_BUNDLE'      => __DIR__ . '/cacert-2025-08-12.pem',
];
