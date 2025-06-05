# import sys
# import glob
# import serial


# def serial_ports():
#     """ Lists serial port names

#         :raises EnvironmentError:
#             On unsupported or unknown platforms
#         :returns:
#             A list of the serial ports available on the system
#     """
#     if sys.platform.startswith('win'):
#         ports = ['COM%s' % (i + 1) for i in range(256)]
#     elif sys.platform.startswith('linux') or sys.platform.startswith('cygwin'):
#         # this excludes your current terminal "/dev/tty"
#         ports = glob.glob('/dev/tty[A-Za-z]*')
#     elif sys.platform.startswith('darwin'):
#         ports = glob.glob('/dev/tty.*')
#     else:
#         raise EnvironmentError('Unsupported platform')

#     result = []
#     for port in ports:
#         try:
#             s = serial.Serial(port)
#             s.close()
#             result.append(port)
#         except (OSError, serial.SerialException):
#             pass
#     return result


# if __name__ == '__main__':
#     print(serial_ports())

def build_xbee_tx_request(data: str) -> bytes:
    # Frame specifics
    frame_type = 0x10  # Transmit Request
    frame_id = 0x01    # Frame ID (non-zero to get ACK)
    dest_addr = bytes.fromhex("0013A2004250AD63")  # 64-bit address
    dest_addr = b'\x00' + dest_addr  # Pad to 8 bytes
    reserved = b'\xFF\xFE'  # 16-bit address (not used)
    broadcast_radius = 0x00
    options = 0x00

    # Payload
    rf_data = data.encode('utf-8')

    # Frame data (without start delimiter and length)
    frame_data = (
        bytes([frame_type]) +
        bytes([frame_id]) +
        dest_addr +
        reserved +
        bytes([broadcast_radius]) +
        bytes([options]) +
        rf_data
    )

    # Length
    length = len(frame_data)
    length_bytes = length.to_bytes(2, 'big')

    # Checksum: 0xFF - (sum of frame_data & 0xFF)
    checksum = 0xFF - (sum(frame_data) & 0xFF)

    # Final frame
    frame = b'\x7E' + length_bytes + frame_data + bytes([checksum])
    return frame

packet = build_xbee_tx_request("Hello, world!")
print(packet.hex())