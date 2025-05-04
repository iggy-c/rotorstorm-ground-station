# # import asyncio
# # import serial_asyncio
# # from websockets.asyncio.server import serve

# # async def echo(websocket):
# #     async for message in websocket:
# #         await websocket.send("command received")
# #         print("command issued:", message)
    


# # async def main():
# #     async with serve(echo, "localhost", 8) as server:
# #         await server.serve_forever()

# # class OutputProtocol(asyncio.Protocol):

# #     def __init__(self):
# #         self.buffer = ""
# #         self.payload = ""
# #         # self.websocket = websocket

# #     def connection_made(self, transport):
# #         self.transport = transport
# #         print('port opened', transport)
# #         transport.serial.rts = False  # You can manipulate Serial object via transport
# #         transport.write(b'Hello, World!\n')  # Write serial data via transport

# #     def data_received(self, data):
# #         # print('data received', repr(data))
# #         self.buffer += str(data, )[2:-1]
# #         print(self.buffer)
# #         start_index = self.buffer.find("~")
# #         packet_length = int(self.buffer[start_index+3:start_index+5] + self.buffer[start_index+7:start_index+9], 16)
# #         if(len(self.buffer) >= packet_length + 43):
# #             self.payload = self.buffer[start_index+51:-4]
# #             print(self.payload)
# #             # websocket.send
# #             # websocket.send(self.payload)

# #         # print(self.buffer[1:4])
# #         # if b'\n' in data:
# #         #     self.transport.close()

# #     def connection_lost(self, exc):
# #         print('port closed')
# #         self.transport.loop.stop()

# #     def pause_writing(self):
# #         print('pause writing')
# #         print(self.transport.get_write_buffer_size())

# #     def resume_writing(self):
# #         print(self.transport.get_write_buffer_size())
# #         print('resume writing')

# # loop = asyncio.get_event_loop()
# # coro = serial_asyncio.create_serial_connection(loop, OutputProtocol, 'COM9', baudrate=9600)
# # try: transport, protocol = loop.run_until_complete(coro)
# # except: print("error; check serial connection")
# # asyncio.run(main())
# # loop.run_forever()
# # loop.close()

# import asyncio
# import serial_asyncio
# from websockets.asyncio.server import serve

# class OutputProtocol(asyncio.Protocol):
#     def __init__(self, websocket):
#         self.websocket = websocket
#         self.buffer = ""
#         self.payload = ""

#     def connection_made(self, transport):
#         self.transport = transport
#         print('port opened', transport)
#         transport.serial.rts = False  
#         transport.write(b'Hello, World!\n')

#     def data_received(self, data):
#         self.buffer += str(data, )[2:-1]
#         print(self.buffer)

#         start_index = self.buffer.find("~")
#         if start_index != -1:
#             try:
#                 packet_length = int(self.buffer[start_index+3:start_index+5] + self.buffer[start_index+7:start_index+9], 16)
#                 if len(self.buffer) >= packet_length + 43:
#                     self.payload = self.buffer[start_index+51:-4]
#                     print("Payload:", self.payload)
                    
#                     # Send the payload over WebSocket
#                     if self.websocket:
#                         asyncio.create_task(self.websocket.send(self.payload))
                    
#                     self.buffer = ""  # Clear buffer after sending
#             except Exception as e:
#                 print("Error parsing data:", e)

#     def connection_lost(self, exc):
#         print('port closed')


# async def serial_task(websocket):
#     """ Create serial connection with WebSocket """
#     loop = asyncio.get_event_loop()
#     coro = serial_asyncio.create_serial_connection(loop, lambda: OutputProtocol(websocket), 'COM9', baudrate=9600)
    
#     try:
#         await coro
#     except Exception as e:
#         print("Serial connection error:", e)


# async def main():
#     """ Start WebSocket server """
#     async with serve(serial_task, "localhost", 8):
#         await asyncio.Future()

# # Start event loop
# asyncio.run(main())

# import asyncio
# import serial_asyncio
# from websockets.asyncio.server import serve

# class OutputProtocol(asyncio.Protocol):
#     def __init__(self, websocket):
#         self.websocket = websocket
#         self.buffer = ""
#         self.payload = ""

#     def connection_made(self, transport):
#         self.transport = transport
#         print('port opened', transport)
#         transport.serial.rts = False
#         transport.write(b'Hello, World!\n')

#     def data_received(self, data):
#         self.buffer += str(data)[2:-1]  # Use your existing string handling logic
#         # print(self.buffer)

#         start_index = self.buffer.find("~")
#         if start_index != -1:
#             try:
#                 packet_length = int(self.buffer[start_index+3:start_index+5] + self.buffer[start_index+7:start_index+9], 16)
#                 if len(self.buffer) >= packet_length + 43:
#                     self.payload = self.buffer[start_index+51:-4]
#                     print("Payload:", self.payload)

#                     # Send payload over WebSocket
#                     if self.websocket:
#                         asyncio.create_task(self.websocket.send(self.payload))
                    
