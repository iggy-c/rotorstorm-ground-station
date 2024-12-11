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
// use std::net::TcpListener;
// use std::thread::spawn;
// use tungstenite::accept;


use std::net::TcpListener;
use tungstenite::server::accept;

fn main() {
    // Bind the server to a specific address and port
    let server = TcpListener::bind("127.0.0.1:9001").expect("Failed to bind server");

    println!("WebSocket server running on ws://127.0.0.1:9001");

    for stream in server.incoming() {
        match stream {
            Ok(stream) => {
                // Spawn a thread to handle each connection
                std::thread::spawn(move || {
                    let mut websocket = accept(stream).expect("Failed to accept connection");

                    println!("New WebSocket connection established!");

                    loop {
                        match websocket.read_message() {
                            Ok(msg) => {
                                // Print the received message
                                println!("Received: {}", msg);

                                // Echo the message back to the client
                                if msg.is_text() || msg.is_binary() {
                                    websocket.write_message(msg).expect("Failed to send message");
                                }
                            }
                            Err(e) => {
                                println!("Error: {}", e);
                                break;
                            }
                        }
                    }
                });
            }
            Err(e) => {
                println!("Connection failed: {}", e);
            }
        }
    }
}
