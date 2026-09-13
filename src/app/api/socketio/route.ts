import { NextResponse } from 'next/server'
import { Server } from 'socket.io'

const io = new Server(3001, {
  cors: { origin: '*' },
})

const drivers = new Map<string, { lat: number; lng: number; socketId: string }>()
const rides = new Map<string, { passengerSocketId: string; driverSocketId: string; status: string }>()

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Driver updates location
  socket.on('driver:location', (data: { driverId: string; lat: number; lng: number }) => {
    drivers.set(data.driverId, { lat: data.lat, lng: data.lng, socketId: socket.id })
    // Notify passengers about driver location
    io.emit('driver:moved', { driverId: data.driverId, lat: data.lat, lng: data.lng })
  })

  // Driver goes online/offline
  socket.on('driver:status', (data: { driverId: string; status: string }) => {
    if (data.status === 'OFFLINE') {
      drivers.delete(data.driverId)
    }
    io.emit('driver:statusChanged', data)
  })

  // Ride requested
  socket.on('ride:request', (data: any) => {
    rides.set(data.rideId, { passengerSocketId: socket.id, driverSocketId: '', status: 'SEARCHING' })
    io.emit('ride:newRequest', data)
  })

  // Driver accepts ride
  socket.on('ride:accept', (data: { rideId: string; driverId: string }) => {
    const ride = rides.get(data.rideId)
    if (ride) {
      ride.driverSocketId = socket.id
      ride.status = 'ACCEPTED'
      io.to(ride.passengerSocketId).emit('ride:accepted', data)
    }
  })

  // Ride status updates
  socket.on('ride:statusUpdate', (data: { rideId: string; status: string }) => {
    const ride = rides.get(data.rideId)
    if (ride) {
      ride.status = data.status
      io.to(ride.passengerSocketId).emit('ride:statusChanged', data)
      io.to(ride.driverSocketId).emit('ride:statusChanged', data)
    }
  })

  // Chat messages
  socket.on('chat:message', (data: { rideId: string; sender: string; message: string }) => {
    const ride = rides.get(data.rideId)
    if (ride) {
      io.to(ride.passengerSocketId).emit('chat:newMessage', data)
      io.to(ride.driverSocketId).emit('chat:newMessage', data)
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    // Clean up driver location
    for (const [driverId, driver] of drivers.entries()) {
      if (driver.socketId === socket.id) {
        drivers.delete(driverId)
        break
      }
    }
  })
})

export async function GET() {
  return NextResponse.json({ message: 'Socket.IO server running' })
}
