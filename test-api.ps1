$headers = @{
    "x-rapidapi-host" = "realtor16.p.rapidapi.com"
    "x-rapidapi-key" = "5d7334a75bmsh6cd7b35e83ec030p1ce652jsnc281417b83c7"
}

try {
    $response = Invoke-RestMethod -Uri "https://realtor16.p.rapidapi.com/search/forsale?location=Kelowna%2C+BC%2C+Canada&limit=3" -Headers $headers -TimeoutSec 30
    $json = $response | ConvertTo-Json -Depth 5
    Write-Output $json
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Output "RESPONSE BODY: $body"
    }
}
