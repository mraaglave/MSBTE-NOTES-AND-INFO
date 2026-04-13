$f = "c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\Notes\Manual\manual-blank.html"
$c = [System.IO.File]::ReadAllText($f)
$old = '    <meta name="author" content="MSBTE Notes &amp; Info Team">' + "`r`n" + '    <link rel="canonical"'
$new = '    <meta name="author" content="MSBTE Notes &amp; Info Team">' + "`r`n" + '    <meta name="robots" content="noindex, nofollow">' + "`r`n" + '    <link rel="canonical"'
$c = $c.Replace($old, $new)
[System.IO.File]::WriteAllText($f, $c)
Write-Host "Done - noindex added to manual-blank.html"
