use std::path::PathBuf;
use std::process::Child;
use std::sync::Mutex;

#[derive(Default)]
pub struct AppState {
    pub sidecar: Mutex<SidecarState>,
}

#[derive(Default)]
pub struct SidecarState {
    pub child: Option<Child>,
    pub port: u16,
    pub token: String,
    pub db_path: PathBuf,
}

impl SidecarState {
    pub fn stop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
        self.port = 0;
        self.token.clear();
    }
}
