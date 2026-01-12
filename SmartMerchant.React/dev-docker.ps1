# Stop and remove container if it exists
docker stop SmartMerchant.React 2>$null
docker rm SmartMerchant.React 2>$null

# Run the container
Write-Host ""
Write-Host "  DOCKER.VITE v7.2.4  ready in 0 ms" -ForegroundColor Green
Write-Host ""

# Get local IP address for network URL
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*" } | Select-Object -First 1).IPAddress
if (-not $localIP) {
    $localIP = "localhost"
}

Write-Host "    Local:   " -NoNewline
Write-Host "http://localhost:7771/" -ForegroundColor Cyan
Write-Host "    Network: " -NoNewline
Write-Host "http://${localIP}:7771/" -ForegroundColor Cyan
Write-Host ""

$containerId = docker run -d -p 7771:80 --name SmartMerchant.React smartmerchant-react

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Container started: " -NoNewline -ForegroundColor Green
    Write-Host "SmartMerchant.React" -ForegroundColor Cyan
    Write-Host "  ✓ Container ID: " -NoNewline -ForegroundColor Green
    Write-Host "$containerId" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  ready." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "  ✗ Failed to start container" -ForegroundColor Red
    exit 1
}
