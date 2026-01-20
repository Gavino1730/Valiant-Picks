# Export test results to markdown
$jsonPath = "test-results/results.json"
$outputPath = "TEST_RESULTS.md"

if (-not (Test-Path $jsonPath)) {
    Write-Host "No test results found at $jsonPath" -ForegroundColor Yellow
    Write-Host "Run 'npm run test:chromium' first to generate test results."
    exit 1
}

$jsonContent = Get-Content $jsonPath -Raw | ConvertFrom-Json

$passed = $jsonContent.expected
$failed = $jsonContent.unexpected
$skipped = $jsonContent.skipped
$total = $passed + $failed + $skipped
$passRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 0) } else { 0 }
$durationSeconds = [math]::Round($jsonContent.duration / 1000, 1)
$durationMinutes = [math]::Round($durationSeconds / 60, 1)

$content = "# Playwright Test Results`n`n"
$content += "**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"
$content += "## Summary`n`n"
$content += "- ✅ Passed: **$passed**`n"
$content += "- ❌ Failed: **$failed**`n"
$content += "- ⏭️ Skipped: **$skipped**`n"
$content += "- 📊 Total: **$total**`n"
$content += "- 📈 Pass Rate: **${passRate}%**`n"
$content += "- ⏱️ Duration: **${durationSeconds}s** (${durationMinutes}min)`n`n"

if ($failed -gt 0) {
    $content += "## Failed Tests`n`n"
    
    foreach ($suite in $jsonContent.suites) {
        foreach ($spec in $suite.specs) {
            foreach ($test in $spec.tests) {
                $status = $test.results[0].status
                $testTitle = $test.title
                $duration = [math]::Round($test.results[0].duration / 1000, 1)
                
                if ($status -eq "unexpected") {
                    $content += "- ❌ ${testTitle} (${duration}s)`n"
                    
                    if ($test.results[0].error.message) {
                        $errorLines = $test.results[0].error.message -split "`n"
                        $firstThreeLines = $errorLines | Select-Object -First 3
                        $content += "  ``````text`n"
                        foreach ($line in $firstThreeLines) {
                            $content += "  $line`n"
                        }
                        $content += "  ``````n`n"
                    }
                }
            }
        }
    }
}

$content += "`n## View Full Report`n`n"
$content += "Open ``playwright-report/index.html`` to see the full interactive report.`n"

$content | Out-File -FilePath $outputPath -Encoding utf8
Write-Host "✅ Test results exported to $outputPath" -ForegroundColor Green
Write-Host "📊 Pass rate: $passRate% ($passed/$total)" -ForegroundColor Cyan
