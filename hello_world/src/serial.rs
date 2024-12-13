fn main(){
    let port = serialport::new("/dev/ttyUSB0", 115_200)
    .timeout(Duration::from_millis(10))
    .open().expect("Failed to open port");
}