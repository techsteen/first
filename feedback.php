<?php

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require __DIR__ . '/config/ai_feedback.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$answer = $input['answer'] ?? '';
$solution = $input['solution'] ?? '';
$explanation = $input['explanation'] ?? '';
$responseType = $input['responseType'] ?? 'numeric';
$question = $input['question'] ?? '';

$result = generateAiFeedback($answer, $solution, $responseType, [
    'question' => $question,
    'explanation' => $explanation,
]);

if ($result['status'] !== 'correct' && $explanation) {
    $result['messages'][] = "Husk metoden: {$explanation}";
}

echo json_encode($result);
