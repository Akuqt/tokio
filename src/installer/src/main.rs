#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod download;
mod install;
mod notices;
mod release;

use install::StatePayload;
use serde::Serialize;
use tao::{
  dpi::{LogicalSize, PhysicalPosition},
  event::{Event, WindowEvent},
  event_loop::{ControlFlow, EventLoopBuilder, EventLoopProxy},
  window::{Window, WindowBuilder},
};
use wry::{WebView, WebViewBuilder, http::Request};

const UI: &str = include_str!("../dist/index.html");

#[derive(Debug)]
pub enum UserEvent {
  UiReady,
  Drag,
  Install,
  Launch,
  Close,
  State(StatePayload),
}

#[derive(Serialize)]
#[serde(rename_all = "PascalCase")]
struct EventPayload<'a, T> {
  r#type: &'a str,
  value: T,
}

fn main() {
  notices::keep();

  let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();
  let window = build_window(&event_loop).expect("failed to create the window");
  center(&window);

  let proxy = event_loop.create_proxy();
  let webview = build_webview(&window, proxy.clone()).expect("failed to create the webview");

  let mut installing = false;

  event_loop.run(move |event, _, control_flow| {
    *control_flow = ControlFlow::Wait;

    match event {
      Event::WindowEvent {
        event: WindowEvent::CloseRequested,
        ..
      } => *control_flow = ControlFlow::Exit,
      Event::UserEvent(event) => match event {
        UserEvent::UiReady => window.set_visible(true),
        UserEvent::Drag => {
          let _ = window.drag_window();
        }
        UserEvent::Install => {
          if !installing {
            installing = true;
            let proxy = proxy.clone();
            std::thread::spawn(move || install::run(&proxy));
          }
        }
        UserEvent::Launch => {
          install::launch();
          *control_flow = ControlFlow::Exit;
        }
        UserEvent::Close => *control_flow = ControlFlow::Exit,
        UserEvent::State(state) => send_json(&webview, "STATE", state),
      },
      _ => {}
    }
  });
}

fn build_window(
  event_loop: &tao::event_loop::EventLoop<UserEvent>,
) -> Result<Window, tao::error::OsError> {
  let builder = WindowBuilder::new()
    .with_title("Tokio")
    .with_inner_size(LogicalSize::new(500.0, 320.0))
    .with_decorations(false)
    .with_transparent(true)
    .with_resizable(false)
    // Shown once the UI reports UI_READY, so the window never flashes blank.
    .with_visible(false);

  #[cfg(target_os = "windows")]
  let builder = {
    use tao::{platform::windows::IconExtWindows, window::Icon};
    // The icon embedded by build.rs, with winresource's default ID.
    builder.with_window_icon(Icon::from_resource(1, None).ok())
  };

  #[cfg(target_os = "linux")]
  let builder = {
    use tao::platform::unix::WindowBuilderExtUnix;
    builder.with_rgba_visual(true)
  };

  builder.build(event_loop)
}

fn center(window: &Window) {
  let Some(monitor) = window
    .current_monitor()
    .or_else(|| window.primary_monitor())
  else {
    return;
  };
  let area = monitor.size();
  let origin = monitor.position();
  let size = window.outer_size();
  window.set_outer_position(PhysicalPosition::new(
    origin.x + (area.width as i32 - size.width as i32) / 2,
    origin.y + (area.height as i32 - size.height as i32) / 2,
  ));
}

fn build_webview(window: &Window, proxy: EventLoopProxy<UserEvent>) -> wry::Result<WebView> {
  let builder = WebViewBuilder::new()
    .with_transparent(true)
    .with_html(UI)
    .with_ipc_handler(move |request: Request<String>| {
      if let Some(event) = parse_message(request.body()) {
        let _ = proxy.send_event(event);
      }
    });

  #[cfg(target_os = "linux")]
  {
    use tao::platform::unix::WindowExtUnix;
    use wry::WebViewBuilderExtUnix;
    let vbox = window
      .default_vbox()
      .expect("tao window has no default vbox");
    builder.build_gtk(vbox)
  }

  #[cfg(not(target_os = "linux"))]
  builder.build(window)
}

fn parse_message(message: &str) -> Option<UserEvent> {
  match message {
    "UI_READY" => Some(UserEvent::UiReady),
    "DRAG" => Some(UserEvent::Drag),
    "LAUNCH" => Some(UserEvent::Launch),
    "CLOSE" => Some(UserEvent::Close),
    _ if message.starts_with("INSTALL") => Some(UserEvent::Install),
    _ => None,
  }
}

/// Sends `{ Type, Value }` to the UI as a JSON string, which the UI parses itself.
fn send_json<T: Serialize>(webview: &WebView, r#type: &str, value: T) {
  let Ok(json) = serde_json::to_string(&EventPayload { r#type, value }) else {
    return;
  };
  let Ok(literal) = serde_json::to_string(&json) else {
    return;
  };
  let _ = webview.evaluate_script(&format!("window.__installerReceive?.({literal})"));
}
