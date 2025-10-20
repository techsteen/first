<?php

declare(strict_types=1);

class OpenAIClient
{
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public static function fromConfigFile(string $path): self
    {
        if (!file_exists($path)) {
            throw new RuntimeException("Konfigurationsfilen blev ikke fundet: {$path}");
        }

        $config = require $path;
        if (!is_array($config)) {
            throw new RuntimeException('Konfigurationsfilen skal returnere et array.');
        }

        return new self($config);
    }

    public function chat(array $messages, array $options = []): array
    {
        $model = $options['model'] ?? ($this->config['OPENAI_MODEL'] ?? null);
        if (!$model) {
            throw new RuntimeException('Ingen model defineret for OpenAI kaldet.');
        }

        $payload = array_merge(
            [
                'model' => $model,
                'messages' => $messages,
                'temperature' => $options['temperature'] ?? 0.2,
            ],
            $options
        );

        unset($payload['model'], $payload['messages']);

        $body = array_merge(
            [
                'model' => $model,
                'messages' => $messages,
            ],
            $payload
        );

        $apiKey = $this->config['OPENAI_API_KEY'] ?? null;
        if (!$apiKey) {
            throw new RuntimeException('OPENAI_API_KEY er ikke sat i config.');
        }

        $baseUrl = rtrim($this->config['OPENAI_BASE'] ?? 'https://api.openai.com/v1', '/');
        $url = $baseUrl . '/chat/completions';

        $ch = curl_init($url);
        if ($ch === false) {
            throw new RuntimeException('Kunne ikke initialisere cURL.');
        }

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ];

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => (int)($this->config['TIMEOUT'] ?? 60),
        ]);

        if (!empty($this->config['CA_BUNDLE']) && file_exists($this->config['CA_BUNDLE'])) {
            curl_setopt($ch, CURLOPT_CAINFO, $this->config['CA_BUNDLE']);
        }

        $responseBody = curl_exec($ch);
        if ($responseBody === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException('cURL fejl: ' . $error);
        }

        $statusCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        $data = json_decode($responseBody, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Kunne ikke parse svar fra OpenAI: ' . json_last_error_msg());
        }

        if ($statusCode >= 400) {
            $message = $data['error']['message'] ?? 'Ukendt fejl fra OpenAI API.';
            throw new RuntimeException('OpenAI API fejl: ' . $message);
        }

        return $data;
    }
}
