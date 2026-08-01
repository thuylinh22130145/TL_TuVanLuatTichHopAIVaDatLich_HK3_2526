$ErrorActionPreference = 'Stop'

$serverAiDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $serverAiDir '.env'
$pythonPath = Join-Path $serverAiDir '.venv\Scripts\python.exe'

if (-not (Test-Path -LiteralPath $envPath)) {
    Copy-Item -LiteralPath (Join-Path $serverAiDir '.env.example') -Destination $envPath
}
if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw 'Không tìm thấy .venv. Hãy tạo môi trường Python và cài requirements.txt trước.'
}

$secureKey = Read-Host 'Dán Gemini API key mới (nội dung sẽ được ẩn)' -AsSecureString
$key = [Net.NetworkCredential]::new('', $secureKey).Password.Trim()
if (-not $key) {
    throw 'API key không được để trống.'
}

$model = 'gemini-3.5-flash-lite'
$env:GEMINI_API_KEY = $key
$env:GEMINI_MODEL = $model

try {
    & $pythonPath -c "import os; from google import genai; c=genai.Client(api_key=os.environ['GEMINI_API_KEY']); r=c.models.generate_content(model=os.environ['GEMINI_MODEL'], contents='Tra loi chinh xac mot tu: OK'); assert (r.text or '').strip(); print('GEMINI_CONNECTION_OK')"
    if ($LASTEXITCODE -ne 0) { throw 'Gemini từ chối API key hoặc model.' }

    $text = [IO.File]::ReadAllText($envPath)
    if ($text -match '(?m)^GEMINI_API_KEY=') {
        $text = [regex]::Replace($text, '(?m)^GEMINI_API_KEY=.*$', "GEMINI_API_KEY=$key")
    } else {
        $text = $text.TrimEnd() + "`r`nGEMINI_API_KEY=$key`r`n"
    }
    if ($text -match '(?m)^GEMINI_MODEL=') {
        $text = [regex]::Replace($text, '(?m)^GEMINI_MODEL=.*$', "GEMINI_MODEL=$model")
    } else {
        $text = $text.TrimEnd() + "`r`nGEMINI_MODEL=$model`r`n"
    }
    [IO.File]::WriteAllText($envPath, $text, [Text.UTF8Encoding]::new($false))

    Write-Host 'Đã kiểm tra và lưu GEMINI_API_KEY vào server-ai/.env.' -ForegroundColor Green
    Write-Host 'Hãy restart Server-AI để áp dụng key.' -ForegroundColor Yellow
} finally {
    Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:GEMINI_MODEL -ErrorAction SilentlyContinue
    Remove-Variable key, secureKey -ErrorAction SilentlyContinue
}
