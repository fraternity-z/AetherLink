#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    // 官方 dialog 插件 - 文件选择器
    .plugin(tauri_plugin_dialog::init())
    // 官方 fs 插件 - 文件系统操作
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init());

  // 仅 Android 端：边缘到边缘显示插件
  #[cfg(target_os = "android")]
  let builder = builder.plugin(tauri_plugin_edge_to_edge::init());

  // 仅桌面端：添加窗口状态记忆插件（排除 decorations 状态恢复）
  #[cfg(not(any(target_os = "android", target_os = "ios")))]
  let builder = builder.plugin(
    tauri_plugin_window_state::Builder::new()
      .with_state_flags(
        tauri_plugin_window_state::StateFlags::all()
          .difference(tauri_plugin_window_state::StateFlags::DECORATIONS)
      )
      .build()
  );

  // Windows 桌面端：添加窗口关闭事件处理（最小化到托盘）
  #[cfg(target_os = "windows")]
  let builder = builder.on_window_event(|window, event| {
    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
      // 阻止默认关闭行为
      api.prevent_close();
      // 隐藏窗口到系统托盘
      let _ = window.hide();
    }
  });

  builder
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Windows 桌面端：设置系统托盘
      #[cfg(target_os = "windows")]
      {
        use tauri::Manager;
        use tauri::menu::{Menu, MenuItem};
        use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
        
        // 创建托盘菜单项
        let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
        let quit_item = MenuItem::with_id(app, "quit", "退出应用", true, None::<&str>)?;
        let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

        // 创建托盘图标
        let _tray = TrayIconBuilder::new()
          .icon(app.default_window_icon().unwrap().clone())
          .tooltip("AetherLink")
          .menu(&menu)
          .show_menu_on_left_click(false) // 左键点击不显示菜单
          .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
              if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
              }
            }
            "quit" => {
              app.exit(0);
            }
            _ => {}
          })
          .on_tray_icon_event(|tray, event| {
            // 左键单击托盘图标时显示窗口
            if let TrayIconEvent::Click {
              button: MouseButton::Left,
              button_state: MouseButtonState::Up,
              ..
            } = event
            {
              let app = tray.app_handle();
              if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
              }
            }
          })
          .build(app)?;
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
