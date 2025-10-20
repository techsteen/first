<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../lib/OpenAIClient.php';

$configPath = __DIR__ . '/../config/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Konfigurationsfilen mangler. Kopiér config/config.example.php til config/config.php og udfyld API-nøglen.'
    ]);
    exit;
}

try {
    $client = OpenAIClient::fromConfigFile($configPath);
    $response = $client->chat([
        [
            'role' => 'system',
            'content' => 'Du er en hjælpeagent der genererer JSON-data til en programmeringssimulator. Besvar altid med gyldig JSON.'
        ],
        [
            'role' => 'user',
            'content' => json_encode([
                'instruction' => 'Generér 6 niveauer med hver 3 opgaver til en robot-simulator på et 8x8 bræt.',
                'requirements' => [
                    'Inkluder felterne id, level, title, objective, learningFocus, templates, board og tips for hver opgave.',
                    'Templates skal have nøglerne c og powershell og indeholde kort startkode. Brug \n til linjeskift.',
                    'board skal indeholde size, start(x,y,direction), goal(x,y), obstacles(array af objekter med x og y), checkpoints (kan være tom), revealOnRun(boolean) og randomizeObstacles(boolean).',
                    'Niveau 3 skal fokusere på synlige forhindringer (revealOnRun = false) og have mindst to obstacles pr opgave.',
                    'Andre niveauer må gerne bruge skjulte forhindringer (revealOnRun true) hvis relevant.',
                    'Nummerér id som "niveau-opgave" f.eks. "1-1".',
                    'Hold tekst på dansk og maks 140 tegn pr tips/tekstfelt hvor det giver mening.'
                ]
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        ]
    ], [
        'temperature' => 0.4,
        'response_format' => [
            'type' => 'json_schema',
            'json_schema' => [
                'name' => 'task_collection',
                'schema' => [
                    'type' => 'object',
                    'required' => ['tasks'],
                    'properties' => [
                        'tasks' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'required' => ['id', 'level', 'title', 'objective', 'learningFocus', 'templates', 'board'],
                                'properties' => [
                                    'id' => ['type' => 'string'],
                                    'level' => ['type' => 'integer'],
                                    'title' => ['type' => 'string'],
                                    'objective' => ['type' => 'string'],
                                    'learningFocus' => ['type' => 'string'],
                                    'tips' => [
                                        'type' => 'array',
                                        'items' => ['type' => 'string']
                                    ],
                                    'templates' => [
                                        'type' => 'object',
                                        'required' => ['c', 'powershell'],
                                        'properties' => [
                                            'c' => ['type' => 'string'],
                                            'powershell' => ['type' => 'string']
                                        ]
                                    ],
                                    'board' => [
                                        'type' => 'object',
                                        'required' => ['size', 'start', 'goal', 'obstacles', 'checkpoints', 'revealOnRun', 'randomizeObstacles'],
                                        'properties' => [
                                            'size' => ['type' => 'integer'],
                                            'start' => [
                                                'type' => 'object',
                                                'required' => ['x', 'y', 'direction'],
                                                'properties' => [
                                                    'x' => ['type' => 'integer'],
                                                    'y' => ['type' => 'integer'],
                                                    'direction' => ['type' => 'string']
                                                ]
                                            ],
                                            'goal' => [
                                                'type' => 'object',
                                                'required' => ['x', 'y'],
                                                'properties' => [
                                                    'x' => ['type' => 'integer'],
                                                    'y' => ['type' => 'integer']
                                                ]
                                            ],
                                            'obstacles' => [
                                                'type' => 'array',
                                                'items' => [
                                                    'type' => 'object',
                                                    'required' => ['x', 'y'],
                                                    'properties' => [
                                                        'x' => ['type' => 'integer'],
                                                        'y' => ['type' => 'integer']
                                                    ]
                                                ]
                                            ],
                                            'checkpoints' => [
                                                'type' => 'array',
                                                'items' => [
                                                    'type' => 'object',
                                                    'required' => ['x', 'y'],
                                                    'properties' => [
                                                        'x' => ['type' => 'integer'],
                                                        'y' => ['type' => 'integer']
                                                    ]
                                                ]
                                            ],
                                            'revealOnRun' => ['type' => 'boolean'],
                                            'randomizeObstacles' => ['type' => 'boolean']
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);

    $content = $response['choices'][0]['message']['content'] ?? null;
    $data = is_string($content) ? json_decode($content, true) : null;
    if (!$data || !isset($data['tasks']) || !is_array($data['tasks'])) {
        throw new RuntimeException('Svaret fra modellen indeholdt ikke gyldige opgaver.');
    }

    echo json_encode([
        'success' => true,
        'tasks' => $data['tasks']
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
