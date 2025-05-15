import sys
import csv
import datetime
import asyncio
import serial_asyncio
from websockets.asyncio.server import serve

filename = f"telemetry-csv\\telemetry_{datetime.datetime.now().strftime('%Y-%m-%d__%H-%M-%S')}.csv"

class OutputProtocol(asyncio.Protocol):
    def __init__(self, websocket):
        self.websocket = websocket
        self.buffer = b''
        self.payload = ""
        # self.packet_format = ""
        self.start_index = -1
        self.packet_type = ""
        self.packets_received = 0

    def connection_made(self, transport):
        self.transport = transport
        print('port opened', transport)
        transport.serial.rts = False

    def data_received(self, data):
        self.buffer += data
        # print(self.buffer)
        # for b in self.buffer:
        #     print(b)
        # print(hex(self.buffer))

        if b'~' in self.buffer:
            self.start_index = self.buffer.index(b'~')

        if self.start_index != -1:
            try:
                # print(self.buffer)
                packet_length = self.buffer[self.start_index+1] + self.buffer[self.start_index+2] #needs fixing to make first digit work
                # print(packet_length)
                if len(self.buffer) >= packet_length + 16 + self.start_index:
                    for i in range(15,packet_length+3):
                        self.payload += str(chr(self.buffer[self.start_index+i]))
                        self.packet_type = self.buffer[self.start_index + 3]

                    if self.packet_type == 144:
                        self.packets_received += 1 
                        print("packet count:", self.packets_received)
                        self.payload += ","+ str(self.packets_received)

                    # Send payload over WebSocket
                    if self.websocket:
                        print("Payload received:", self.payload)
                        with open(filename, mode='a', newline='') as file:
                            writer = csv.writer(file)
                            writer.writerow(self.payload.split(","))
                            # print(type(self.payload.split(",")))
                        print(type(self.payload))
                        print(self.payload.split(","))
                        self.payload = ",".join(self.payload.split(",")[:-4]) + "," + ",".join(self.payload.split(",")[-3:])
                        print(self.payload)
                        asyncio.create_task(self.websocket.send(self.payload))
                    
                    self.buffer = self.buffer[self.start_index + 30:] #check safe value
                    self.payload = ""
                    self.start_index = -1

            except Exception as e:
                print("Error parsing data:", e)
    

    def connection_lost(self, exc):
        print('port closed')


async def serial_task(websocket):
    """ Establish serial connection and pass websocket """
    loop = asyncio.get_event_loop()

    try:
        # Create serial connection
        transport, protocol = await serial_asyncio.create_serial_connection(
            loop, lambda: OutputProtocol(websocket), 'COM7', baudrate=9600
        )

        # Listen for messages from the client
        async for message in websocket:
            print("Message from client:", message)  # Print client message
            if message == "CMD,3194,MEC,RELEASE,OFF":
                # transport.write(b"\x7E\x00\x26\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x01\x43\x4D\x44\x2C\x33\x31\x39\x34\x2C\x4D\x45\x43\x2C\x52\x45\x4C\x45\x41\x53\x45\x2C\x4F\x46\x46\x93")
                transport.write(b"\x7E\x00\x11\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x00\x63\x6C\x6F\x5C")
            elif message == "CMD,3194,MEC,RELEASE,ON":
                # transport.write(b"\x7E\x00\x25\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x01\x43\x4D\x44\x2C\x33\x31\x39\x34\x2C\x4D\x45\x43\x2C\x52\x45\x4C\x45\x41\x53\x45\x2C\x4F\x4E\xD1")
                transport.write(b"\x7E\x00\x11\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x00\x72\x65\x6C\x57")
            elif message == "CMD,3194,CAL":
                transport.write(b"\x7E\x00\x1A\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x01\x43\x4D\x44\x2C\x33\x31\x39\x34\x2C\x43\x41\x4C\xCC")
            elif message == "CMD,3194,CX,ON":
                transport.write(b"\x7E\x00\x11\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x00\x63\x6F\x6E\x5A")
            elif message == "CMD,3194,CX,OFF":
                transport.write(b"\x7E\x00\x11\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x00\x63\x6F\x66\x62")
        # Keep the connection open
        await asyncio.Future()  
    except Exception as e:
        print("Serial connection error:", e)


async def main():
    """ Start WebSocket server """
    async with serve(serial_task, "localhost", 8000):
        print("WebSocket server started on ws://localhost:8000")
        await asyncio.Future()

# Start event loop
asyncio.run(main())

