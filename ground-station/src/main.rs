use std::net::TcpListener;
use tungstenite::accept; // Use `accept` from the public module

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
                        match websocket.read() {
                            Ok(msg) => {
                                // Print the received message
                                println!("Received: {}", msg);

                                // Echo the message back to the client
                                if msg.is_text() || msg.is_binary() {
                                    websocket.send(msg).expect("Failed to send message");
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
