<?php
declare(strict_types=1);
ini_set('display_errors', '0');

// Formulario de contacto desarrollado por Estudio Ideamos para HVAC PROF.

const HVAC_RECIPIENT = 'info@hvacprof.com.ar';
const HVAC_SENDER = 'info@hvacprof.com.ar';
const HVAC_ALLOWED_HOSTS = ['hvacprof.com.ar', 'www.hvacprof.com.ar'];
const HVAC_MAX_REQUEST_BYTES = 20000;
const HVAC_RATE_LIMIT = 5;
const HVAC_RATE_WINDOW = 900;
const HVAC_GLOBAL_RATE_LIMIT = 60;

function wants_json(): bool
{
    return strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
}

function respond(bool $success, string $message, int $status = 200): void
{
    http_response_code($status);
    header('Cache-Control: no-store, max-age=0');
    header('X-Content-Type-Options: nosniff');

    if (wants_json()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(
            ['success' => $success, 'message' => $message],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        exit;
    }

    $state = $success ? 'ok' : 'error';
    header("Location: contacto.html?estado={$state}#formulario-contacto", true, 303);
    exit;
}

function clean_field(string $key, int $maxLength): string
{
    $value = $_POST[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }

    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');
    return function_exists('mb_substr')
        ? mb_substr($value, 0, $maxLength, 'UTF-8')
        : substr($value, 0, $maxLength);
}

function request_is_same_origin(): bool
{
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') return false;
    if (empty($_SERVER['HTTP_ORIGIN']) && empty($_SERVER['HTTP_REFERER'])) return false;
    foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $headerName) {
        $value = $_SERVER[$headerName] ?? '';
        if ($value === '') {
            continue;
        }

        $host = strtolower((string) parse_url($value, PHP_URL_HOST));
        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));
        $port = parse_url($value, PHP_URL_PORT);
        if ($scheme !== 'https' || !in_array($host, HVAC_ALLOWED_HOSTS, true) || ($port !== null && $port !== 443)) {
            return false;
        }
    }

    return true;
}

function rate_limit_exceeded(): bool
{
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    // Private, bounded storage outside public_html; never create one file per IP.
    $directory = dirname(__DIR__) . '/.hvacprof-private';
    if (is_link($directory) || (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory))) {
        respond(false, 'El formulario no está disponible. Contactanos por WhatsApp.', 503);
    }
    $rateFile = $directory . '/contact-rate.json';
    if (is_link($rateFile)) respond(false, 'El formulario no está disponible.', 503);
    $now = time();
    $handle = @fopen($rateFile, 'c+');

    if ($handle === false) {
        respond(false, 'El formulario no está disponible. Contactanos por WhatsApp.', 503);
    }
    @chmod($rateFile, 0600);

    try {
        if (!flock($handle, LOCK_EX)) {
            respond(false, 'El formulario no está disponible. Contactanos por WhatsApp.', 503);
        }

        $contents = stream_get_contents($handle);
        $timestamps = json_decode($contents ?: '[]', true);
        if (!is_array($timestamps)) {
            respond(false, 'El formulario no está disponible. Contactanos por WhatsApp.', 503);
        }

        $timestamps = array_values(array_filter(
            $timestamps,
            static fn ($record): bool => is_array($record) && isset($record['time'], $record['ip']) && is_int($record['time']) && $record['time'] > $now - HVAC_RATE_WINDOW
        ));

        $ipHash = hash('sha256', $ipAddress);
        $emailHash = hash('sha256', strtolower(clean_field('email', 180)));
        $fingerprint = hash('sha256', $emailHash . clean_field('mensaje', 4000));
        $emailAttempts = count(array_filter($timestamps, static fn ($record): bool => ($record['email'] ?? '') === $emailHash));
        $duplicate = count(array_filter($timestamps, static fn ($record): bool => ($record['fingerprint'] ?? '') === $fingerprint));
        $ipAttempts = count(array_filter($timestamps, static fn ($record): bool => $record['ip'] === $ipHash));
        if ($duplicate > 0 || $emailAttempts >= 3 || $ipAttempts >= HVAC_RATE_LIMIT || count($timestamps) >= HVAC_GLOBAL_RATE_LIMIT) {
            header('Retry-After: ' . HVAC_RATE_WINDOW);
            return true;
        }

        $timestamps[] = ['time' => $now, 'ip' => $ipHash, 'email' => $emailHash, 'fingerprint' => $fingerprint];
        ftruncate($handle, 0);
        rewind($handle);
        $encoded = json_encode($timestamps);
        if (fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) {
            respond(false, 'El formulario no está disponible. Contactanos por WhatsApp.', 503);
        }
        return false;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'Método no permitido.', 405);
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > HVAC_MAX_REQUEST_BYTES) {
    respond(false, 'La consulta supera el tamaño permitido.', 413);
}

