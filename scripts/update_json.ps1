$filePath = "c:\Users\bitbu\OneDrive\Documents\GitHub\MSBTE-NOTES-AND-INFO\blogs.json"
$content = Get-Content -Path $filePath -Raw

$newEntry = @"
    {
        "id": "msbte-summer-2026-exam-time-table",
        "title": "MSBTE Summer 2026 Exam Time Table & Date | Complete Schedule Guide",
        "image": "/resourse/blog-resourse/msbte-summer-2026-exam-roadmap.png",
        "imageAlt": "MSBTE Summer 2026 Exam Time Table and Preparation Guide",
        "dateAndReadTime": "March 6, 2026 · 5 min read",
        "shortTitle": "MSBTE Summer 2026 Exam Time Table",
        "description": "Looking for the MSBTE Summer 2026 exam time table? Get the complete MSBTE time table summer 2026, exam dates, schedule, and download links for all diploma branches.",
        "url": "/Blog/msbte-summer-2026-exam-time-table.html",
        "keywords": [
            "msbte summer 2026 exam time table",
            "msbte time table",
            "msbte time table summer 2026",
            "msbte exam time table 2026",
            "msbte summer exam date 2026"
        ]
    },
"@

$content = $content -replace "\[", "[$newEntry"

Set-Content -Path $filePath -Value $content -Encoding UTF8
Write-Host "Replaced successfully."
