<?php
declare(strict_types=1);

/**
 * Synchronises shared configuration assets from the central distribution host.
 *
 * This allows multiple simulations to stay aligned without manually uploading
 * the same support files everywhere.
 */
function sync_shared_config_files(): void
{
    $targets = [
        __DIR__ . '/config.php' => 'config.php',
        dirname(__DIR__) . '/web.config' => 'web.config',
        __DIR__ . '/cacert-2025-08-12.pem' => 'cacert-2025-08-12.pem',
        dirname(__DIR__) . '/.gitignore' => '.gitignore',
    ];

    $remoteVariants = [
        'config.php' => ['config.php', 'config.php.txt', 'config.txt'],
        'web.config' => ['web.config', 'web.config.txt', 'web-config.txt'],
        'cacert-2025-08-12.pem' => ['cacert-2025-08-12.pem'],
        '.gitignore' => ['.gitignore', 'gitignore', '.gitignore.txt'],
    ];

    $metadataFile = __DIR__ . '/.central-sync.json';
    $metadata = load_sync_metadata($metadataFile);
    $now = time();
    $baseUrls = resolve_remote_base_urls();

    foreach ($targets as $localPath => $remoteName) {
        $lastSync = $metadata[$remoteName]['synced_at'] ?? 0;
        $previousSource = $metadata[$remoteName]['source'] ?? null;

        if ($lastSync > ($now - 86400) && file_exists($localPath)) {
            continue;
        }

        $variantList = $remoteVariants[$remoteName] ?? [$remoteName];
        $attempts = [];
        $synced = false;

        foreach ($baseUrls as $baseUrl) {
            foreach ($variantList as $remoteFile) {
                $remoteUrl = concatenate_remote_url($baseUrl, $remoteFile);
                $result = download_remote_contents($remoteUrl);

                if ($result['success'] === true) {
                    if (ensure_directory(dirname($localPath))) {
                        if (file_put_contents($localPath, $result['contents']) !== false) {
                            $metadata[$remoteName] = [
                                'synced_at' => $now,
                                'source' => $remoteUrl,
                            ];
                            $synced = true;
                            break 2;
                        }

                        error_log(sprintf('[central-sync] Failed to write %s', $localPath));
                    } else {
                        error_log(sprintf('[central-sync] Failed to create directory %s', dirname($localPath)));
                    }
                }

                $attempts[] = format_failed_attempt($remoteUrl, $result);
            }
        }

        if (!$synced) {
            $previous = $previousSource ? sprintf(' (previous source: %s)', $previousSource) : '';
            error_log(sprintf('[central-sync] Unable to fetch %s after trying: %s%s', $remoteName, implode('; ', $attempts), $previous));
        }
    }

    save_sync_metadata($metadataFile, $metadata);
}

/**
 * @return array{success:bool, contents?:string, status?:int|null, error?:string|null}
 */
function download_remote_contents(string $url): array
{
    $allowUrlFopen = filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    $lastError = null;

    if ($allowUrlFopen !== false) {
        $contents = @file_get_contents($url);
        if ($contents !== false) {
            return ['success' => true, 'contents' => $contents, 'status' => 200];
        }

        $error = error_get_last();
        if ($error !== null) {
            $lastError = $error['message'] ?? null;
        }
    }

    if (!function_exists('curl_init')) {
        return ['success' => false, 'status' => null, 'error' => $lastError ?? 'cURL extension not available'];
    }

    $ch = curl_init($url);
    if ($ch === false) {
        return ['success' => false, 'status' => null, 'error' => 'Unable to initialise cURL'];
    }

    $curlOptions = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_USERAGENT => 'central-sync/1.1',
    ];

    if (stripos($url, 'https://') === 0) {
        $curlOptions[CURLOPT_SSL_VERIFYPEER] = true;
        $curlOptions[CURLOPT_SSL_VERIFYHOST] = 2;

        $caBundle = locate_local_ca_bundle();
        if ($caBundle !== null) {
            $curlOptions[CURLOPT_CAINFO] = $caBundle;
        }

        if (defined('CURLSSLOPT_NO_REVOKE')) {
            $curlOptions[CURLOPT_SSL_OPTIONS] = (int) CURLSSLOPT_NO_REVOKE;
        }
    }

    curl_setopt_array($ch, $curlOptions);

    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE) ?: null;

    if ($response === false) {
        $errorCode = curl_errno($ch);
        $errorMessage = curl_error($ch) ?: 'Unknown cURL error';

        if (stripos($url, 'https://') === 0 && should_retry_without_tls_validation($errorCode)) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            $response = curl_exec($ch);
            $status = curl_getinfo($ch, CURLINFO_HTTP_CODE) ?: null;

            if ($response !== false) {
                curl_close($ch);

                if ($status !== null && $status >= 200 && $status < 300) {
                    return ['success' => true, 'contents' => $response, 'status' => $status];
                }

                return ['success' => false, 'status' => $status, 'error' => null];
            }

            $fallbackMessage = curl_error($ch) ?: $errorMessage;
            curl_close($ch);

            return ['success' => false, 'status' => $status, 'error' => $errorMessage . ' | retry without verify failed: ' . $fallbackMessage];
        }

        curl_close($ch);

        return ['success' => false, 'status' => $status, 'error' => $errorMessage];
    }

    curl_close($ch);

    if ($status !== null && $status >= 200 && $status < 300) {
        return ['success' => true, 'contents' => $response, 'status' => $status];
    }

    return ['success' => false, 'status' => $status, 'error' => null];
}

