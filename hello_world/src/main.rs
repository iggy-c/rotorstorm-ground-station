// fn main() {
//     println!("searching");
//     let ports = serialport::available_ports().expect("No ports found!");
//     if ports.is_empty() {
//         println!("No serial ports found.");
//     }
//     for p in ports {
//         println!("{}", p.port_name);
//     }
// }
use std::net::TcpListener;
use std::thread::spawn;
use tungstenite::accept;

/// A WebSocket echo server
fn main () {
    let server = TcpListener::bind("127.0.0.1:9001").unwrap();
    for stream in server.incoming() {
        spawn (move || {
            let mut websocket = accept(stream.unwrap()).unwrap();
            loop {
                let msg = websocket.read().unwrap();

                // We do not want to send back ping/pong messages.
                if msg.is_binary() || msg.is_text() {
                    websocket.send(msg).unwrap();
                }
            }
        });
    }
}