if (!request_is_same_origin()) {
    respond(false, 'No se pudo validar el origen de la consulta.', 403);
}

if (clean_field('website', 200) !== '') {
    respond(true, 'Gracias. Recibimos tu consulta y te responderemos a la brevedad.');
}

$startedAt = filter_input(INPUT_POST, 'form_started_at', FILTER_VALIDATE_INT);
if (is_int($startedAt) && $startedAt > 0 && time() - $startedAt < 3) {
    respond(true, 'Gracias. Recibimos tu consulta y te responderemos a la brevedad.');
}

$name = clean_field('nombre', 100);
$company = clean_field('empresa', 120);
$email = clean_field('email', 180);
$phone = clean_field('telefono', 50);
$consultation = clean_field('consulta', 40);
$deadline = clean_field('plazo', 120);
$message = clean_field('mensaje', 4000);

$consultationTypes = [
    'presupuesto' => 'Presupuesto de fabricación y montaje',
    'planos' => 'Envío de planos y documentación',
    'piezas' => 'Piezas especiales o accesorios',
    'tecnica' => 'Consulta técnica',
];

if (
    strlen($name) < 2
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || preg_match('/[\r\n]/', $email)
    || strlen($message) < 10
    || !array_key_exists($consultation, $consultationTypes)
) {
    respond(false, 'Revisá los campos obligatorios e intentá nuevamente.', 422);
}

$body = implode("\n", [
    'Nueva consulta desde hvacprof.com.ar',
    '-----------------------------------',
    "Nombre: {$name}",
    'Empresa: ' . ($company !== '' ? $company : 'No informada'),
    "Email: {$email}",
    'Teléfono: ' . ($phone !== '' ? $phone : 'No informado'),
    "Tipo de consulta: {$consultationTypes[$consultation]}",
    'Plazo estimado: ' . ($deadline !== '' ? $deadline : 'No informado'),
    '',
    'Mensaje:',
    $message,
    '',
    'Datos técnicos:',
    'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'No disponible'),
    'Fecha: ' . date('Y-m-d H:i:s T'),
]);

$subject = 'Nueva consulta web - HVAC PROF';
// Limit link-heavy unsolicited promotions without rejecting normal project details.
if (preg_match_all('~https?://|www\.~i', $message) > 2) {
    respond(false, 'Incluí como máximo dos enlaces en la consulta.', 422);
}
if (rate_limit_exceeded()) {
    respond(false, 'La consulta ya fue enviada o alcanzaste el límite. Esperá 15 minutos antes de reenviar.', 429);
}
if (function_exists('mb_encode_mimeheader')) {
    $subject = mb_encode_mimeheader($subject, 'UTF-8');
}

$headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: HVAC PROF Web <' . HVAC_SENDER . '>',
    'Reply-To: ' . $email,
    'X-Mailer: HVAC-PROF-Website',
]);

$sent = function_exists('mail') && @mail(HVAC_RECIPIENT, $subject, $body, $headers);
if (!$sent) {
    respond(false, 'No pudimos enviar la consulta. Por favor, intentá nuevamente.', 500);
}

respond(true, 'Gracias. Recibimos tu consulta y te responderemos a la brevedad.');
