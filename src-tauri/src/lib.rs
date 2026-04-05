mod commands;
mod state;
mod tray;

use commands::sidecar::{get_sidecar_health, restart_sidecar, start_sidecar};
use commands::system::{
    open_file_dialog, open_folder_dialog, read_clipboard_image, tray_upload_select,
    write_clipboard_text,
};
use state::AppState;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .setup(|app| {
            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            start_sidecar,
            restart_sidecar,
            get_sidecar_health,
            open_file_dialog,
            open_folder_dialog,
            read_clipboard_image,
            write_clipboard_text,
            tray_upload_select,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run tauri app");
}
