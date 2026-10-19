$server = Resolve-Path (Join-Path $PSScriptRoot '..\..\server') #$PSScriptRoot membuat path-nya relatif terhadap lokasi file, tidak tertanam di kode.
Set-Location $server

while ($true){ #Loop-nya menutup celah yang tadi kamu alami: begitu broker belum siap, mqtt:subscribe gagal, menunggu 5 detik (dari handle()), lalu dicoba lagi sampai berhasil. Karena itu urutan nyala Docker dan listener tidak lagi penting.
    php artisan mqtt:subscribe *>> "storage\logs\mqtt-listener.log"
    Start-Sleep -Seconds 2
}