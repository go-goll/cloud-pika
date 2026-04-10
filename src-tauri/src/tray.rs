use crate::state::AppState;
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager};

const MENU_ID_SHOW: &str = "tray-show-window";
const MENU_ID_UPLOAD: &str = "tray-upload-select";
const MENU_ID_QUIT: &str = "tray-quit-app";

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let menu = Menu::new(app)?;
    let show_item = MenuItem::with_id(app, MENU_ID_SHOW, "Show Cloud Pika", true, None::<&str>)?;
    let upload_item =
        MenuItem::with_id(app, MENU_ID_UPLOAD, "Upload Files...", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, MENU_ID_QUIT, "Quit", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;

    menu.append_items(&[&show_item, &upload_item, &separator, &quit_item])?;

    // 嵌入 tray 图标字节，避免运行时路径问题
    let icon = Image::from_bytes(include_bytes!("../icons/tray-icon@2x.png"))?;

    TrayIconBuilder::with_id("cloud-pika-tray")
        .icon(icon)
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            MENU_ID_SHOW => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            MENU_ID_UPLOAD => {
                let paths = rfd::FileDialog::new().pick_files().unwrap_or_default();
                if !paths.is_empty() {
                    let payload: Vec<String> = paths
                        .iter()
                        .map(|path| path.to_string_lossy().to_string())
                        .collect();
                    let _ = app.emit("tray-upload-files", payload);
                }
            }
            MENU_ID_QUIT => {
                let state = app.state::<AppState>();
                if let Ok(mut lock) = state.sidecar.lock() {
                    lock.stop();
                }
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
