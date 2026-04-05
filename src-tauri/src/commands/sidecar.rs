use crate::state::AppState;
use rand::distributions::{Alphanumeric, DistString};
use reqwest::blocking::Client;
use serde::Serialize;
use std::env;
use std::fs;
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager, State};

#[derive(Serialize)]
pub struct SidecarStartResponse {
    pub port: u16,
    pub token: String,
    pub pid: u32,
}

#[derive(Serialize)]
pub struct SidecarHealthResponse {
    pub status: String,
}

fn random_token() -> String {
    Alphanumeric.sample_string(&mut rand::thread_rng(), 32)
}

fn pick_port() -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|err| err.to_string())?;
    let port = listener.local_addr().map_err(|err| err.to_string())?.port();
    drop(listener);
    Ok(port)
}

fn wait_until_ready(port: u16) -> Result<(), String> {
    let client = Client::builder()
        .timeout(Duration::from_millis(600))
        .build()
        .map_err(|err| err.to_string())?;

    for _ in 0..20 {
        if let Ok(resp) = client
            .get(format!("http://127.0.0.1:{port}/healthz"))
            .send()
        {
            if resp.status().is_success() {
                return Ok(());
            }
        }
        thread::sleep(Duration::from_millis(250));
    }

    Err("sidecar health check timeout".to_string())
}

fn find_sidecar_binary(app: &AppHandle) -> Result<PathBuf, String> {
    let binary_name = if cfg!(target_os = "windows") {
        "cloud-pika-sidecar.exe"
    } else {
        "cloud-pika-sidecar"
    };

    if let Ok(path) = env::var("CLOUD_PIKA_SIDECAR_BIN") {
        return Ok(PathBuf::from(path));
    }

    let dev_path = Path::new("../sidecar/bin").join(binary_name);
    if dev_path.exists() {
        return Ok(dev_path);
    }

    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|err| err.to_string())?
        .join("binaries")
        .join(binary_name);

    if resource_dir.exists() {
        return Ok(resource_dir);
    }

    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let sibling = exe_dir.join(binary_name);
            if sibling.exists() {
                return Ok(sibling);
            }
        }
    }

    Err("cannot find sidecar binary".to_string())
}

fn start_sidecar_inner(
    app: &AppHandle,
    state: &mut crate::state::SidecarState,
) -> Result<SidecarStartResponse, String> {
    if state.child.is_some() {
        if wait_until_ready(state.port).is_ok() {
            let pid = state
                .child
                .as_ref()
                .map(std::process::Child::id)
                .unwrap_or_default();
            return Ok(SidecarStartResponse {
                port: state.port,
                token: state.token.clone(),
                pid,
            });
        }
        state.stop();
    }

    let port = pick_port()?;
    let token = random_token();
    let app_data = app.path().app_data_dir().map_err(|err| err.to_string())?;
    fs::create_dir_all(&app_data).map_err(|err| err.to_string())?;
    let db_path = app_data.join("cloud-pika.sqlite");

    let sidecar_path = find_sidecar_binary(app)?;

    let child = Command::new(sidecar_path)
        .arg("--port")
        .arg(port.to_string())
        .arg("--token")
        .arg(&token)
        .arg("--db")
        .arg(db_path.as_os_str())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|err| err.to_string())?;

    state.port = port;
    state.token = token;
    state.db_path = db_path;
    state.child = Some(child);

    wait_until_ready(state.port)?;

    let pid = state
        .child
        .as_ref()
        .map(std::process::Child::id)
        .unwrap_or_default();

    Ok(SidecarStartResponse {
        port: state.port,
        token: state.token.clone(),
        pid,
    })
}

#[tauri::command]
pub fn start_sidecar(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<SidecarStartResponse, String> {
    let mut lock = state.sidecar.lock().map_err(|err| err.to_string())?;
    start_sidecar_inner(&app, &mut lock)
}

#[tauri::command]
pub fn restart_sidecar(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<SidecarStartResponse, String> {
    let mut lock = state.sidecar.lock().map_err(|err| err.to_string())?;
    lock.stop();
    start_sidecar_inner(&app, &mut lock)
}

#[tauri::command]
pub fn get_sidecar_health(state: State<'_, AppState>) -> Result<SidecarHealthResponse, String> {
    let lock = state.sidecar.lock().map_err(|err| err.to_string())?;
    if lock.port == 0 {
        return Ok(SidecarHealthResponse {
            status: "stopped".to_string(),
        });
    }

    let client = Client::builder()
        .timeout(Duration::from_millis(1200))
        .build()
        .map_err(|err| err.to_string())?;

    let resp = client
        .get(format!("http://127.0.0.1:{}/healthz", lock.port))
        .send()
        .map_err(|err| err.to_string())?;

    if resp.status().is_success() {
        Ok(SidecarHealthResponse {
            status: "ok".to_string(),
        })
    } else {
        Ok(SidecarHealthResponse {
            status: "degraded".to_string(),
        })
    }
}
