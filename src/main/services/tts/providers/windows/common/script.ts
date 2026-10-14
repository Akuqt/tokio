import { Buffer } from "node:buffer";

// PowerShell host driven over stdin/stdout, one JSON object per line.
// Request:  { id, type: "voices" } | { id, type: "speak", text, voice?, rate, volume }
// Response: { id, ok, data?, error? }
const SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$utf8 = New-Object System.Text.UTF8Encoding $false
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
# The synthesizer is reused, so remember the system default before any SelectVoice.
$defaultVoice = $synth.Voice.Name
$stdin = [Console]::In
$stdout = [Console]::Out

while ($null -ne ($line = $stdin.ReadLine())) {
  if ($line.Trim() -eq '') { continue }
  $id = $null
  $data = $null
  try {
    $req = $line | ConvertFrom-Json
    $id = $req.id
    switch ($req.type) {
      'voices' {
        $data = @($synth.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object {
          $info = $_.VoiceInfo
          $vendor = ''
          if ($info.AdditionalInfo.ContainsKey('Vendor')) { $vendor = $info.AdditionalInfo['Vendor'] }
          @{
            name   = $info.Name
            lang   = $info.Culture.Name
            gender = [string]$info.Gender
            age    = [string]$info.Age
            vendor = [string]$vendor
            default = $info.Name -eq $defaultVoice
          }
        })
      }
      'speak' {
        $ms = New-Object System.IO.MemoryStream
        try {
          if ($req.voice) { $synth.SelectVoice([string]$req.voice) } else { $synth.SelectVoice($defaultVoice) }
          $synth.Rate = [int]$req.rate
          $synth.Volume = [int]$req.volume
          $synth.SetOutputToWaveStream($ms)
          $synth.Speak([string]$req.text)
          $synth.SetOutputToNull()
          $data = [Convert]::ToBase64String($ms.ToArray())
        } finally {
          $ms.Dispose()
        }
      }
      default { throw "Unknown request type: $($req.type)" }
    }
    $res = @{ id = $id; ok = $true; data = $data }
  } catch {
    $res = @{ id = $id; ok = $false; error = $_.Exception.Message }
  }
  $stdout.WriteLine((ConvertTo-Json -InputObject $res -Compress -Depth 4))
  $stdout.Flush()
}
`;

export const ENCODED_SCRIPT = Buffer.from(SCRIPT, "utf16le").toString("base64");
