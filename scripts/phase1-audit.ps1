$ErrorActionPreference = 'Stop'
Set-Location "c:\Users\eduar\OneDrive\Desktop\Viventa RD"

$routes = Get-ChildItem -Recurse -File "app/api" -Filter route.ts
$root = (Get-Location).Path

$matrix = @()
$firebaseClientImports = @()
$highLimits = @()
$hardcoded = @()

foreach ($f in $routes) {
  $text = [System.IO.File]::ReadAllText($f.FullName)
  $rel = $f.FullName
  if ($rel.StartsWith($root)) {
    $rel = $rel.Substring($root.Length + 1)
  }
  $rel = $rel.Replace('\\','/')

  $usesSession = [bool]($text -match 'getSessionFromRequest\s*\(')
  $importsClient = [bool](($text -match 'firebaseClient') -and ($text -match 'from '))
  $sdkOnlyAdmin = -not $importsClient
  $hasOrgScope = [bool]($text -match 'officeId|constructoraCode|developerId|organizationId|brokerageId|brokerId|where\(')

  $matrix += [pscustomobject]@{
    route = $rel
    usesGetSessionFromRequest = $usesSession
    usesAdminSdkOnly = $sdkOnlyAdmin
    hasOfficeOrOrgScopeFilter = $hasOrgScope
    result = $(if ($usesSession -and $sdkOnlyAdmin -and $hasOrgScope) { 'PASS' } else { 'FAIL' })
  }

  if ($importsClient) {
    $firebaseClientImports += [pscustomobject]@{ file = $rel }
  }

  $limitRegex = [regex]'limit\s*\(\s*(\d+)\s*\)'
  foreach ($m in $limitRegex.Matches($text)) {
    $n = [int]$m.Groups[1].Value
    if ($n -gt 100) {
      $line = ($text.Substring(0, $m.Index) -split "`n").Count
      $highLimits += [pscustomobject]@{ file = $rel; line = $line; limit = $n }
    }
  }

  $idPatterns = @(
    'developerId\s*:\s*"[^"]+"',
    "developerId\s*:\s*'[^']+'",
    'agentId\s*:\s*"[^"]+"',
    "agentId\s*:\s*'[^']+'",
    'brokerId\s*:\s*"[^"]+"',
    "brokerId\s*:\s*'[^']+'",
    'officeId\s*:\s*"[^"]+"',
    "officeId\s*:\s*'[^']+'",
    'constructoraCode\s*:\s*"[^"]+"',
    "constructoraCode\s*:\s*'[^']+'"
  )

  foreach ($pat in $idPatterns) {
    $regex = [regex]$pat
    foreach ($m in $regex.Matches($text)) {
      $snippet = $m.Value
      if ($snippet -notmatch 'process\.env|session\.|context\.|safeText\(|String\(') {
        $line = ($text.Substring(0, $m.Index) -split "`n").Count
        $hardcoded += [pscustomobject]@{ file = $rel; line = $line; match = $snippet }
      }
    }
  }
}

$outDir = "docs/audit/phase1"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$matrix | ConvertTo-Json -Depth 4 | Set-Content "$outDir/auth-matrix.json"
$firebaseClientImports | Sort-Object file -Unique | ConvertTo-Json -Depth 4 | Set-Content "$outDir/firebaseclient-imports.json"
$highLimits | Sort-Object file, line -Unique | ConvertTo-Json -Depth 4 | Set-Content "$outDir/high-limits.json"
$hardcoded | Sort-Object file, line -Unique | ConvertTo-Json -Depth 4 | Set-Content "$outDir/hardcoded-tenant-literals.json"

$summary = [pscustomobject]@{
  routes = $routes.Count
  pass = ($matrix | Where-Object { $_.result -eq 'PASS' }).Count
  fail = ($matrix | Where-Object { $_.result -eq 'FAIL' }).Count
  firebaseClientImports = ($firebaseClientImports | Sort-Object file -Unique).Count
  highLimits = ($highLimits | Sort-Object file, line -Unique).Count
  hardcodedTenantLiterals = ($hardcoded | Sort-Object file, line -Unique).Count
}

$summary | ConvertTo-Json -Depth 4 | Set-Content "$outDir/summary.json"
Write-Output "Audit complete. Output in $outDir"
Write-Output ($summary | ConvertTo-Json -Depth 4)
