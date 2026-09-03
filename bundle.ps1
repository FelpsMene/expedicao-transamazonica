$html = Get-Content 'C:\Users\mellos\.gemini\antigravity\scratch\expedicao-transamazonica\index.html' -Raw -Encoding UTF8
$css = Get-Content 'C:\Users\mellos\.gemini\antigravity\scratch\expedicao-transamazonica\style.css' -Raw -Encoding UTF8
$audio = Get-Content 'C:\Users\mellos\.gemini\antigravity\scratch\expedicao-transamazonica\js\audio.js' -Raw -Encoding UTF8
$vehicles = Get-Content 'C:\Users\mellos\.gemini\antigravity\scratch\expedicao-transamazonica\js\vehicles.js' -Raw -Encoding UTF8
$obstacles = Get-Content 'C:\Users\mellos\.gemini\antigravity\scratch\expedicao-transamazonica\js\obstacles.js' -Raw -Encoding UTF8
$game = Get-Content 'C:\Users\mellos\.gemini\antigravity\scratch\expedicao-transamazonica\js\game.js' -Raw -Encoding UTF8

$html = $html.Replace('<link rel="stylesheet" href="style.css">', "<style>`n$css`n</style>")
$combinedJS = "<script>`n$audio`n$vehicles`n$obstacles`n$game`n</script>"

$html = $html.Replace('<script src="js/audio.js"></script>', $combinedJS)
$html = $html.Replace('<script src="js/vehicles.js"></script>', '')
$html = $html.Replace('<script src="js/obstacles.js"></script>', '')
$html = $html.Replace('<script src="js/game.js"></script>', '')

[System.IO.File]::WriteAllText('C:\Users\mellos\.gemini\antigravity\scratch\expedicao-transamazonica\jogo-completo-arquivo-unico.html', $html, [System.Text.Encoding]::UTF8)
Write-Host "SUCESSO: Arquivo standalone gerado com sucesso!"
