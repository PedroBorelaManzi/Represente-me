$path = 'app.js'
$outPath = 'app_restored.js'
$file = [System.IO.File]::OpenRead($path)
$reader = New-Object System.IO.StreamReader($file)
$writer = New-Object System.IO.StreamWriter($outPath)

$foundFirst = $false
$skipping = $false

while (($line = $reader.ReadLine()) -ne $null) {
    if (-not $foundFirst -and $line -match 'const tdActionEdit = document.createElement\(''td''\);') {
        $writer.WriteLine($line)
        $foundFirst = $true
        $skipping = $true
        continue
    }
    
    if ($skipping) {
        if ($line -match 'const btnDocs = document.createElement\(''button''\);') {
            $skipping = $false
            $writer.WriteLine($line)
        }
        continue
    }
    
    $writer.WriteLine($line)
    
    if ($line -match 'aplicarTema\(themeOnLoad\);') {
        break
    }
}
$writer.Close()
$reader.Close()
