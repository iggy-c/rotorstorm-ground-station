use std::net::TcpListener;
use tungstenite::accept; // Use `accept` from the public module
use std::usize;
use serial2_tokio::SerialPort;


#[tokio::main]
async fn serialread() -> Result<(), Box<dyn std::error::Error>> {
    let serial = SerialPort::open("COM4", 9600)?;
    let mut buffer = [0u8; 1024];
    let mut data = Vec::new();

    loop {
        match serial.read(&mut buffer).await {
            Ok(n) if n > 0 => {
                data.extend_from_slice(&buffer[..n]);

                // look for complete packets starting with '~' (0x7E)
                while let Some(start) = data.iter().position(|&b| b == 0x7E) {
                    
                    if data.len() > start + 2 { //if packet includes start delimeter and 2 length bytes

                        let length = data[start + 2] as usize; 
                        if data.len() >= start + 4 + length && data.len() > 15{
                            let packet = &data[start..start + 3 + length];
                            println!("{:?}", String::from_utf8_lossy(&packet[15..]));
                            for (_i, b) in (&data).into_iter().enumerate(){
                                print!("{:02X} ", b);
                            }
                            println!("");
                            data.clear();
                            continue;
                        }
                    }
                    break;
                }
            }
            Ok(_) => continue,
            Err(e) => {
                eprintln!("Error reading from serial port: {}", e);
                break;
            }
        }
    }

    Ok(())
}



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
                                println!("WS Received: {}", msg);

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
                        match serialread() {
                            Ok(msg) => {
                                // Print the received message
                                println!("WS Received: {:?}", msg);

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
