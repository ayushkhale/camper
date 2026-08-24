$directory = "c:\Camper\src\Screens\Main"
$files = Get-ChildItem -Path $directory -Filter *.jsx -Recurse

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $newContent = $content -replace '<ChevronLeft[^>]*>', '<ArrowLeft size={24} color="#0B409C" />'
    
    if ($content -ne $newContent) {
        # Check if ArrowLeft is already imported
        if (-not ($newContent -match 'ArrowLeft')) {
            $newContent = $newContent -replace 'import\s+\{([^}]+)\}\s+from\s+[''"]lucide-react-native[''"]', "import {`$1, ArrowLeft} from 'lucide-react-native'"
        }

        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    }
}
