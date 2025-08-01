import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import api from '../api/axios';
import { 
  canManageRooms, 
  canBookRoom, 
  canRequestRooms, 
  getCurrentUserRole,
  ROLES 
} from '../lib/roleUtils';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomBookings, setRoomBookings] = useState({}); // Map roomId -> bookings
  const [openBookingsRoomId, setOpenBookingsRoomId] = useState(null); // Which room's bookings modal is open
  const [bookingLoading, setBookingLoading] = useState({}); // Track loading state for each room's bookings
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [addingRoom, setAddingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: 'standard',
    buddy_number: '',
    charges_td: 0,
    charges_leave: 0,
    charges_civilian: 0,
    photo: null
  });
  const [editingRoomData, setEditingRoomData] = useState({
    id: null,
    name: '',
    type: 'standard',
    buddy_number: '',
    charges_td: 0,
    charges_leave: 0,
    charges_civilian: 0,
    photo: null
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  // Scroll to 50% of viewport height when dialog opens
  useEffect(() => {
    if (openBookingsRoomId) {
      // For mobile, scroll to top instead of center
      if (window.innerWidth <= 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: window.innerHeight * 0.5, behavior: 'smooth' });
      }
    }
  }, [openBookingsRoomId]);

  // Scroll to center when date picker opens
  useEffect(() => {
    if (showDatePicker) {
      // For mobile, scroll to top instead of center
      if (window.innerWidth <= 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: window.innerHeight * 0.5, behavior: 'smooth' });
      }
    }
  }, [showDatePicker]);

  // Scroll to center when add room modal opens
  useEffect(() => {
    if (showAddRoomModal) {
      // For mobile, scroll to top instead of center
      if (window.innerWidth <= 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: window.innerHeight * 0.5, behavior: 'smooth' });
      }
    }
  }, [showAddRoomModal]);

  // Scroll to center when edit room modal opens
  useEffect(() => {
    if (showEditRoomModal) {
      // For mobile, scroll to top instead of center
      if (window.innerWidth <= 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: window.innerHeight * 0.5, behavior: 'smooth' });
      }
    }
  }, [showEditRoomModal]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/rooms/');
      setRooms(response.data);
      console.log('Rooms data:', response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomBookings = async (roomId, start, end) => {
    try {
      setBookingLoading(prev => ({ ...prev, [roomId]: true }));
      const response = await axios.get(`/bookings/room/${roomId}/bookings/range?start=${start}&end=${end}`);
      
      // Handle both single booking object and array of bookings
      let bookingsData = [];
      if (Array.isArray(response.data)) {
        bookingsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's a single booking object, wrap it in an array
        bookingsData = [response.data];
      }
      
      setRoomBookings(prev => ({ ...prev, [roomId]: bookingsData }));
      console.log(`Bookings for room ${roomId} from ${start} to ${end}:`, bookingsData);
    } catch (error) {
      console.error(`Error fetching bookings for room ${roomId}:`, error);
      setRoomBookings(prev => ({ ...prev, [roomId]: [] }));
    } finally {
      setBookingLoading(prev => ({ ...prev, [roomId]: false }));
    }
  };

  const handleViewBookings = (roomId) => {
    setSelectedRoomId(roomId);
    setShowDatePicker(true);
  };

  const handleDateSubmit = () => {
    if (startDate && endDate) {
      setShowDatePicker(false);
      setOpenBookingsRoomId(selectedRoomId);
      fetchRoomBookings(selectedRoomId, startDate, endDate);
      // Reset dates
      setStartDate('');
      setEndDate('');
    }
  };

  const handleCloseDatePicker = () => {
    setShowDatePicker(false);
    setSelectedRoomId(null);
    setStartDate('');
    setEndDate('');
  };

  const handleAddRoom = async () => {
    try {
      setAddingRoom(true);
      
      // Check if user is logged in
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert('Please log in first');
        return;
      }
      
      const formData = new FormData();
      
      // Required fields
      formData.append('name', newRoom.name);
      formData.append('type', newRoom.type);
      
      // Optional fields - send empty values as specified
      formData.append('buddy_number', newRoom.buddy_number || '');
      formData.append('charges_td', newRoom.charges_td || 0);
      formData.append('charges_leave', newRoom.charges_leave || 0);
      formData.append('charges_civilian', newRoom.charges_civilian || 0);
      
      // Photo upload - only if photo is selected
      if (newRoom.photo) {
        formData.append('photo', newRoom.photo);
      }
      
      // Debug: Check if token exists and log form data
      console.log('Token exists:', !!token);
      console.log('Token value:', token.substring(0, 20) + '...');
      console.log('Form data entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      // Use the api instance which has the authorization interceptor
      const response = await api.post('/rooms/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Room added successfully:', response.data);
      
      // Refresh rooms list
      await fetchRooms();
      
      // Reset form and close modal
      setNewRoom({
        name: '',
        type: 'standard',
        buddy_number: '',
        charges_td: 0,
        charges_leave: 0,
        charges_civilian: 0,
        photo: null
      });
      setShowAddRoomModal(false);
      
    } catch (error) {
      console.error('Error adding room:', error);
      // Show more detailed error information
      if (error.response && error.response.data) {
        console.error('Server error details:', error.response.data);
        alert(`Failed to add room: ${JSON.stringify(error.response.data)}`);
      } else {
        alert('Failed to add room. Please try again.');
      }
    } finally {
      setAddingRoom(false);
    }
  };

  const handleCloseAddRoomModal = () => {
    setShowAddRoomModal(false);
    setNewRoom({
      name: '',
      type: 'standard',
      buddy_number: '',
      charges_td: 0,
      charges_leave: 0,
      charges_civilian: 0,
      photo: null
    });
  };

  const handleEditRoom = (room) => {
    setEditingRoomData({
      id: room.id,
      name: room.name,
      type: room.type,
      buddy_number: room.buddy_number || '',
      charges_td: room.charges_td || 0,
      charges_leave: room.charges_leave || 0,
      charges_civilian: room.charges_civilian || 0,
      photo: null
    });
    setShowEditRoomModal(true);
  };

  const handleUpdateRoom = async () => {
    try {
      setEditingRoom(true);
      
      // Check if user is logged in
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert('Please log in first');
        return;
      }
      
      const formData = new FormData();
      
      // Required fields
      formData.append('name', editingRoomData.name);
      formData.append('type', editingRoomData.type);
      
      // Optional fields - send empty values as specified
      formData.append('buddy_number', editingRoomData.buddy_number || '');
      formData.append('charges_td', editingRoomData.charges_td || 0);
      formData.append('charges_leave', editingRoomData.charges_leave || 0);
      formData.append('charges_civilian', editingRoomData.charges_civilian || 0);
      
      // Photo upload - only if new photo is selected
      if (editingRoomData.photo) {
        formData.append('photo', editingRoomData.photo);
      }
      
      const response = await api.put(`/rooms/${editingRoomData.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Room updated successfully:', response.data);
      
      // Refresh rooms list
      await fetchRooms();
      
      // Reset form and close modal
      setEditingRoomData({
        id: null,
        name: '',
        type: 'standard',
        buddy_number: '',
        charges_td: 0,
        charges_leave: 0,
        charges_civilian: 0,
        photo: null
      });
      setShowEditRoomModal(false);
      
    } catch (error) {
      console.error('Error updating room:', error);
      if (error.response && error.response.data) {
        console.error('Server error details:', error.response.data);
        alert(`Failed to update room: ${JSON.stringify(error.response.data)}`);
      } else {
        alert('Failed to update room. Please try again.');
      }
    } finally {
      setEditingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingRoom(true);
      
      // Check if user is logged in
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert('Please log in first');
        return;
      }
      
      const response = await api.delete(`/rooms/${roomId}/`);
      
      console.log('Room deleted successfully:', response.data);
      
      // Refresh rooms list
      await fetchRooms();
      
    } catch (error) {
      console.error('Error deleting room:', error);
      if (error.response && error.response.data) {
        console.error('Server error details:', error.response.data);
        alert(`Failed to delete room: ${JSON.stringify(error.response.data)}`);
      } else {
        alert('Failed to delete room. Please try again.');
      }
    } finally {
      setDeletingRoom(false);
    }
  };

  const handleCloseEditRoomModal = () => {
    setShowEditRoomModal(false);
    setEditingRoomData({
      id: null,
      name: '',
      type: 'standard',
      buddy_number: '',
      charges_td: 0,
      charges_leave: 0,
      charges_civilian: 0,
      photo: null
    });
  };

  const getRoomStatusColor = (room, idx) => {
    if (idx === 0 || idx === 1) {
      // First 2 rooms: reddish gradient
      return 'bg-gradient-to-br from-red-500 to-pink-100';
    } else if (idx >= 2 && idx <= 6) {
      // Room 3 to 7: blue gradient
      return 'bg-gradient-to-br from-blue-500 to-blue-100';
    } else if (idx >= 7 && idx <= 10) {
      // Room 8 to 11: light yellow gradient
      return 'bg-gradient-to-br from-yellow-500 to-yellow-100';
    }
    // Default
    return 'bg-gradient-to-br from-slate-500 to-slate-700';
  };

  const getRoomTypeIcon = (type) => {
    switch (type) {
      case 'premium':
        return '👑';
      case 'deluxe':
        return '⭐';
      case 'standard':
        return '🏠';
      default:
        return '🏢';
    }
  };

  console.log(`/api/image/${rooms.photo}`)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <div className="text-indigo-300 text-lg font-medium">Loading rooms...</div>
        </div>
      </div>
    );
  }

  // Find the room for the open modal
  const openRoom = rooms.find(r => r.id === openBookingsRoomId);
  const openRoomIdx = rooms.findIndex(r => r.id === openBookingsRoomId);

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-8 text-center">Room Management</h1>
        <p className="text-slate-300 text-sm sm:text-base lg:text-lg mb-6 sm:mb-10 text-center">
          Total Rooms: <span className="text-indigo-400 font-semibold">{rooms.length}</span>
        </p>
        
        {/* Add Room Button - Only for Chairman */}
        {canManageRooms() && (
          <div className="flex justify-center mb-6 sm:mb-8">
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base lg:text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 sm:gap-3"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">Add New Room</span>
              <span className="sm:hidden">Add Room</span>
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {rooms.map((room, idx) => (
            <div
              key={room.id}
              className={`bg-slate-800 text-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8 flex flex-col ${getRoomStatusColor(room, idx)}`}
            >
              {/* Room Image */}
              <div className="relative w-full h-32 sm:h-40 rounded-lg overflow-hidden mb-4">
                {console.log(`${api.defaults.baseURL}${room.photo}`)}
                <img 
                  src={`${api.defaults.baseURL}${room.photo}`}
                  alt={`${room.name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">{getRoomTypeIcon(room.type)}</span>
                </div>
              </div>

              {/* Room Information List */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-black truncate">{room.name}</h2>
                    <p className="text-black capitalize text-sm">{room.type} Room</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-black text-sm">Amenities</p>
                    <p className="text-black font-semibold text-sm">{room.amenities ? room.amenities.length : 0} available</p>
                  </div>
                </div>
              </div>
              
                             {/* Action Buttons - List Format */}
               <div className="space-y-2 mt-3 sm:mt-4">
                 <button
                   className="w-full bg-gradient-to-r from-black via-gray-800 to-black hover:from-gray-900 hover:via-black hover:to-gray-900 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-colors duration-200 text-xs sm:text-sm flex items-center justify-center gap-2"
                   onClick={() => handleViewBookings(room.id)}
                 >
                   <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                   View Bookings
                 </button>
                 
                 {/* Edit Room Button - Only for Chairman */}
                 {canManageRooms() && (
                   <button
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-colors duration-200 text-xs sm:text-sm flex items-center justify-center gap-2"
                     onClick={() => handleEditRoom(room)}
                     title="Edit Room"
                   >
                     <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                     </svg>
                     Edit Room
                   </button>
                 )}
                 
                 {/* Delete Room Button - Only for Chairman */}
                 {canManageRooms() && (
                   <button
                     className="w-full bg-red-600 hover:bg-red-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-colors duration-200 text-xs sm:text-sm flex items-center justify-center gap-2"
                     onClick={() => handleDeleteRoom(room.id)}
                     disabled={deletingRoom}
                     title="Delete Room"
                   >
                     {deletingRoom ? (
                       <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                     ) : (
                       <>
                         <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                         Delete Room
                       </>
                     )}
                   </button>
                 )}
               </div>
            </div>
          ))}
        </div>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-[60] p-2 sm:p-4 pt-16 sm:pt-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 lg:p-8 relative mt-4 sm:mt-0">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Select Date Range</h3>
                <p className="text-gray-600 text-sm sm:text-base">Choose the date range to view bookings</p>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={handleCloseDatePicker}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDateSubmit}
                  disabled={!startDate || !endDate}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg sm:rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  View Bookings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for bookings */}
        {openRoom && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-[60] p-2 sm:p-4 pt-16 sm:pt-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative mt-4 sm:mt-0">
              {/* Header */}
              <div className={`${getRoomStatusColor(openRoom, openRoomIdx)} text-black p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="bg-black/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <span className="text-lg sm:text-xl lg:text-2xl">{getRoomTypeIcon(openRoom.type)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{openRoom.name}</h2>
                      <p className="text-black/80 capitalize text-sm sm:text-base">{openRoom.type} Room</p>
                    </div>
                  </div>
                  <button
                    className="bg-black/20 hover:bg-black/30 backdrop-blur-sm rounded-full p-1.5 sm:p-2 transition-all duration-200 flex-shrink-0"
                    onClick={() => setOpenBookingsRoomId(null)}
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-3 sm:mt-4 flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Amenities: {openRoom.amenities ? openRoom.amenities.length : 0}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Bookings</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 lg:p-6 max-h-[70vh] sm:max-h-[60vh] overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Room Bookings
                  </h3>
                </div>
                
                {bookingLoading[openRoom.id] ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
                      <div className="text-gray-500 font-medium">Loading bookings...</div>
                    </div>
                  </div>
                ) : (!roomBookings[openRoom.id] || !Array.isArray(roomBookings[openRoom.id]) || roomBookings[openRoom.id].length === 0) ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 rounded-2xl p-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-600 mb-2">No Bookings Found</h4>
                      <p className="text-gray-500">No bookings available for the selected date range.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {roomBookings[openRoom.id].map((booking, index) => (
                      <div key={booking.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 rounded-full p-2">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">Booking #{index + 1}</h4>
                              <p className="text-sm text-gray-500">ID: {booking.id}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Guest Information */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <h5 className="font-semibold text-gray-700">Guest Information</h5>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 rounded-lg p-2">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-medium">Rank</p>
                                  <p className="font-semibold text-gray-800">{booking.rank || 'N/A'}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="bg-purple-100 rounded-lg p-2">
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-medium">IC Number</p>
                                  <p className="font-semibold text-gray-800">{booking.ic_number || 'N/A'}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="bg-orange-100 rounded-lg p-2">
                                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-medium">Purpose</p>
                                  <p className="font-semibold text-gray-800">{booking.purpose_of_visit || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <h5 className="font-semibold text-gray-700">Booking Details</h5>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-green-100 rounded-lg p-2">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-medium">Check-in</p>
                                  <p className="font-semibold text-gray-800">{booking.check_in_date || 'N/A'}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="bg-red-100 rounded-lg p-2">
                                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-medium">Check-out</p>
                                  <p className="font-semibold text-gray-800">{booking.check_out_date || 'N/A'}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="bg-yellow-100 rounded-lg p-2">
                                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase font-medium">Guests</p>
                                  <p className="font-semibold text-gray-800">{booking.no_of_guests || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Room Modal */}
        {showAddRoomModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-[60] p-2 sm:p-4 pt-16 sm:pt-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg sm:max-w-xl lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto relative mt-4 sm:mt-0">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Add New Room</h2>
                      <p className="text-indigo-100 text-sm sm:text-base">Create a new room with all details</p>
                    </div>
                  </div>
                  <button
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-1.5 sm:p-2 transition-all duration-200 flex-shrink-0"
                    onClick={handleCloseAddRoomModal}
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Basic Information */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Basic Information</h3>
                    
                    {/* Room Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Name *</label>
                      <input
                        type="text"
                        value={newRoom.name}
                        onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                        placeholder="Enter room name"
                        required
                      />
                    </div>

                    {/* Room Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Type *</label>
                      <select
                        value={newRoom.type}
                        onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                        required
                      >
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>

                    {/* Buddy Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Buddy Number</label>
                      <input
                        type="text"
                        value={newRoom.buddy_number}
                        onChange={(e) => setNewRoom({...newRoom, buddy_number: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                        placeholder="Enter buddy number"
                      />
                    </div>

                    {/* Room Photo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewRoom({...newRoom, photo: e.target.files[0]})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {/* Charges Information */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Charges</h3>
                    
                    {/* TD Charges */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">TD Charges</label>
                      <input
                        type="number"
                        min="0"
                        value={newRoom.charges_td}
                        onChange={(e) => setNewRoom({...newRoom, charges_td: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                        placeholder="0"
                      />
                    </div>

                    {/* Leave Charges */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Leave Charges</label>
                      <input
                        type="number"
                        min="0"
                        value={newRoom.charges_leave}
                        onChange={(e) => setNewRoom({...newRoom, charges_leave: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                        placeholder="0"
                      />
                    </div>

                    {/* Civilian Charges */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Civilian Charges</label>
                      <input
                        type="number"
                        min="0"
                        value={newRoom.charges_civilian}
                        onChange={(e) => setNewRoom({...newRoom, charges_civilian: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 mt-6 sm:mt-8">
                  <button
                    onClick={handleCloseAddRoomModal}
                    className="flex-1 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRoom}
                    disabled={!newRoom.name || !newRoom.type || addingRoom}
                    className="flex-1 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {addingRoom ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                        <span className="hidden sm:inline">Adding Room...</span>
                        <span className="sm:hidden">Adding...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="hidden sm:inline">Add Room</span>
                        <span className="sm:hidden">Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Room Modal */}
        {showEditRoomModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-[60] p-2 sm:p-4 pt-16 sm:pt-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg sm:max-w-xl lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto relative mt-4 sm:mt-0">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Edit Room</h2>
                      <p className="text-blue-100 text-sm sm:text-base">Update room details</p>
                    </div>
                  </div>
                  <button
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-1.5 sm:p-2 transition-all duration-200 flex-shrink-0"
                    onClick={handleCloseEditRoomModal}
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Basic Information */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Basic Information</h3>
                    
                    {/* Room Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Name *</label>
                      <input
                        type="text"
                        value={editingRoomData.name}
                        onChange={(e) => setEditingRoomData({...editingRoomData, name: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        placeholder="Enter room name"
                        required
                      />
                    </div>

                    {/* Room Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Type *</label>
                      <select
                        value={editingRoomData.type}
                        onChange={(e) => setEditingRoomData({...editingRoomData, type: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        required
                      >
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>

                    {/* Buddy Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Buddy Number</label>
                      <input
                        type="text"
                        value={editingRoomData.buddy_number}
                        onChange={(e) => setEditingRoomData({...editingRoomData, buddy_number: e.target.value})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        placeholder="Enter buddy number"
                      />
                    </div>

                    {/* Room Photo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Photo (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditingRoomData({...editingRoomData, photo: e.target.files[0]})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to keep current photo</p>
                    </div>
                  </div>

                  {/* Charges Information */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Charges</h3>
                    
                    {/* TD Charges */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">TD Charges</label>
                      <input
                        type="number"
                        min="0"
                        value={editingRoomData.charges_td}
                        onChange={(e) => setEditingRoomData({...editingRoomData, charges_td: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        placeholder="0"
                      />
                    </div>

                    {/* Leave Charges */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Leave Charges</label>
                      <input
                        type="number"
                        min="0"
                        value={editingRoomData.charges_leave}
                        onChange={(e) => setEditingRoomData({...editingRoomData, charges_leave: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        placeholder="0"
                      />
                    </div>

                    {/* Civilian Charges */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Civilian Charges</label>
                      <input
                        type="number"
                        min="0"
                        value={editingRoomData.charges_civilian}
                        onChange={(e) => setEditingRoomData({...editingRoomData, charges_civilian: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 mt-6 sm:mt-8">
                  <button
                    onClick={handleCloseEditRoomModal}
                    className="flex-1 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateRoom}
                    disabled={!editingRoomData.name || !editingRoomData.type || editingRoom}
                    className="flex-1 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {editingRoom ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                        <span className="hidden sm:inline">Updating Room...</span>
                        <span className="sm:hidden">Updating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="hidden sm:inline">Update Room</span>
                        <span className="sm:hidden">Update</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
