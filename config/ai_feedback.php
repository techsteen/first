<?php

require_once __DIR__ . '/openai.php';

function generateAiFeedback(string $userAnswer, $solution, string $responseType = 'numeric', array $context = []): array {
    $normalizedUser = trim(str_replace(',', '.', strtolower($userAnswer)));
    $feedback = [];

    if ($responseType === 'explanation') {
        if ($normalizedUser === '') {
            return [
                'status' => 'incomplete',
                'messages' => ['Skriv din forklaring, så kan jeg give dig feedback.'],
            ];
        }

        $question = $context['question'] ?? '';
        $teacherNote = $context['explanation'] ?? '';
        $ideal = is_string($solution) ? $solution : (string) $solution;

        $messages = [
            [
                'role' => 'system',
                'content' => 'Du vurderer elevsvar i matematik (procentregning). Vær anerkendende, men ærlig.',
            ],
            [
                'role' => 'user',
                'content' => json_encode([
                    'question' => $question,
                    'ideal_answer' => $ideal,
                    'teacher_note' => $teacherNote,
                    'student_answer' => $userAnswer,
                ], JSON_UNESCAPED_UNICODE),
            ],
        ];

        try {
            $raw = callOpenAiChat($messages, [
                'temperature' => 0.4,
                'max_tokens' => 350,
            ]);
            $ai = json_decode($raw, true);
            if (!is_array($ai) || !isset($ai['feedback'])) {
                throw new RuntimeException('Uventet AI-svar.');
            }

            $status = $ai['status'] ?? 'try_again';
            if (!in_array($status, ['correct', 'try_again', 'incomplete'], true)) {
                $status = 'try_again';
            }

            $messagesOut = $ai['feedback'];
            if (!is_array($messagesOut) || empty($messagesOut)) {
                $messagesOut = ['Godt forsøg! Overvej at forklare alle trin tydeligt.'];
            }

            return [
                'status' => $status,
                'messages' => array_map('strval', $messagesOut),
            ];
        } catch (Throwable $e) {
            return [
                'status' => 'try_again',
                'messages' => [
                    'Jeg kunne ikke hente AI-feedback lige nu. Tjek om din forklaring beskriver udregning, procent og konklusion.',
                ],
            ];
        }
    }

    if ($normalizedUser === '') {
        $feedback[] = "Prøv at skrive et svar, så kan jeg hjælpe dig videre.";
        return ['status' => 'incomplete', 'messages' => $feedback];
    }

    if (is_numeric($solution)) {
        $userNumber = filter_var($normalizedUser, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        if ($userNumber === '' || !is_numeric($userNumber)) {
            $feedback[] = "Jeg kunne ikke genkende dit svar som et tal. Forsøg at skrive det som et decimaltal eller procent.";
        } else {
            $numericUser = (float) $userNumber;
            $difference = abs($numericUser - (float) $solution);
            if ($difference < 0.001) {
                $feedback[] = "Super! Dit svar passer helt præcist.";
                return ['status' => 'correct', 'messages' => $feedback];
            }

            $relativeError = $difference / max(0.001, abs($solution));
            if ($relativeError < 0.02) {
                $feedback[] = "Du er meget tæt på. Tjek lige en gang til for afrunding eller en decimal.";
            } elseif ($numericUser < $solution) {
                $feedback[] = "Dit svar er for lavt. Overvej om du skal gange eller dividere med procenten.";
            } else {
                $feedback[] = "Dit svar er for højt. Måske har du ganget hvor du skulle dividere?";
            }
        }
    } else {
        $normalizedSolution = strtolower(trim($solution));
        if ($normalizedUser === $normalizedSolution) {
            $feedback[] = "Ja! Det er den rigtige metode.";
            return ['status' => 'correct', 'messages' => $feedback];
        }

        if (strpos($normalizedUser, '%') === false && strpos($normalizedSolution, '%') !== false) {
            $feedback[] = "Husk at angive dit svar i procent.";
        } else {
            $feedback[] = "Overvej, om du har beskrevet den fulde metode. Brug hint-knappen hvis du sidder fast.";
        }
    }

    if (empty($feedback)) {
        $feedback[] = "Godt forsøgt! Prøv at gennemgå trin for trin: procentdelen, grundtallet og udregningen.";
    }

    return ['status' => 'try_again', 'messages' => $feedback];
}
