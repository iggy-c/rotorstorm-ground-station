# import serial


# def list_serial_ports():
#     ports = ['COM%s' % (i + 1) for i in range(256)]

#     result = []
#     for port in ports:
#         try:
#             s = serial.Serial(port)
#             s.close()
#             result.append(port)
#         except (OSError, serial.SerialException):
#             pass
#     return result


# print(serial_ports())

print("".decode("utf-8"))