#                     self.buffer = ""  # Clear buffer after sending
#             except Exception as e:
#                 print("Error parsing data:", e)

#     def connection_lost(self, exc):
#         print('port closed')


# async def serial_task(websocket):
#     """ Establish serial connection and pass websocket """
#     loop = asyncio.get_event_loop()
    
#     try:
#         transport, protocol = await serial_asyncio.create_serial_connection(
#             loop, lambda: OutputProtocol(websocket), 'COM9', baudrate=9600
#         )
        
#         # Keep the connection open
#         await asyncio.Future()  
#     except Exception as e:
#         print("Serial connection error:", e)


# async def main():
#     """ Start WebSocket server """
#     async with serve(serial_task, "localhost", 8):
#         print("WebSocket server started on ws://localhost:8")
#         await asyncio.Future()

# # Start event loop
# asyncio.run(main())













import asyncio
import serial_asyncio
from websockets.asyncio.server import serve
import sys

class OutputProtocol(asyncio.Protocol):
    def __init__(self, websocket):
        self.websocket = websocket
        self.buffer = b''
        self.payload = ""
        # self.packet_format = ""
        self.start_index = -1

    def connection_made(self, transport):
        self.transport = transport
        print('port opened', transport)
        transport.serial.rts = False
        # transport.write(b'Hello, World!\n')

    def data_received(self, data):
        self.buffer += data
        # print(self.buffer)
        # for b in self.buffer:
        #     print(b)
        # print(hex(self.buffer))

        if b'~' in self.buffer:
            self.start_index = self.buffer.index(b'~')
            # print("asdf")
        if self.start_index != -1:
            try:
                # print(self.buffer)
                packet_length = self.buffer[self.start_index+1] + self.buffer[self.start_index+2] #needs fixing to make first digit work
                # print(packet_length)
                if len(self.buffer) >= packet_length + 16 + self.start_index:
                    for i in range(15,packet_length+3):
                        self.payload += str(chr(self.buffer[self.start_index+i]))
                    print(self.payload)

                    # Send payload over WebSocket
                    if self.websocket:
                        asyncio.create_task(self.websocket.send(self.payload))
                        print("Payload sent:", self.payload)
                    
                    self.buffer = self.buffer[self.start_index + 30:]
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
            loop, lambda: OutputProtocol(websocket), 'COM4', baudrate=9600
        )

        # Listen for messages from the client
        async for message in websocket:
            print("Message from client:", message)  # Print client message
            if message == "CMD,3194,MEC,RELEASE,OFF":
                # transport.write(b"\x7E\x00\x26\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x01\x43\x4D\x44\x2C\x33\x31\x39\x34\x2C\x4D\x45\x43\x2C\x52\x45\x4C\x45\x41\x53\x45\x2C\x4F\x46\x46\x93")
                transport.write(b"\x7E\x00\x11\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x00\x72\x6F\x66\x53")
            elif message == "CMD,3194,MEC,RELEASE,ON":
                # transport.write(b"\x7E\x00\x25\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x01\x43\x4D\x44\x2C\x33\x31\x39\x34\x2C\x4D\x45\x43\x2C\x52\x45\x4C\x45\x41\x53\x45\x2C\x4F\x4E\xD1")
                transport.write(b"\x7E\x00\x11\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x00\x72\x6F\x6E\x4B")
            elif message == "CMD,3194,CAL":
                transport.write(b"\x7E\x00\x1A\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x01\x43\x4D\x44\x2C\x33\x31\x39\x34\x2C\x43\x41\x4C\xCC")

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





# import asyncio
# import serial_asyncio
# import time

# class OutputProtocol(asyncio.Protocol):
#     def connection_made(self, transport):
#         self.transport = transport
#         #print('port opened', transport)
#         print("port opened")
#         transport.serial.rts = False  # You can manipulate Serial object via transport
#         transport.write(b'7E 00 1A 10 01 00 13 A2 00 42 50 AD 63 FF FE 00 00 43 4D 44 2C 33 31 39 34 2C 43 41 4C CD')  # Write serial data via transport
#         time.sleep(5)
#         # transport.write(b"\x7E\x00\x1A\x10\x01\x00\x13\xA2\x00\x42\x50\xAD\x63\xFF\xFE\x00\x00\x43\x4D\x44\x2C\x33\x31\x39\x34\x2C\x43\x41\x4C\xCD")
        

#     def data_received(self, data):
#         print('data received', repr(data))
#         if b'\n' in data:
#             self.transport.close()

#     def connection_lost(self, exc):
#         print('port closed')
#         self.transport.loop.stop()

#     def pause_writing(self):
#         print('pause writing')
#         print(self.transport.get_write_buffer_size())

#     def resume_writing(self):
#         print(self.transport.get_write_buffer_size())
#         print('resume writing')

# loop = asyncio.get_event_loop()
# coro = serial_asyncio.create_serial_connection(loop, OutputProtocol, 'COM4', baudrate=9600)
# transport, protocol = loop.run_until_complete(coro)
# loop.run_forever()
# loop.close()