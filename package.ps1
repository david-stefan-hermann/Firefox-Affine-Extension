$ErrorActionPreference = 'Stop'

$zipName = 'affine-sidebar-extension.zip'
$zipPath = [System.IO.Path]::GetFullPath($zipName)

if (Test-Path $zipPath) { Remove-Item $zipPath }

Add-Type -Assembly System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

$rootFiles = @(
    'manifest.json',
    'background.js',
    'content.js',
    'popup.html',
    'popup.css',
    'popup.js',
    'sidebar.html',
    'sidebar.css',
    'sidebar.js'
)

foreach ($file in $rootFiles) {
    $fullPath = [System.IO.Path]::GetFullPath($file)
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $file) | Out-Null
}

@('icon-16.png', 'icon-48.png', 'icon-96.png') | ForEach-Object {
    $fullPath = [System.IO.Path]::GetFullPath("icons\$_")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, "icons/$_") | Out-Null
}

$zip.Dispose()

Write-Host "Done! $zipName is ready to upload to AMO."
