import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import bg from '../assets/bg.jpg';

export default function BookingRequests() {
  const [requests, setRequests] = useState({
    pending: [],
    approved: [],
    rejected: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const statuses = ['pending', 'approved', 'rejected'];
      const requestsData = {};

      for (const status of statuses) {
        try {
          const response = await axios.get(`/requests/status/${status}`);
          console.log(`${status} requests response:`, response.data);
          
          // Handle different response structures
          let requestsArray = response.data;
          if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            if (response.data.data) {
              requestsArray = response.data.data;
            } else if (response.data.requests) {
              requestsArray = response.data.requests;
            }
          }
          
          // Ensure it's an array
          requestsArray = Array.isArray(requestsArray) ? requestsArray : [requestsArray];
          
          // For each request, fetch the booking details
          const requestsWithDetails = await Promise.all(
            requestsArray.map(async (request) => {
              try {
                // Fetch booking details using booking_id
                const bookingResponse = await axios.get(`/bookings/${request.booking_id}`);
                console.log(`Booking details for ${request.booking_id}:`, bookingResponse.data);
                
                return {
                  ...request,
                  booking: bookingResponse.data
                };
              } catch (bookingError) {
                console.error(`Error fetching booking ${request.booking_id}:`, bookingError);
                return {
                  ...request,
                  booking: null
                };
              }
            })
          );
          
          requestsData[status] = requestsWithDetails;
        } catch (error) {
          console.error(`Error fetching ${status} requests:`, error);
          requestsData[status] = [];
        }
      }

      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setApprovingRequest(requestId);
      const response = await axios.post('/requests/approve', {
        request_id: requestId,
        approve: true,
        note: note || 'Approved by admin'
      });
      
      console.log('Approve response:', response.data);
      alert('Request approved successfully!');
      setNote('');
      fetchAllRequests(); // Refresh the data
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request. Please try again.');
    } finally {
      setApprovingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setRejectingRequest(requestId);
      const response = await axios.post('/requests/approve', {
        request_id: requestId,
        approve: false,
        note: note || 'Rejected by admin'
      });
      
      console.log('Reject response:', response.data);
      alert('Request rejected successfully!');
      setNote('');
      fetchAllRequests(); // Refresh the data
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request. Please try again.');
    } finally {
      setRejectingRequest(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-yellow-900';
      case 'approved':
        return 'bg-green-500 text-green-900';
      case 'rejected':
        return 'bg-red-500 text-red-900';
      default:
        return 'bg-gray-500 text-gray-900';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020B17] via-[#0a1a2e] to-[#1a2e4a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-blue-300 text-lg font-medium">Loading requests...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center blur-md brightness-30"
        style={{ backgroundImage: `url(${bg})` }}
        aria-hidden="true"
      />

      <div className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-20 text-white w-full">
        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute left-1/3 top-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-radial from-purple-700/30 via-transparent to-transparent rounded-full blur-3xl opacity-60"></div>
          <div className="absolute right-1/4 bottom-1/4 w-[240px] sm:w-[400px] h-[240px] sm:h-[400px] bg-gradient-radial from-green-600/30 via-transparent to-transparent rounded-full blur-2xl opacity-50"></div>
        </div>

        {/* Header Section */}
        <div className="relative z-20 text-center mb-10">
          <h1 className="text-3xl sm:text-5xl font-bold text-white drop-shadow-md">Booking Requests</h1>
          <p className="mt-4 text-gray-300 text-sm sm:text-lg max-w-2xl mx-auto">
            Manage and review booking requests from users.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="relative z-20 flex justify-center mb-8">
          <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-md rounded-lg p-1">
            {[
              { key: 'pending', label: 'Pending', count: requests.pending.length },
              { key: 'approved', label: 'Approved', count: requests.approved.length },
              { key: 'rejected', label: 'Rejected', count: requests.rejected.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-20 max-w-6xl mx-auto">
          {/* Note Input */}
          {(approvingRequest || rejectingRequest) && (
            <div className="mb-6 bg-gray-800/50 backdrop-blur-md rounded-lg p-4 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Note (optional):
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                placeholder="Add a note for this action..."
                rows="3"
              />
            </div>
          )}

          {/* Requests List */}
          <div className="space-y-4">
            {requests[activeTab].length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No {activeTab} requests</h3>
                <p className="text-gray-400">There are no {activeTab} booking requests at the moment.</p>
              </div>
            ) : (
              requests[activeTab].map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-800/50 backdrop-blur-md rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)} {request.status}
                        </span>
                                                 <span className="text-gray-400 text-sm">
                           Request #{request.id} | Booking #{request.booking_id}
                         </span>
                      </div>
                      
                                             {request.booking ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                           <div>
                             <p className="text-gray-400 text-sm">Guest Name</p>
                             <p className="text-white font-medium">{request.booking.name || 'N/A'}</p>
                           </div>
                           <div>
                             <p className="text-gray-400 text-sm">Phone</p>
                             <p className="text-white font-medium">{request.booking.mobile_number || 'N/A'}</p>
                           </div>
                           <div>
                             <p className="text-gray-400 text-sm">Rank</p>
                             <p className="text-white font-medium">{request.booking.rank || 'N/A'}</p>
                           </div>
                           <div>
                             <p className="text-gray-400 text-sm">Check-in</p>
                             <p className="text-white font-medium">{formatDate(request.booking.check_in_date)}</p>
                           </div>
                           <div>
                             <p className="text-gray-400 text-sm">Check-out</p>
                             <p className="text-white font-medium">{formatDate(request.booking.check_out_date)}</p>
                           </div>
                           <div>
                             <p className="text-gray-400 text-sm">Purpose</p>
                             <p className="text-white font-medium">{request.booking.purpose_of_visit || 'N/A'}</p>
                           </div>
                           <div>
                             <p className="text-gray-400 text-sm">Guests</p>
                             <p className="text-white font-medium">{request.booking.no_of_guests || 'N/A'}</p>
                           </div>
                           <div>
                             <p className="text-gray-400 text-sm">Meal Preference</p>
                             <p className="text-white font-medium">{request.booking.meal_preference || 'N/A'}</p>
                           </div>
                           <div>
                             <p className="text-gray-400 text-sm">Room ID</p>
                             <p className="text-white font-medium">{request.booking.room_id || 'N/A'}</p>
                           </div>
                         </div>
                       ) : (
                         <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                           <p className="text-yellow-300 text-sm">
                             ⚠️ Booking details could not be loaded for Booking #{request.booking_id}
                           </p>
                         </div>
                       )}

                      
                       
                       {/* Request Metadata */}
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-700/30 rounded p-3">
                         <div>
                           <p className="text-gray-400 text-sm">Request ID</p>
                           <p className="text-white font-medium">{request.id}</p>
                         </div>
                         <div>
                           <p className="text-gray-400 text-sm">Requested By</p>
                           <p className="text-white font-medium">User #{request.requested_by_id}</p>
                         </div>
                         <div>
                           <p className="text-gray-400 text-sm">Approved By</p>
                           <p className="text-white font-medium">{request.approved_by_id ? `User #${request.approved_by_id}` : 'Pending'}</p>
                         </div>
                       </div>
                    </div>

                    {/* Action Buttons */}
                    {activeTab === 'pending' && (
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={approvingRequest === request.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          {approvingRequest === request.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={rejectingRequest === request.id}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          {rejectingRequest === request.id ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    )}

                    {/* Action Buttons for Approved Section */}
                    {activeTab === 'approved' && (
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={rejectingRequest === request.id}
                          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          {rejectingRequest === request.id ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    )}

                    {/* Action Buttons for Rejected Section */}
                    {activeTab === 'rejected' && (
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={approvingRequest === request.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          {approvingRequest === request.id ? 'Approving...' : 'Approve'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
} 