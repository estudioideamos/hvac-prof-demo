$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:4173/")
$listener.Start()

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $relativePath = $context.Request.Url.AbsolutePath.TrimStart("/")

    if ([string]::IsNullOrWhiteSpace($relativePath)) {
      $relativePath = "index.html"
    }

    $safeRelativePath = $relativePath.Replace("/", "\")
    $fullPath = Join-Path $root $safeRelativePath

    if ((Test-Path -LiteralPath $fullPath) -and -not (Get-Item -LiteralPath $fullPath).PSIsContainer) {
      $bytes = [System.IO.File]::ReadAllBytes($fullPath)
      $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()

      switch ($extension) {
        ".html" { $context.Response.ContentType = "text/html; charset=utf-8" }
        ".css" { $context.Response.ContentType = "text/css; charset=utf-8" }
        ".js" { $context.Response.ContentType = "application/javascript; charset=utf-8" }
        ".png" { $context.Response.ContentType = "image/png" }
        ".jpg" { $context.Response.ContentType = "image/jpeg" }
        ".jpeg" { $context.Response.ContentType = "image/jpeg" }
        ".svg" { $context.Response.ContentType = "image/svg+xml; charset=utf-8" }
        default { $context.Response.ContentType = "application/octet-stream" }
      }

      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    else {
      $context.Response.StatusCode = 404
    }

    $context.Response.OutputStream.Close()
  }
}
finally {
  $listener.Stop()
}
