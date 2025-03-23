use tokio::io::{AsyncReadExt, AsyncWriteExt};
use serial2_tokio::SerialPort;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    if let Err(()) = do_main().await {
        std::process::exit(1);
    }
}

async fn do_main() -> Result<(), ()> {
    let args: Vec<_> = std::env::args().collect();
    if args.len() != 3 {
        let prog_name = args[0].rsplit_once('/').map(|(_parent, name)| name).unwrap_or(&args[0]);
        eprintln!("Usage: {} PORT BAUD", prog_name);
        return Err(());
    }

    let port_name = &args[1];
    let baud_rate: u32 = args[2]
        .parse()
        .map_err(|_| eprintln!("Error: invalid baud rate: {}", args[2]))?;

    let port = SerialPort::open(port_name, baud_rate)
        .map_err(|e| eprintln!("Error: Failed to open {}: {}", port_name, e))?;

    tokio::try_join!(
        read_stdin_loop(&port, port_name),
        read_serial_loop(&port, port_name),
    )?;
    Ok(())
}

async fn read_stdin_loop(port: &SerialPort, port_name: &str) -> Result<(), ()> {
    let mut stdin = tokio::io::stdin();
    let mut buffer = [0; 512];
    loop {
        let read = stdin
            .read(&mut buffer)
            .await
            .map_err(|e| eprintln!("Error: Failed to read from stdin: {}", e))?;
        if read == 0 {
            return Ok(());
        } else {
            port.write(&buffer[..read])
                .await
                .map_err(|e| eprintln!("Error: Failed to write to {}: {}", port_name, e))?;
        }
    }
}

async fn read_serial_loop(port: &SerialPort, port_name: &str) -> Result<(), ()> {
    let mut stdout = tokio::io::stdout();
    let mut buffer = [0; 512];
    let mut accumulated_data = Vec::new();
    let mut expected_length: Option<usize> = None;

    loop {
        match port.read(&mut buffer).await {
            Ok(0) => return Ok(()),
            Ok(n) => {
                // Accumulate data
                accumulated_data.extend_from_slice(&buffer[..n]);

                // Determine packet length when we have at least 3 bytes
                if expected_length.is_none() && accumulated_data.len() >= 3 {
                    let length = (accumulated_data[1] as usize) << 8 | (accumulated_data[2] as usize);
                    expected_length = Some(length + 4); // +4 accounts for header and checksum
                    eprintln!("Expected Packet Length: {}", expected_length.unwrap());
                }

                // Process data only when we have the full packet
                if let Some(len) = expected_length {
                    if accumulated_data.len() >= len {
                        eprintln!("Full Packet Received: {:?}", accumulated_data);
                        
                        // Convert packet data to ASCII if applicable
                        if accumulated_data.len() > 15 {
                            let extracted_data = String::from_utf8_lossy(&accumulated_data[15..]).to_string();
                            eprintln!("Extracted Data: {}", extracted_data);
                        }

                        // Clear the buffer and reset expected length
                        accumulated_data.clear();
                        expected_length = None;
                    }
                }

                stdout
                    .write_all(&buffer[..n])
                    .await
                    .map_err(|e| eprintln!("Error: Failed to write to stdout: {}", e))?;
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => continue,
            Err(e) => {
                eprintln!("Error: Failed to read from {}: {}", port_name, e);
                return Err(());
            }
        }
    }
}

// Converts the byte data to ASCII and returns the result as a String
// fn process_serial_data(data: &[u8]) -> Option<String> {
//     // Convert accumulated data to a string (assuming valid UTF-8 encoding)
//     let message = String::from_utf8_lossy(data).to_string();
//     Some(message)
// }