/**
 * @return array<string, array{synced_at:int, source?:string}>
 */
function load_sync_metadata(string $path): array
{
    if (!file_exists($path)) {
        return [];
    }

    $raw = file_get_contents($path);
    if ($raw === false) {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return [];
    }

    return $data;
}

/**
 * @param array<string, array{synced_at:int, source?:string}> $metadata
 */
function save_sync_metadata(string $path, array $metadata): void
{
    if (!ensure_directory(dirname($path))) {
        error_log(sprintf('[central-sync] Failed to create metadata directory %s', dirname($path)));
        return;
    }

    file_put_contents($path, json_encode($metadata, JSON_PRETTY_PRINT));
}

function ensure_directory(string $directory): bool
{
    if (is_dir($directory)) {
        return true;
    }

    return mkdir($directory, 0775, true) || is_dir($directory);
}

/**
 * @return list<string>
 */
function resolve_remote_base_urls(): array
{
    $candidates = [];

    $envOverride = getenv('CENTRAL_CONFIG_BASE_URL');
    if (is_string($envOverride) && trim($envOverride) !== '') {
        $candidates[] = $envOverride;
    }

    $listFile = __DIR__ . '/central_source.txt';
    if (is_readable($listFile)) {
        $lines = file($listFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines !== false) {
            foreach ($lines as $line) {
                $candidates[] = $line;
            }
        }
    }

    $hostCandidates = build_host_specific_candidates();
    foreach ($hostCandidates as $candidate) {
        $candidates[] = $candidate;
    }

    $candidates[] = 'http://stha2.web.techcollege.dk/Config/';
    $candidates[] = 'https://stha2.web.techcollege.dk/Config/';
    $candidates[] = 'http://stha2.web.techcollege.dk/config/';
    $candidates[] = 'https://stha2.web.techcollege.dk/config/';

    $normalised = [];
    foreach ($candidates as $candidate) {
        $candidate = trim($candidate);
        if ($candidate === '') {
            continue;
        }

        if (substr($candidate, -1) !== '/') {
            $candidate .= '/';
        }

        $normalised[$candidate] = true;
    }

    return array_keys($normalised);
}

function concatenate_remote_url(string $baseUrl, string $remoteFile): string
{
    return $baseUrl . ltrim($remoteFile, '/');
}

function locate_local_ca_bundle(): ?string
{
    static $cached = false;
    static $path = null;

    if ($cached) {
        return $path;
    }

    $cached = true;

    $candidates = [
        __DIR__ . '/cacert-2025-08-12.pem',
        __DIR__ . '/cacert.pem',
        dirname(__DIR__) . '/config/cacert-2025-08-12.pem',
        dirname(__DIR__) . '/config/cacert.pem',
    ];

    foreach ($candidates as $candidate) {
        if (is_readable($candidate)) {
            $path = $candidate;
            return $path;
        }
    }

    return null;
}

function should_retry_without_tls_validation(int $curlError): bool
{
    $retryable = [];
    if (defined('CURLE_SSL_CONNECT_ERROR')) {
        $retryable[] = (int) CURLE_SSL_CONNECT_ERROR;
    }
    if (defined('CURLE_SSL_CACERT')) {
        $retryable[] = (int) CURLE_SSL_CACERT;
    }
    if (defined('CURLE_PEER_FAILED_VERIFICATION')) {
        $retryable[] = (int) CURLE_PEER_FAILED_VERIFICATION;
    }

    return in_array($curlError, $retryable, true);
}

/**
 * @return list<string>
 */
function build_host_specific_candidates(): array
{
    $results = [];

    if (empty($_SERVER['HTTP_HOST'])) {
        return $results;
    }

    $host = $_SERVER['HTTP_HOST'];

    $path = '';
    if (!empty($_SERVER['SCRIPT_NAME'])) {
        $path = dirname($_SERVER['SCRIPT_NAME']);
    }

    $segments = array_values(array_filter(explode('/', trim($path, '/'))));

    for ($i = count($segments); $i >= 1; $i--) {
        $prefix = implode('/', array_slice($segments, 0, $i));
        if ($prefix === '') {
            continue;
        }

        $results[] = 'http://' . $host . '/' . $prefix . '/Config/';
        $results[] = 'https://' . $host . '/' . $prefix . '/Config/';
        $results[] = 'http://' . $host . '/' . $prefix . '/config/';
        $results[] = 'https://' . $host . '/' . $prefix . '/config/';
    }

    $results[] = 'http://' . $host . '/Config/';
    $results[] = 'https://' . $host . '/Config/';
    $results[] = 'http://' . $host . '/config/';
    $results[] = 'https://' . $host . '/config/';

    return $results;
}

/**
 * @param array{success:bool, status?:int|null, error?:string|null} $result
 */
function format_failed_attempt(string $remoteUrl, array $result): string
{
    $details = [];

    if (isset($result['status']) && $result['status'] !== null) {
        $details[] = 'HTTP ' . $result['status'];
    }

    if (isset($result['error']) && $result['error']) {
        $details[] = $result['error'];
    }

    if (empty($details)) {
        return $remoteUrl;
    }

    return sprintf('%s (%s)', $remoteUrl, implode(', ', $details));
}

sync_shared_config_files();
