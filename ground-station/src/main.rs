// use tokio::net::TcpListener;
// use tokio_tungstenite::accept_async;
// use futures_util::{StreamExt, SinkExt};
// use tokio_serial::{SerialPortBuilderExt, SerialStream};
// use tokio::{task, sync::mpsc};
// use std::time::Duration;
// use tokio::io::{AsyncReadExt, AsyncWriteExt};

// #[tokio::main]
// async fn main() {
//     let server = TcpListener::bind("127.0.0.1:9001").await.expect("Failed to bind server");
//     println!("WebSocket server running on ws://127.0.0.1:9001");

//     while let Ok((stream, _)) = server.accept().await {
//         let (serial_tx, serial_rx) = mpsc::channel::<String>(100);
//         let (ws_tx, ws_rx) = mpsc::channel::<String>(100);

//         task::spawn(serial_reader(ws_tx.clone()));
//         task::spawn(serial_writer(serial_rx));
//         task::spawn(handle_client(stream, serial_tx, ws_rx));
//     }
// }

// async fn handle_client(
//     stream: tokio::net::TcpStream,
//     serial_tx: mpsc::Sender<String>,
//     mut serial_rx: mpsc::Receiver<String>,
// ) {
//     let ws_stream = accept_async(stream).await.expect("Failed to accept WebSocket connection");
//     let (mut ws_sender, mut ws_receiver) = ws_stream.split();

//     println!("New WebSocket connection established!");

//     loop {
//         tokio::select! {
//             Some(Ok(msg)) = ws_receiver.next() => {
//                 if msg.is_text() || msg.is_binary() {
//                     let msg_text = msg.to_text().unwrap().to_string();
//                     println!("WS Received: {}", msg_text);
//                     if serial_tx.send(msg_text).await.is_err() {
//                         eprintln!("Failed to send WebSocket message to serial");
//                     }
//                 }
//             },
//             Some(serial_msg) = serial_rx.recv() => {
//                 println!("Serial Received: {}", serial_msg);
//                 if ws_sender.send(serial_msg.into()).await.is_err() {
//                     eprintln!("Failed to send message to WebSocket");
//                 }
//             }
//         }
//         tokio::time::sleep(Duration::from_millis(100)).await;
//     }
// }

// async fn serial_reader(tx: mpsc::Sender<String>) {
//     let mut serial = match SerialStream::open(&tokio_serial::new("COM4", 9600)) {
//         Ok(port) => port,
//         Err(e) => {
//             eprintln!("Failed to open serial port: {}", e);
//             return;
//         }
//     };

//     let mut buffer = Vec::new();
//     let mut temp_buffer = [0; 1024];

//     loop {
//         match serial.read(&mut temp_buffer).await {
//             Ok(n) if n > 0 => {
//                 buffer.extend_from_slice(&temp_buffer[..n]);
                
//                 while buffer.len() >= 2 {
//                     let packet_length = u16::from_le_bytes([buffer[0], buffer[1]]) as usize;
//                     if buffer.len() >= packet_length {
//                         let packet_data = buffer.drain(..packet_length).collect::<Vec<u8>>();
//                         let serial_data = String::from_utf8_lossy(&packet_data[2..]).to_string();
//                         if tx.send(serial_data).await.is_err() {
//                             eprintln!("Failed to send serial data");
//                             return;
//                         }
//                     } else {
//                         break;
//                     }
//                 }
//             }
//             Ok(_) => continue,
//             Err(e) => {
//                 eprintln!("Error reading from serial port: {}", e);
//                 return;
//             }
//         }
//     }
// }

// async fn serial_writer(mut rx: mpsc::Receiver<String>) {
//     let mut serial = match SerialStream::open(&tokio_serial::new("COM4", 9600)) {
//         Ok(port) => port,
//         Err(e) => {
//             eprintln!("Failed to open serial port: {}", e);
//             return;
//         }
//     };

//     while let Some(msg) = rx.recv().await {
//         if let Err(e) = serial.write_all(msg.as_bytes()).await {
//             eprintln!("Failed to write to serial: {}", e);
//         }
//     }
// }


use std::net::TcpListener;
use tungstenite::accept; // Use `accept` from the public module
use std::usize;
use serial2_tokio::SerialPort;



#[tokio::main]
async fn serialread() -> Result<String, Box<dyn std::error::Error>> {
    let serial = SerialPort::open("COM4", 9600)?;
    let mut buffer = [0u8; 1024];
    let mut data = Vec::new();

    loop {
        match serial.read(&mut buffer).await {
            Ok(n) if n > 0 => {
                data.extend_from_slice(&buffer[..n]);

                while let Some(start) = data.iter().position(|&b| b == 0x7E) {
                    if data.len() > start + 2 {
                        let length = data[start + 2] as usize;
                        if data.len() >= start + 4 + length && data.len() > 15 {
                            let packet = &data[start..start + 3 + length];
                            let extracted_data = String::from_utf8_lossy(&packet[15..]).to_string();
                            return Ok(extracted_data);
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

    Err("No valid packet received".into())
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
                        // match serialread() {
                        //     Ok(msg) => {
                        //         println!("Serial Received: {}", msg);
                        //         websocket.send(tungstenite::Message::Text(msg)).expect("Failed to send message");
                        //     }
                        //     Err(e) => {
                        //         println!("Error: {}", e);
                        //         break;
                        //     }
                        // }
                    }
                });
            }
            Err(e) => {
                println!("Connection failed: {}", e);
            }
        }
    }
}