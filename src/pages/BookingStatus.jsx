import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

// Helper to get the current week's dates
function getWeekDates() {
  const today = new Date();
  const start = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function BookingStatus() {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, 1 = next week, etc.
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Generate week options (current week + next 11 weeks = 3 months)
  const weekOptions = Array.from({ length: 12 }, (_, i) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (i * 7));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return {
      value: i,
      label: i === 0 ? 'Current Week' : `Week ${i + 1}`,
      startDate: startDate,
      endDate: endDate
    };
  });

  // Get dates for selected week
  const getWeekDates = (weekOffset = 0) => {
    const today = new Date();
    const start = new Date(today.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7))); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(selectedWeek);

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch bookings for the selected week
  const fetchBookings = async (startDate, endDate) => {
    try {
      setLoading(true);
      const response = await axios.get(`/bookings/date-range?start=${startDate}&end=${endDate}`);
      
      // Handle both single booking object and array of bookings
      let bookingsData = [];
      if (Array.isArray(response.data)) {
        bookingsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's a single booking object, wrap it in an array
        bookingsData = [response.data];
      }
      
      setBookings(bookingsData);
      console.log('Bookings data:', bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch rooms on component mount
  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await axios.get('/rooms/');
      console.log('Rooms response:', response.data);
      
      // Handle different response structures
      let roomsData = response.data;
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        if (response.data.data) {
          roomsData = response.data.data;
        } else if (response.data.rooms) {
          roomsData = response.data.rooms;
        }
      }
      
      // Ensure it's an array
      roomsData = Array.isArray(roomsData) ? roomsData : [roomsData];
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Fetch rooms on component mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Fetch bookings when week changes
  useEffect(() => {
    const startDate = formatDate(weekOptions[selectedWeek].startDate);
    const endDate = formatDate(weekOptions[selectedWeek].endDate);
    fetchBookings(startDate, endDate);
  }, [selectedWeek]);

  // Check if a room is booked on a specific date
  const isRoomBooked = (roomId, date) => {
    const dateStr = formatDate(date);
    return bookings.some(booking => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const currentDate = new Date(dateStr);
      
      return booking.room_id === roomId && 
             currentDate >= checkIn && 
             currentDate <= checkOut;
    });
  };

  // Get booking info for a specific room and date
  const getBookingInfo = (roomId, date) => {
    const dateStr = formatDate(date);
    return bookings.find(booking => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const currentDate = new Date(dateStr);
      
      return booking.room_id === roomId && 
             currentDate >= checkIn && 
             currentDate <= checkOut;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked':
        return 'outline outline-1 outline-red-400 text-white shadow-lg';
      case 'available':
        return 'outline outline-1 outline-green-400 text-white shadow-lg';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'booked':
        return '🗓️';
      case 'available':
        return '✅';
      default:
        return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020B17] via-[#0a1a2e] to-[#1a2e4a] p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-300 mb-4">
            Booking Status Dashboard
          </h1>
          <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto">
            Room availability and booking status for the selected week
          </p>
        </div>

        {/* Stats Cards and Week Selector */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-green-400">Available</div>
              <div className="text-green-300 text-sm">Rooms ready for booking</div>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">🏨</div>
              <div className="text-2xl font-bold text-red-400">Occupied</div>
              <div className="text-red-300 text-sm">Currently booked rooms</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold text-blue-400">Total</div>
              <div className="text-blue-300 text-sm">{rooms.length} rooms in system</div>
            </div>
          </div>

          {/* Week Selector */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6">
            <div className="text-center mb-4">
              <h3 className="text-purple-400 font-semibold text-lg mb-2">Select Week</h3>
              <p className="text-purple-300 text-sm">
                {weekOptions[selectedWeek].startDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })} - {weekOptions[selectedWeek].endDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              {loading && (
                <div className="mt-2 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
                  <span className="text-purple-300 text-xs">Loading...</span>
                </div>
              )}
            </div>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
              className="w-full bg-white/10 border border-purple-400/30 rounded-lg px-4 py-3 text-purple-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
            >
              {weekOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-gray-800 text-purple-200">
                  {option.label} ({option.startDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })} - {option.endDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm">
                  <th className="px-6 py-4 text-left text-white font-bold text-lg border-b border-white/20">
                    <div className="flex items-center gap-3">
                      <span>Room No.</span>
                    </div>
                  </th>
                  {weekDates.map((date, i) => (
                    <th key={i} className="px-4 py-4 text-center text-white font-semibold border-b border-white/20 min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-sm text-gray-300">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-lg font-bold">
                          {date.getDate()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingRooms ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                        <span className="text-blue-300 text-lg">Loading rooms...</span>
                      </div>
                    </td>
                  </tr>
                ) : rooms.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-400 text-lg">No rooms found</div>
                    </td>
                  </tr>
                ) : (
                  rooms.map((room, roomIdx) => (
                    <tr 
                      key={room.id || roomIdx} 
                      className={`hover:bg-white/5 transition-all duration-300 cursor-pointer ${
                        selectedRoom === roomIdx ? 'bg-white/10' : ''
                      }`}
                      onClick={() => setSelectedRoom(selectedRoom === roomIdx ? null : roomIdx)}
                    >
                      <td className="px-0 py-4 border-b border-white/10 ">
                        <div className="flex items-center justify-center flex-row gap-3 text-align-center">
                          <div className="text-white font-semibold text-lg">{room.name}</div>
                          <div className="text-gray-400 text-sm capitalize">({room.type})</div>
                        </div>
                      </td>
                      {weekDates.map((date, dayIdx) => {
                        const roomId = room.id;
                        const isBooked = isRoomBooked(roomId, date);
                        const bookingInfo = getBookingInfo(roomId, date);
                        const status = isBooked ? 'booked' : 'available';
                        
                        return (
                          <td key={dayIdx} className="px-2 py-2 border-b border-white/10">
                            <div className={`relative group ${getStatusColor(status)} rounded-xl p-3 min-h-[80px] flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
                              <div className="text-2xl mb-1">{getStatusIcon(status)}</div>
                              <div className="text-xs font-semibold text-center">
                                {status === 'booked' ? 'Booked' : 'Available'}
                              </div>
                              
                              {/* Booking Details Tooltip */}
                              {bookingInfo && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                                  <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs whitespace-nowrap">
                                    <div className="font-semibold">{bookingInfo.name}</div>
                                    <div className="text-gray-300">{bookingInfo.rank}</div>
                                    <div className="text-gray-300">{bookingInfo.purpose_of_visit}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center text-white text-sm">✅</div>
            <div>
              <div className="text-green-400 font-semibold">Available</div>
              <div className="text-green-300 text-sm">Ready for booking</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white text-sm">🏨</div>
            <div>
              <div className="text-red-400 font-semibold">Booked</div>
              <div className="text-red-300 text-sm">Currently occupied</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
