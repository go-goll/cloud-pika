use arboard::Clipboard;
use image::{ImageBuffer, Rgba};
use std::time::{SystemTime, UNIX_EPOCH};

fn paths_to_strings(paths: Vec<std::path::PathBuf>) -> Vec<String> {
    paths
        .iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect()
}

#[tauri::command]
pub fn open_file_dialog() -> Result<Vec<String>, String> {
    let files = rfd::FileDialog::new().pick_files().unwrap_or_default();
    Ok(paths_to_strings(files))
}

#[tauri::command]
pub fn open_folder_dialog() -> Result<Vec<String>, String> {
    let folder = rfd::FileDialog::new().pick_folder();
    Ok(folder
        .map(|path| vec![path.to_string_lossy().to_string()])
        .unwrap_or_default())
}

#[tauri::command]
pub fn tray_upload_select() -> Result<Vec<String>, String> {
    open_file_dialog()
}

#[tauri::command]
pub fn write_clipboard_text(text: String) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|err| err.to_string())?;
    clipboard.set_text(text).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn read_clipboard_image() -> Result<String, String> {
    let mut clipboard = Clipboard::new().map_err(|err| err.to_string())?;
    let image = clipboard
        .get_image()
        .map_err(|_| "clipboard image not found".to_string())?;

    let buffer: Vec<u8> = image.bytes.into_owned();
    let rgba =
        ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(image.width as u32, image.height as u32, buffer)
            .ok_or_else(|| "failed to decode clipboard image".to_string())?;

    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|err| err.to_string())?
        .as_millis();
    let path = std::env::temp_dir().join(format!("cloud-pika-clipboard-{ts}.png"));

    rgba.save(&path).map_err(|err| err.to_string())?;
    Ok(path.to_string_lossy().to_string())
}
