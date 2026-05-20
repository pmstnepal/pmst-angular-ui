# Download PMST Logo
$logoUrl = "https://pmstusnepal.com/wp-content/uploads/2025/03/pmstusnepal.png"
$outputPath = "d:\pmstmigrate\src\assets\images\logo\pmst-logo.png"

# Ensure directory exists
$dir = Split-Path $outputPath -Parent
if (!(Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# Download logo
Write-Host "Downloading logo from $logoUrl..."
try {
    $response = Invoke-WebRequest -Uri $logoUrl -UseBasicParsing -MaximumRedirection 5
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Content-Type: $($response.Headers['Content-Type'])"
    Write-Host "Size: $($response.Content.Length) bytes"
    
    # Check if it's a PNG
    $bytes = $response.Content
    $pngHeader = [byte[]](0x89, 0x50, 0x4E, 0x47)  # PNG magic bytes
    $isPng = $true
    for ($i = 0; $i -lt 4; $i++) {
        if ($bytes[$i] -ne $pngHeader[$i]) {
            $isPng = $false
            break
        }
    }
    
    if ($isPng) {
        [System.IO.File]::WriteAllBytes($outputPath, $bytes)
        Write-Host "✓ PNG logo saved successfully to $outputPath" -ForegroundColor Green
    } else {
        Write-Host "✗ Downloaded file is not a PNG (starts with: $($bytes[0..20])" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}
