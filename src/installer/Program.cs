using System.Text.Json.Serialization.Metadata;
using System.Runtime.InteropServices;
using System.Text.Json.Serialization;
using System.Diagnostics;
using System.Reflection;
using System.Text.Json;
using Photino.NET;


namespace Installer
{

  [JsonSerializable(typeof(EventPayload<StatePayload>))]
  [JsonSerializable(typeof(EventPayload<string>))]
  public partial class AppJsonContext : JsonSerializerContext { }

  public record StatePayload(int Progress, string State, string Message);
  public record EventPayload<T>(string Type, T Value);

  partial class Program
  {
    private static readonly string _defaultInstallPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "Programs", "tokio"
    );

    private static string _installedAppPath = "";

    [LibraryImport("user32.dll", EntryPoint = "GetWindowLongPtrW")]
    private static partial nint GetWindowLongPtr(IntPtr hWnd, int nIndex);

    [LibraryImport("user32.dll", EntryPoint = "SetWindowLongPtrW")]
    private static partial nint SetWindowLongPtr(IntPtr hWnd, int nIndex, nint dwNewLong);

    [LibraryImport("user32.dll", EntryPoint = "SetLayeredWindowAttributes")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool SetLayeredWindowAttributes(IntPtr hwnd, uint crKey, byte bAlpha, uint dwFlags);

    [LibraryImport("user32.dll", EntryPoint = "ReleaseCapture")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool ReleaseCapture();

    [LibraryImport("user32.dll", EntryPoint = "SendMessageW")]
    private static partial IntPtr SendMessage(IntPtr hWnd, uint Msg, nuint wParam, nint lParam);

    private const int GWL_EX_STYLE = -20;
    private const int WS_EX_LAYERED = 0x80000;
    private const uint LWA_ALPHA = 0x2;
    private const uint WM_NCLBUTTONDOWN = 0xA1;
    private const nuint HT_CAPTION = 0x2;

    static string GetInstallerUrl()
    {
      var meta = Assembly.GetExecutingAssembly()
          .GetCustomAttributes<AssemblyMetadataAttribute>()
          .FirstOrDefault(a => a.Key == "InstallerUrl");

      return !string.IsNullOrEmpty(meta?.Value)
          ? meta.Value
          : "https://huggingface.co/datasets/akuqt/tokio-utils/resolve/main/bin/tokio-0.0.1-setup.exe?download=true"; // NOTE: TEMP FALLBACK - TEST
    }

    private static void SetOpacity(IntPtr hWnd, byte alpha)
    {
      if (hWnd == IntPtr.Zero) return;
      nint style = GetWindowLongPtr(hWnd, GWL_EX_STYLE);
      _ = SetWindowLongPtr(hWnd, GWL_EX_STYLE, style | WS_EX_LAYERED);
      SetLayeredWindowAttributes(hWnd, 0, alpha, LWA_ALPHA);
    }

    [STAThread]
    static void Main()
    {
      string htmlContent = "";
      var assembly = Assembly.GetExecutingAssembly();

      using (Stream? stream = assembly.GetManifestResourceStream("UI.index.html"))
      {
        if (stream != null)
        {
          using StreamReader reader = new(stream);
          htmlContent = reader.ReadToEnd();
        }
        else
        {
          htmlContent = "<!DOCTYPE html><html><body style='background:#121214; color:white;'><h2>UI Missing</h2></body></html>";
        }
      }

      var window = new PhotinoWindow()
          .SetTitle("Tokio")
          .SetUseOsDefaultSize(false)
          .SetUseOsDefaultLocation(false)
          .SetSize(500, 320)
          .Center()
          .SetChromeless(true)
          .SetTransparent(true)
          .SetResizable(false);

      window.WindowCreated += (sender, e) =>
      {
        SetOpacity(window.WindowHandle, 0);
      };

      window.RegisterWebMessageReceivedHandler((sender, message) =>
      {
        if (message == "UI_READY")
        {
          window.Invoke(() => SetOpacity(window.WindowHandle, 255));
        }
        else if (message == "DRAG")
        {
          window.Invoke(() =>
                {
                  ReleaseCapture();
                  SendMessage(window.WindowHandle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
                });
        }
        else if (message.StartsWith("INSTALL"))
        {
          _installedAppPath = Path.Combine(_defaultInstallPath, "tokio.exe");
          Task.Run(() => RunInstallationAsync(window, _defaultInstallPath));
        }
        else if (message == "LAUNCH")
        {
          if (File.Exists(_installedAppPath))
          {
            Process.Start(new ProcessStartInfo { FileName = _installedAppPath, UseShellExecute = true });
          }
          Environment.Exit(0);
        }
        else if (message == "CLOSE")
        {
          Environment.Exit(0);
        }
      });

      window.LoadRawString(htmlContent);
      window.WaitForClose();
    }

    static async Task RunInstallationAsync(PhotinoWindow window, string installDir)
    {
      string installerUrl = GetInstallerUrl();
      string tempPath = Path.Combine(Path.GetTempPath(), "tokio-setup.exe");

      try
      {
        using (HttpClient client = new())
        using (HttpResponseMessage response = await client.GetAsync(installerUrl, HttpCompletionOption.ResponseHeadersRead))
        {
          response.EnsureSuccessStatusCode();
          long totalBytes = response.Content.Headers.ContentLength ?? -1L;

          using Stream contentStream = await response.Content.ReadAsStreamAsync();
          using FileStream fileStream = new(tempPath, FileMode.Create, FileAccess.Write, FileShare.None, 8192, true);
          var buffer = new byte[8192];
          long totalRead = 0;
          int bytesRead;

          while ((bytesRead = await contentStream.ReadAsync(buffer)) != 0)
          {
            await fileStream.WriteAsync(buffer.AsMemory(0, bytesRead));
            totalRead += bytesRead;

            if (totalBytes != -1)
            {
              int percentage = (int)((double)totalRead / totalBytes * 100);
              SendJson(window, "STATE", ParseState(percentage, "downloading"), AppJsonContext.Default.EventPayloadStatePayload);
            }
          }
        }

        SendJson(window, "STATE", ParseState(100, "installing"), AppJsonContext.Default.EventPayloadStatePayload);

        ProcessStartInfo installInfo = new()
        {
          FileName = tempPath,
          Arguments = $"/S /D={installDir}",
          UseShellExecute = true,
          WindowStyle = ProcessWindowStyle.Hidden
        };

        using (Process? process = Process.Start(installInfo)) { process?.WaitForExit(); }
        if (File.Exists(tempPath)) File.Delete(tempPath);
        SendJson(window, "STATE", ParseState(100, "complete"), AppJsonContext.Default.EventPayloadStatePayload);
      }
      catch (Exception ex)
      {
        SendJson(window, "STATE", ParseState(0, "error", ex.Message), AppJsonContext.Default.EventPayloadStatePayload);
      }
    }

    static StatePayload ParseState(int progress, string state, string? message = null)
    {
      return new StatePayload(progress, state, message ?? "");
    }

    static void SendJson<T>(PhotinoWindow window, string type, T value, JsonTypeInfo<EventPayload<T>> jsonTypeInfo)
    {
      var payload = new EventPayload<T>(type, value);
      string json = JsonSerializer.Serialize(payload, jsonTypeInfo);
      window.SendWebMessage(json);
    }
  }
}
