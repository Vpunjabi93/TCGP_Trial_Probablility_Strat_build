$ErrorActionPreference = "Stop"
$outDir = "C:\Users\vivek\.gemini\antigravity\scratch\tcgp-deck-builder\data"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

function Map-Rarity {
    param([string]$RarityStr)
    switch ($RarityStr) {
        "One Diamond"   { return "◇" }
        "Two Diamond"   { return "◇◇" }
        "Three Diamond" { return "◇◇◇" }
        "Four Diamond"  { return "◇◇◇◇" }
        "One Star"      { return "☆" }
        "Two Star"      { return "☆☆" }
        "Three Star"    { return "☆☆☆" }
        "Crown"         { return "👑" }
        "None"          { return "" }
        default         { return $RarityStr }
    }
}

function Fetch-Set {
    param([string]$SetId, [string]$SetName, [string]$VarName, [string]$FileName)
    
    $outPath = Join-Path $outDir $FileName
    if (Test-Path $outPath) {
        Write-Host "Skipping $SetId (already exists)"
        return
    }

    Write-Host "Fetching set: $SetId..."
    
    $headers = @{ "User-Agent" = "PowerShell/1.0" }
    
    try {
        $setData = Invoke-RestMethod -Uri "https://api.tcgdex.net/v2/en/sets/$SetId" -Headers $headers
    } catch {
        Write-Host "Failed to list set $SetId"
        return
    }
    
    $allCards = @()
    $count = 0
    $total = $setData.cards.Length

    # For performance, we can do batches but powershell runspaces are complex.
    # Sequential is fine, total ~500 reqs takes ~1.5 mins
    foreach ($shortCard in $setData.cards) {
        $cId = $shortCard.id
        try {
            $detail = Invoke-RestMethod -Uri "https://api.tcgdex.net/v2/en/cards/$cId" -Headers $headers
        } catch {
            Write-Host "Failed to fetch card $cId"
            continue
        }
        
        $numPart = $cId.Split('-')[1]
        
        $rarityVal = ""
        if ($null -ne $detail.rarity) { $rarityVal = $detail.rarity }
        $rarity = Map-Rarity $rarityVal
        
        $type = "Colorless"
        if ($null -ne $detail.types -and $detail.types.length -gt 0) { $type = $detail.types[0] }
        elseif ($detail.category -eq 'Trainer' -and $null -ne $detail.trainerType) { $type = $detail.trainerType }

        $hp = 0
        if ($null -ne $detail.hp) { $hp = [int]$detail.hp }
        
        $stage = "Basic"
        if ($null -ne $detail.stage) { $stage = $detail.stage }
        elseif ($detail.category -eq 'Trainer') { $stage = "Trainer" }
        
        $weakness = ""
        if ($null -ne $detail.weaknesses -and $detail.weaknesses.Length -gt 0) { $weakness = $detail.weaknesses[0].type }
        
        $retreatCost = 0
        if ($null -ne $detail.retreat) { $retreatCost = [int]$detail.retreat }

        # Keep values as proper types
        $cardObj = [ordered]@{
            id = $cId;
            name = $detail.name;
            set = $SetName;
            setCode = $SetId;
            rarity = $rarity;
            type = $type;
            hp = $hp;
            stage = $stage;
            weakness = $weakness;
            retreatCost = $retreatCost;
            img = "https://assets.tcgdex.net/en/tcgp/$SetId/$numPart/high.webp"
        }
        $allCards += $cardObj
        
        $count++
        if ($count % 50 -eq 0 -or $count -eq $total) {
            Write-Host "Fetched $count / $total"
        }
    }
    
    $jsonOutput = $allCards | ConvertTo-Json -Depth 10 -Compress
    $fileContent = "const ${VarName} = ${jsonOutput};"
    $outPath = Join-Path $outDir $FileName
    [IO.File]::WriteAllText($outPath, $fileContent, [System.Text.Encoding]::UTF8)
    Write-Host "Saved $FileName"
}

Fetch-Set "A1" "Genetic Apex" "SET_A1" "set_a1.js"
Fetch-Set "A1a" "Mythical Island" "SET_A1A" "set_a1a.js"
Fetch-Set "A2" "Space-Time Smackdown" "SET_A2" "set_a2.js"
Fetch-Set "A2a" "Triumphant Light" "SET_A2A" "set_a2a.js"
Fetch-Set "A2b" "Shining Revelry" "SET_A2B" "set_a2b.js"
Fetch-Set "A3" "Celestial Guardians" "SET_A3" "set_a3.js"
Fetch-Set "A3a" "Extradimensional Crisis" "SET_A3A" "set_a3a.js"
Fetch-Set "A3b" "Eevee Grove" "SET_A3B" "set_a3b.js"
Fetch-Set "A4" "Wisdom of Sea and Sky" "SET_A4" "set_a4.js"
Fetch-Set "A4a" "Secluded Springs" "SET_A4A" "set_a4a.js"
Fetch-Set "B1" "Mega Rising" "SET_B1" "set_b1.js"
Fetch-Set "B1a" "Crimson Blaze" "SET_B1A" "set_b1a.js"
Fetch-Set "B2" "Fantastical Parade" "SET_B2" "set_b2.js"
Fetch-Set "P-A" "Promo-A" "SET_PA" "set_pa.js"

Write-Host "DONE"
