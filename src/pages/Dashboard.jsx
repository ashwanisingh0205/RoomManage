import React, { useState } from 'react';
import axios from '../api/axios';
import bg from '../assets/bg.jpg';
import { 
  canViewBookingRequests, 
  getCurrentUserRole,
  canBookRoom,
  canRequestRooms,
  canBookOrRequestRoom,
  canSeeRoomInBooking
} from '../lib/roleUtils';

export default function Dashboard({ onMakeBooking, onCheckBooking, onNavigateToRooms, onNavigateToRequests }) {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState({
    checkIn: '',
    checkOut: ''
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingStep, setBookingStep] = useState(1); // 1: dates, 2: rooms, 3: confirmation
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phone: '',
    rank: '',
    icNumber: '',
    numberOfGuests: '',
    typeOfHoliday: '',
    mealPreference: ''
  });

    const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const userRole = getCurrentUserRole();
  const canViewRequests = canViewBookingRequests();
  const canBook = canBookRoom(); // Check if user can book any rooms
  const canRequest = canRequestRooms(); // Check if user can request rooms

  const fetchAvailableRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await axios.get(`/bookings/available-rooms?check_in=${selectedDates.checkIn}&check_out=${selectedDates.checkOut}`);
      console.log('Available rooms response:', response.data);
      console.log('Response type:', typeof response.data);
      console.log('Is array:', Array.isArray(response.data));
      console.log('Response length:', response.data ? response.data.length : 'null/undefined');
      
      // Handle different response structures
      let roomsData = response.data;
      
      // If response is an object with a data property
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        if (response.data.data) {
          roomsData = response.data.data;
        } else if (response.data.rooms) {
          roomsData = response.data.rooms;
        } else if (response.data.available_rooms) {
          roomsData = response.data.available_rooms;
        }
      }
      
      // Ensure it's an array
      if (Array.isArray(roomsData)) {
        console.log('Setting rooms data:', roomsData);
        setAvailableRooms(roomsData);
      } else {
        console.log('Response is not an array, converting to array:', roomsData);
        setAvailableRooms(roomsData ? [roomsData] : []);
      }
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleDateSelection = () => {
    if (selectedDates.checkIn && selectedDates.checkOut) {
      fetchAvailableRooms();
      setBookingStep(2);
    }
  };

  const handleRoomSelection = (room) => {
    setSelectedRoom(room);
    setBookingStep(3);
  };

  const handleBookingConfirmation = async () => {
    try {
      // Check if user can book directly or needs to request
      const canBookDirectly = canBookRoom(selectedRoom.id, selectedRoom.type);
      const userRole = getCurrentUserRole();
      
      if (canBookDirectly) {
        // Direct booking for users who can book directly
        const bookingData = {
          name: guestInfo.name,
          ic_number: guestInfo.icNumber,
          rank: guestInfo.rank,
          check_in_date: selectedDates.checkIn,
          check_out_date: selectedDates.checkOut,
          purpose_of_visit: guestInfo.typeOfHoliday,
          room_id: selectedRoom.id,
          no_of_guests: parseInt(guestInfo.numberOfGuests),
          meal_preference: guestInfo.mealPreference,
          mobile_number: guestInfo.phone,
          payment_method: "Cash", // Default value
          room_charges: 1000 // Default value - you can adjust this as needed
        };

        console.log('Sending booking data:', bookingData);

        // Make API call to create booking
        const response = await axios.post(`/bookings/room/${selectedRoom.id}/book`, bookingData);
        
        console.log('Booking API response:', response.data);
        
        // Show success message
        alert('Booking confirmed successfully!');
      } else {
        // First create a booking
        const bookingData = {
          name: guestInfo.name,
          ic_number: guestInfo.icNumber,
          rank: guestInfo.rank,
          check_in_date: selectedDates.checkIn,
          check_out_date: selectedDates.checkOut,
          purpose_of_visit: guestInfo.typeOfHoliday,
          room_id: selectedRoom.id,
          no_of_guests: parseInt(guestInfo.numberOfGuests),
          meal_preference: guestInfo.mealPreference,
          mobile_number: guestInfo.phone,
          payment_method: "Cash", // Default value
          room_charges: 1000 // Default value - you can adjust this as needed
        };

        console.log('Sending booking data:', bookingData);

        // Make API call to create booking first
        const bookingResponse = await axios.post(`/bookings/room/${selectedRoom.id}/book`, bookingData);
        
        console.log('Booking API response:', bookingResponse.data);
        
        // Now create request using the booking ID
        const requestData = {
          booking_id: bookingResponse.data.id // Use the booking ID from the response
        };

        console.log('Sending request data:', requestData);

        // Make API call to create request
        const requestResponse = await axios.post(`/requests/`, requestData);
        
        console.log('Request API response:', requestResponse.data);
        
        // Show success message
        alert('Booking request submitted successfully! Please wait for approval.');
      }
      
      // Reset form and close modal
      setShowBookingModal(false);
      setBookingStep(1);
      setSelectedDates({ checkIn: '', checkOut: '' });
      setSelectedRoom(null);
      setGuestInfo({ name: '', phone: '', rank: '', icNumber: '', numberOfGuests: '', typeOfHoliday: '', mealPreference: '' });
      
    } catch (error) {
      console.error('Error creating booking/request:', error);
      alert('Error creating booking/request. Please try again.');
    }
  };

  const calculateNights = () => {
    if (selectedDates.checkIn && selectedDates.checkOut) {
      const checkIn = new Date(selectedDates.checkIn);
      const checkOut = new Date(selectedDates.checkOut);
      const diffTime = Math.abs(checkOut - checkIn);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const calculateTotalPrice = () => {
    if (selectedRoom && selectedDates.checkIn && selectedDates.checkOut) {
      return selectedRoom.price * calculateNights();
    }
    return 0;
  };

  return (
    <>
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center blur-md brightness-30"
        style={{ backgroundImage: `url(${bg})` }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center min-h-[90vh] overflow-hidden px-4 py-10 sm:py-20 text-white w-full">
        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute left-1/3 top-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-radial from-purple-700/30 via-transparent to-transparent rounded-full blur-3xl opacity-60"></div>
          <div className="absolute right-1/4 bottom-1/4 w-[240px] sm:w-[400px] h-[240px] sm:h-[400px] bg-gradient-radial from-green-600/30 via-transparent to-transparent rounded-full blur-2xl opacity-50"></div>
        </div>

        {/* Header Section */}
        <div className="w-full relative z-20 text-center mb-10">
          <h1 className="text-3xl sm:text-5xl font-bold text-white drop-shadow-md">Room Management Dashboard</h1>
          <p className="mt-4 text-gray-300 text-sm sm:text-lg max-w-2xl mx-auto">
            Quickly book rooms and manage your reservations with an intuitive and beautiful interface.
          </p>
          {userRole && (
            <div className="mt-4 text-blue-300 text-sm">
              Role: {userRole}
            </div>
          )}
        </div>

        {/* Main content cards */}
        <div className="relative z-20 flex flex-col sm:flex-row flex-wrap justify-center gap-10 sm:gap-10 md:gap-16 w-full max-w-5xl">
          {/* Make a Booking - Show for users who can book or request rooms */}
          {(canBook || canRequest) && (
            <article
              onClick={() => setShowBookingModal(true)}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/20 backdrop-blur-md p-6 sm:p-8 shadow-md transition-all hover:shadow-green-500 hover:scale-105 w-full sm:w-80 transform duration-300 ease-in-out brightness-100"
            >
            <div className="inline-block rounded-lg bg-green-600 p-3 text-white shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 20v-7.5l4-2.222" />
              </svg>
            </div>

            <h3 className="mt-4 text-xl font-semibold text-white">Make a Booking</h3>

            <p className="mt-2 text-sm text-gray-200 leading-relaxed">
              Reserve rooms seamlessly for your guests, events, or staff with one click.
            </p>

                          <div className="group mt-4 inline-flex items-center gap-1 text-sm font-medium text-green-400">
                Book now
                <span aria-hidden="true" className="transition-all group-hover:ms-1">&rarr;</span>
              </div>
            </article>
          )}

          {/* Check a Request of Booking - Only for users who can view requests */}
          {canViewRequests && (
            <article
              onClick={onNavigateToRequests}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/25 backdrop-blur-md p-6 sm:p-8 shadow-md transition-all hover:shadow-orange-500 hover:scale-105 w-full sm:w-80 transform duration-300 ease-in-out brightness-100"
            >
              <div className="inline-block rounded-lg bg-orange-600 p-3 text-white shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <h3 className="mt-4 text-xl font-semibold text-white">Check a Request of Booking</h3>

              <p className="mt-2 text-sm text-gray-200 leading-relaxed">
                Review and manage pending booking requests, approve or reject them as needed.
              </p>

              <div className="group mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-300">
                Manage requests
                <span aria-hidden="true" className="transition-all group-hover:ms-1">&rarr;</span>
              </div>
            </article>
          )}

          {/* Check a Booking */}
          <article
            onClick={onNavigateToRooms}
            className="cursor-pointer rounded-xl border border-white/10 bg-white/25 backdrop-blur-md p-6 sm:p-8 shadow-md transition-all hover:shadow-purple-500 hover:scale-105 w-full sm:w-80 transform duration-300 ease-in-out brightness-100"
          >
            <div className="inline-block rounded-lg bg-purple-600 p-3 text-white shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M4 11h16M4 19h16M4 15h16" />
              </svg>
            </div>

            <h3 className="mt-4 text-xl font-semibold text-white">Check a Booking</h3>

            <p className="mt-2 text-sm text-gray-200 leading-relaxed">
              View existing bookings, check availability, or modify reservations instantly.
            </p>

            <div className="group mt-4 inline-flex items-center gap-1 text-sm font-medium text-purple-300">
              View bookings
              <span aria-hidden="true" className="transition-all group-hover:ms-1">&rarr;</span>
            </div>
          </article>
        </div>

        {/* Booking Modal - Show for users who can book or request rooms */}
        {showBookingModal && (canBook || canRequest) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">Book Your Stay</h2>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingStep(1);
                    setSelectedDates({ checkIn: '', checkOut: '' });
                    setSelectedRoom(null);
                    setGuestInfo({ name: '', phone: '', rank: '', icNumber: '', numberOfGuests: '', typeOfHoliday: '', mealPreference: '' });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex justify-center p-4 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center ${bookingStep >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep >= 1 ? 'bg-blue-500' : 'bg-gray-600'}`}>
                      1
                    </div>
                    <span className="ml-2 text-sm">Select Dates</span>
                  </div>
                  <div className={`w-8 h-1 ${bookingStep >= 2 ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                  <div className={`flex items-center ${bookingStep >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep >= 2 ? 'bg-blue-500' : 'bg-gray-600'}`}>
                      2
                    </div>
                    <span className="ml-2 text-sm">Choose Room</span>
                  </div>
                  <div className={`w-8 h-1 ${bookingStep >= 3 ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                  <div className={`flex items-center ${bookingStep >= 3 ? 'text-blue-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep >= 3 ? 'bg-blue-500' : 'bg-gray-600'}`}>
                      3
                    </div>
                    <span className="ml-2 text-sm">Confirm</span>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Step 1: Date Selection */}
                {bookingStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-white mb-2">Select Your Dates</h3>
                      <p className="text-gray-400">Choose your check-in and check-out dates</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Check-in Date</label>
                        <input
                          type="date"
                          value={selectedDates.checkIn}
                          onChange={(e) => setSelectedDates({...selectedDates, checkIn: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Check-out Date</label>
                        <input
                          type="date"
                          value={selectedDates.checkOut}
                          onChange={(e) => setSelectedDates({...selectedDates, checkOut: e.target.value})}
                          min={selectedDates.checkIn || new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                        />
                      </div>
                    </div>

                    {selectedDates.checkIn && selectedDates.checkOut && (
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-blue-300 text-sm">
                          <span className="font-semibold">Duration:</span> {calculateNights()} night(s)
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={handleDateSelection}
                        disabled={!selectedDates.checkIn || !selectedDates.checkOut}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Continue to Room Selection
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Room Selection */}
                {bookingStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-white mb-2">Choose Your Room</h3>
                      <p className="text-gray-400">Select from our available rooms for {calculateNights()} night(s)</p>
                    </div>

                    {loadingRooms ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                          <div className="text-gray-400 text-lg font-medium">Loading available rooms...</div>
                        </div>
                      </div>
                    ) : availableRooms.length > 0 ? (
                      <div>
                        {console.log('Rendering rooms:', availableRooms)}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {availableRooms
                            .filter(room => canSeeRoomInBooking(room.id, room.type))
                            .map((room) => (
                            <div
                              key={room.id}
                              onClick={() => handleRoomSelection(room)}
                              className="cursor-pointer bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors"
                            >
                              <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                                {room.photo ? (
                                  <img
                                    src={`${axios.defaults.baseURL}${room.photo}`}
                                    alt={room.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center text-gray-400" style={{display: room.photo ? 'none' : 'flex'}}>
                                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                  </svg>
                                </div>
                              </div>
                              <h4 className="text-lg font-semibold text-white mb-2">{room.name}</h4>
                              <p className="text-gray-400 text-sm mb-2 capitalize">{room.type} Room</p>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-gray-400 text-sm">
                                  {room.amenities ? room.amenities.length : 0} amenities
                                </span>
                                <span className="text-blue-400 text-sm font-medium">
                                  Available
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {room.amenities && room.amenities.slice(0, 3).map((amenity, index) => (
                                  <span key={index} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                                    {amenity.name}
                                  </span>
                                ))}
                                {room.amenities && room.amenities.length > 3 && (
                                  <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                                    +{room.amenities.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Available Rooms</h3>
                        <p className="text-gray-400 mb-6">No rooms are available for the selected dates.</p>
                        <button
                          onClick={() => setBookingStep(1)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          Try Different Dates
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button
                        onClick={() => setBookingStep(1)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Back to Dates
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {bookingStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-white mb-2">Confirm Your Booking</h3>
                      <p className="text-gray-400">Please provide your details to complete the booking</p>
                    </div>

                    {/* Booking Summary */}
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h4 className="text-lg font-semibold text-white mb-3">Booking Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Check-in: <span className="text-white">{selectedDates.checkIn}</span></p>
                          <p className="text-gray-400">Check-out: <span className="text-white">{selectedDates.checkOut}</span></p>
                          <p className="text-gray-400">Duration: <span className="text-white">{calculateNights()} night(s)</span></p>
                        </div>
                        <div>
                          <p className="text-gray-400">Room: <span className="text-white">{selectedRoom.name}</span></p>
                          <p className="text-gray-400">Room Type: <span className="text-white capitalize">{selectedRoom.type} Room</span></p>
                          <p className="text-gray-400">Amenities: <span className="text-white">{selectedRoom.amenities ? selectedRoom.amenities.length : 0} items</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Guest Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={guestInfo.name}
                          onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={guestInfo.phone}
                          onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Rank</label>
                        <select
                          value={guestInfo.rank}
                          onChange={(e) => setGuestInfo({...guestInfo, rank: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                        >
                          <option value="">Select your rank</option>
                          <option value="Officer">Officer</option>
                          <option value="Civilian">Civilian</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">IC Number</label>
                        <input
                          type="text"
                          value={guestInfo.icNumber}
                          onChange={(e) => setGuestInfo({...guestInfo, icNumber: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                          placeholder="Enter your IC number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Number of Guests</label>
                        <input
                          type="number"
                          value={guestInfo.numberOfGuests}
                          onChange={(e) => setGuestInfo({...guestInfo, numberOfGuests: e.target.value})}
                          min="1"
                          max={selectedRoom.capacity}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                          placeholder="Number of guests"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Purpose of Visit</label>
                        <select
                          value={guestInfo.typeOfHoliday}
                          onChange={(e) => setGuestInfo({...guestInfo, typeOfHoliday: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                        >
                          <option value="">Select purpose of visit</option>
                          <option value="Temporary Duty (TD)">Temporary Duty (TD)</option>
                          <option value="Leave">Leave</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Meal Preference</label>
                        <select
                          value={guestInfo.mealPreference}
                          onChange={(e) => setGuestInfo({...guestInfo, mealPreference: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                        >
                          <option value="">Select meal preference</option>
                          <option value="Veg">Veg</option>
                          <option value="Non-Veg">Non-Veg</option>
                          <option value="Egg Veg">Egg Veg</option>
                        </select>
                      </div>

                    </div>

                    <div className="flex justify-between">
                      <button
                        onClick={() => setBookingStep(2)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Back to Rooms
                      </button>
                      <button
                        onClick={handleBookingConfirmation}
                        disabled={!guestInfo.name || !guestInfo.phone || !guestInfo.rank || !guestInfo.icNumber || !guestInfo.numberOfGuests || !guestInfo.typeOfHoliday || !guestInfo.mealPreference}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Confirm Booking
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
