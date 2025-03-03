use std::usize;
use serial2_tokio::SerialPort;


fn main(){
    loop{
        let packet = serialread();
        println!("a");
        println!("{:?}", packet);
    }
}

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
