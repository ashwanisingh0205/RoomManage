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

  // Generate week options (current week + next 51 weeks = full year)
  const weekOptions = Array.from({ length: 52 }, (_, i) => {
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

  // Find the week that contains August 2-8, 2025
  const findWeekForBooking = () => {
    const targetStartDate = new Date('2025-08-02');
    const targetEndDate = new Date('2025-08-08');
    
    for (let i = 0; i < weekOptions.length; i++) {
      const weekStart = weekOptions[i].startDate;
      const weekEnd = weekOptions[i].endDate;
      
      // Check if the target dates fall within this week
      if (targetStartDate >= weekStart && targetEndDate <= weekEnd) {
        return i;
      }
    }
    return null;
  };

  // Auto-navigate to the correct week when component mounts
  useEffect(() => {
    const correctWeek = findWeekForBooking();
    if (correctWeek !== null) {
      setSelectedWeek(correctWeek);
      console.log(`Auto-navigated to week ${correctWeek} for August 2025 booking`);
    }
  }, []);

  // Get dates for selected week
  const getWeekDates = (weekOffset = 0) => {
    const startDate = weekOptions[weekOffset].startDate;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
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
    console.log('Fetching bookings for week:', selectedWeek, 'Date range:', startDate, 'to', endDate);
    fetchBookings(startDate, endDate);
  }, [selectedWeek]);

  // Check if a room is booked on a specific date
  const isRoomBooked = (roomId, date) => {
    const dateStr = formatDate(date);
    console.log('Checking if room', roomId, 'is booked on', dateStr, 'Available bookings:', bookings.length);
    
    return bookings.some(booking => {
      const checkIn = new Date(booking.check_in_date + 'T00:00:00');
      const checkOut = new Date(booking.check_out_date + 'T23:59:59');
      const currentDate = new Date(dateStr + 'T12:00:00');
      
      const isBooked = booking.room_id === roomId && 
                      currentDate >= checkIn && 
                      currentDate <= checkOut;
      
      // Debug logging for room 3
      if (roomId === 3 && booking.room_id === 3) {
        console.log('Booking check for Room 3:', {
          dateStr,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          currentDate: currentDate.toISOString(),
          isBooked: isBooked,
          booking: booking
        });
      }
      
      return isBooked;
    });
  };

  // Get booking info for a specific room and date
  const getBookingInfo = (roomId, date) => {
    const dateStr = formatDate(date);
    return bookings.find(booking => {
      const checkIn = new Date(booking.check_in_date + 'T00:00:00');
      const checkOut = new Date(booking.check_out_date + 'T23:59:59');
      const currentDate = new Date(dateStr + 'T12:00:00');
      
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

  // Calculate statistics for the current week
  const calculateStats = () => {
    let occupiedRooms = new Set();
    let totalBookings = 0;

    // Count occupied rooms and total bookings for the current week
    bookings.forEach(booking => {
      const checkIn = new Date(booking.check_in_date + 'T00:00:00');
      const checkOut = new Date(booking.check_out_date + 'T23:59:59');
      
      // Check if this booking overlaps with the current week
      const weekStart = weekOptions[selectedWeek].startDate;
      const weekEnd = weekOptions[selectedWeek].endDate;
      
      if (checkIn <= weekEnd && checkOut >= weekStart) {
        occupiedRooms.add(booking.room_id);
        totalBookings++;
      }
    });

    const availableRooms = rooms.length - occupiedRooms.size;
    
    return {
      available: availableRooms,
      occupied: occupiedRooms.size,
      total: rooms.length,
      totalBookings: totalBookings
    };
  };

  const stats = calculateStats();

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
              {/* Available Rooms Card */}
              <div className="bg-gradient-to-br from-green-500/10 via-green-600/15 to-green-700/20 backdrop-blur-md border border-green-400/40 rounded-3xl p-6 text-center shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-105">
                <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="text-4xl font-bold text-green-400 mb-2">{stats.available}</div>
                <div className="text-green-300 font-semibold text-lg mb-1">Available</div>
                <div className="text-green-400/70 text-sm">Rooms ready for booking</div>
              </div>

              {/* Occupied Rooms Card */}
              <div className="bg-gradient-to-br from-red-500/10 via-red-600/15 to-red-700/20 backdrop-blur-md border border-red-400/40 rounded-3xl p-6 text-center shadow-2xl hover:shadow-red-500/20 transition-all duration-300 hover:scale-105">
                <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl">🏨</span>
                </div>
                <div className="text-4xl font-bold text-red-400 mb-2">{stats.occupied}</div>
                <div className="text-red-300 font-semibold text-lg mb-1">Occupied</div>
                <div className="text-red-400/70 text-sm">Currently booked rooms</div>
              </div>

              {/* Total Rooms Card */}
              <div className="bg-gradient-to-br from-blue-500/10 via-blue-600/15 to-blue-700/20 backdrop-blur-md border border-blue-400/40 rounded-3xl p-6 text-center shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105">
                <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="text-4xl font-bold text-blue-400 mb-2">{stats.total}</div>
                <div className="text-blue-300 font-semibold text-lg mb-1">Total</div>
                <div className="text-blue-400/70 text-sm">Rooms in system</div>
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
                               {/* Quick Navigation Button */}
                <button
                  onClick={() => {
                    const correctWeek = findWeekForBooking();
                    if (correctWeek !== null) {
                      setSelectedWeek(correctWeek);
                      console.log(`Navigated to week ${correctWeek} for August 2025 booking`);
                    }
                  }}
                  className="mt-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  🗓️ Go to Aug 2025 Week
                </button>
                
                {/* Debug Info */}
                <div className="mt-2 text-xs text-purple-300">
                  <div>Current Week: {selectedWeek}</div>
                  <div>Week Dates: {weekDates[0]?.toLocaleDateString()} - {weekDates[6]?.toLocaleDateString()}</div>
                  <div>Bookings: {bookings.length}</div>
                </div>
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
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-[9999]">
                                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-3 rounded-lg shadow-xl border border-gray-600 min-w-[180px]">
                                    <ul className="space-y-1 text-xs">
                                      <li className="flex items-center gap-2">
                                        <span className="text-blue-400">👤</span>
                                        <span className="text-white font-medium">{bookingInfo.name || 'N/A'}</span>
                                        <span className="text-gray-400">({bookingInfo.rank || 'N/A'})</span>
                                      </li>
                                      <li className="flex items-center gap-2">
                                        <span className="text-green-400">🆔</span>
                                        <span className="text-white">{bookingInfo.ic_number || 'N/A'}</span>
                                      </li>
                                      <li className="flex items-center gap-2">
                                        <span className="text-orange-400">🎯</span>
                                        <span className="text-white">{bookingInfo.purpose_of_visit || 'N/A'}</span>
                                      </li>
                                    </ul>
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
