$appCleaned = Get-Content "app.js.cleaned" -Encoding UTF8
$out = @()
$skip = $false

for ($i = 0; $i -lt $appCleaned.Count; $i++) {
    if (-not $skip -and $appCleaned[$i] -match "MÓDULO DE PERFIL / ARQUIVOS") {
        if ($appCleaned[$i-1] -match "==========================================") {
            $out = $out[0..($out.Count-2)]
        }
        $skip = $true
    }
    
    if ($skip -and $appCleaned[$i] -match "MÓDULO DE CONFIGURAÇÕES / TEMA") {
        $skip = $false
        if ($appCleaned[$i-1] -match "==========================================") {
            $out += "// =========================================="
        }
        $out += $appCleaned[$i]
        continue
    }
    
    if (-not $skip) {
        $out += $appCleaned[$i]
    }
}

$replacementProfile = Get-Content "/tmp/replacement_profile.js" -Encoding UTF8
$append1 = Get-Content "C:\Users\Pedro\.gemini\antigravity\brain\28ad95dc-f9cd-4183-b65f-448769a38c0a\append.js" -Encoding UTF8
$append2 = Get-Content "C:\Users\Pedro\.gemini\antigravity\brain\28ad95dc-f9cd-4183-b65f-448769a38c0a\append2.js" -Encoding UTF8
$append3 = Get-Content "C:\Users\Pedro\.gemini\antigravity\brain\28ad95dc-f9cd-4183-b65f-448769a38c0a\append3.js" -Encoding UTF8
$baixar = Get-Content "C:\Users\Pedro\.gemini\antigravity\brain\28ad95dc-f9cd-4183-b65f-448769a38c0a\baixar_pedido.js" -Encoding UTF8
$missing = Get-Content "/tmp/missing_features.js" -Encoding UTF8

$final = $out + $replacementProfile + $append1 + $append2 + $append3 + $baixar + $missing

Set-Content -Path "app.js" -Value $final -Encoding UTF8
Write-Output "Compiled successfully."
