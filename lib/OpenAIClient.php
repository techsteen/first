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
        if (!is_readable($path)) {
            throw new RuntimeException("Konfigurationsfilen blev ikke fundet: {$path}");
        }

        $loaded = require $path;
        $config = self::normalizeConfig($loaded, dirname($path));

        return new self($config);
    }

    public static function fromConfigDirectory(string $directory): self
    {
        $config = self::loadFromDirectory($directory);
        if ($config === null) {
            throw new RuntimeException("Kunne ikke finde en konfigurationsfil i {$directory}");
        }

        return new self($config);
    }

    public static function fromDefaultLocations(): self
    {
        $candidates = self::defaultConfigCandidates();

        foreach ($candidates as $candidate) {
            if (!$candidate) {
                continue;
            }

            $resolved = realpath($candidate) ?: $candidate;

            if (is_file($resolved) && is_readable($resolved)) {
                return self::fromConfigFile($resolved);
            }

            if (is_dir($resolved)) {
                $config = self::loadFromDirectory($resolved);
                if ($config !== null) {
                    return new self($config);
                }
            }
        }

        $envConfig = self::configFromEnvironment();
        if ($envConfig !== null) {
            return new self($envConfig);
        }

        throw new RuntimeException('Kunne ikke finde config.php. Angiv SIMULATOR_CONFIG_PATH eller placer filen i config/ eller Config/.');
    }

    private static function defaultConfigCandidates(): array
    {
        $paths = [];

        $envPath = getenv('SIMULATOR_CONFIG_PATH');
        if (is_string($envPath) && $envPath !== '') {
            $paths[] = $envPath;
        }

        $root = dirname(__DIR__);
        $parent = dirname($root);

        $candidates = [
            $root . '/config',
            $root . '/Config',
            $parent . '/config',
            $parent . '/Config',
        ];

        foreach ($candidates as $candidate) {
            if (!in_array($candidate, $paths, true)) {
                $paths[] = $candidate;
            }
        }

        return $paths;
    }

    private static function loadFromDirectory(string $directory): ?array
    {
        if (!is_dir($directory)) {
            return null;
        }

        $configFiles = ['config.php', 'config.phg'];
        foreach ($configFiles as $file) {
            $path = rtrim($directory, '/\\') . DIRECTORY_SEPARATOR . $file;
            if (is_readable($path)) {
                $loaded = require $path;
                return self::normalizeConfig($loaded, $directory);
            }
        }

        return null;
    }

    /**
     * @param mixed $loaded
     */
    private static function normalizeConfig($loaded, string $configDir): array
    {
        if (is_array($loaded)) {
            $config = $loaded;
        } elseif (is_string($loaded)) {
            $config = ['OPENAI_API_KEY' => trim($loaded)];
        } else {
            throw new RuntimeException('Konfigurationsfilen skal returnere et array eller en streng.');
        }

        if (isset($config['OPENAI_API_KEY'])) {
            $config['OPENAI_API_KEY'] = trim((string) $config['OPENAI_API_KEY']);
        }

        if (empty($config['OPENAI_API_KEY'])) {
            $envKey = getenv('OPENAI_API_KEY');
            if (is_string($envKey) && trim($envKey) !== '') {
                $config['OPENAI_API_KEY'] = trim($envKey);
            }
        }

        if (isset($config['CA_BUNDLE'])) {
            $caCandidate = trim((string) $config['CA_BUNDLE']);
            if ($caCandidate !== '') {
                if (!is_readable($caCandidate)) {
                    $relativeCandidate = rtrim($configDir, '/\\') . DIRECTORY_SEPARATOR . ltrim($caCandidate, '/\\');
                    if (is_readable($relativeCandidate)) {
                        $caCandidate = $relativeCandidate;
                    }
                }

                if (is_readable($caCandidate)) {
                    $config['CA_BUNDLE'] = $caCandidate;
                } else {
                    unset($config['CA_BUNDLE']);
                }
            } else {
                unset($config['CA_BUNDLE']);
            }
        }

        if (!isset($config['CA_BUNDLE'])) {
            $defaultCa = rtrim($configDir, '/\\') . DIRECTORY_SEPARATOR . 'cacert.pem';
            if (is_readable($defaultCa)) {
                $config['CA_BUNDLE'] = $defaultCa;
            }
        }

        foreach (['OPENAI_MODEL', 'OPENAI_BASE'] as $key) {
            if (empty($config[$key])) {
                $envValue = getenv($key);
                if (is_string($envValue) && trim($envValue) !== '') {
                    $config[$key] = trim($envValue);
                }
            }
        }

        if (empty($config['TIMEOUT'])) {
            $timeoutEnv = getenv('OPENAI_TIMEOUT');
            if (!is_string($timeoutEnv) || trim($timeoutEnv) === '') {
                $timeoutEnv = getenv('TIMEOUT');
            }

            if (is_string($timeoutEnv) && trim($timeoutEnv) !== '') {
                $config['TIMEOUT'] = (int) trim($timeoutEnv);
            }
        }

        if (empty($config['OPENAI_API_KEY'])) {
            throw new RuntimeException('OPENAI_API_KEY er ikke sat i config eller miljøvariabler.');
        }

        return $config;
    }

    private static function configFromEnvironment(): ?array
    {
        $apiKey = getenv('OPENAI_API_KEY');
        if (!is_string($apiKey) || trim($apiKey) === '') {
            return null;
        }

        $config = [
            'OPENAI_API_KEY' => trim($apiKey),
        ];

        foreach (['OPENAI_MODEL', 'OPENAI_BASE'] as $key) {
            $envValue = getenv($key);
            if (is_string($envValue) && trim($envValue) !== '') {
                $config[$key] = trim($envValue);
            }
        }

        $timeoutEnv = getenv('OPENAI_TIMEOUT');
        if (!is_string($timeoutEnv) || trim($timeoutEnv) === '') {
            $timeoutEnv = getenv('TIMEOUT');
        }

        if (is_string($timeoutEnv) && trim($timeoutEnv) !== '') {
            $config['TIMEOUT'] = (int) trim($timeoutEnv);
        }

        return $config;
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
