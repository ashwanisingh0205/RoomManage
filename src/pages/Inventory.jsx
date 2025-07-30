import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { canManageInventory, getCurrentUserRole } from '../lib/roleUtils';

export default function Inventory() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomInventory, setRoomInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [image,setImage]=useState([])
  const [newInventoryItem, setNewInventoryItem] = useState({
    name: '',
    quantity: 1,
    is_broken: false,
    image: null
  });
  const [editInventoryItem, setEditInventoryItem] = useState({
    name: '',
    quantity: 1,
    is_broken: false,
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/rooms/');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInventory = async (room) => {
    setSelectedRoom(room);
    setLoadingInventory(true);
    
    // Scroll to top when modal opens
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    
    try {
      // Get inventory for this specific room
      const response = await axios.get(`/rooms/${room.id}/amenities/`);
      setRoomInventory(response.data);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      console.log('Using sample inventory from room amenities');
      // If API doesn't exist yet, create sample inventory from room amenities
      const sampleInventory = room.amenities ? room.amenities.map((amenity, index) => ({
        id: room.id * 100 + index + 1,
        name: amenity.name,
        quantity: amenity.quantity || 1,
        is_broken: amenity.is_broken || false,
        photo: amenity.photo || null
      })) : [];
      console.log('Sample inventory created:', sampleInventory);
      setRoomInventory(sampleInventory);
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewInventoryItem({ ...newInventoryItem, image: file });
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditInventoryItem({ ...editInventoryItem, image: file });
      const reader = new FileReader();
      reader.onload = (e) => setEditImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

    const getImageUrl = (item) => {
      if (!item.photo && !item.image && !item.image_url) {
        return null;
      }
      
      const photoPath = item.photo || item.image || item.image_url;
      
      if (photoPath && photoPath.includes('amenities')) {
        return `${axios.defaults.baseURL}/image/${photoPath.replace('amenities/', '')}`;
      } else if (photoPath) {
        return `${axios.defaults.baseURL}${photoPath}`;
      }
      
      return null;
    };




  const handleAddInventory = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newInventoryItem.name);
      formData.append('quantity', newInventoryItem.quantity);
      formData.append('is_broken', newInventoryItem.is_broken);
      if (newInventoryItem.image) {
        formData.append('photo', newInventoryItem.image);
      }

      await axios.post(`/rooms/${selectedRoom.id}/amenities`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setShowAddModal(false);
      setSelectedRoom(null);
      setNewInventoryItem({
        name: '',
        quantity: 1,
        is_broken: false,
        image: null
      });
      setImagePreview(null);
      
      // Refresh rooms data
      fetchRooms();
      
      alert('Amenity added successfully!');
    } catch (error) {
      console.error('Error adding amenity:', error);
      alert('Error adding amenity. Please try again.');
    }
  };

  const handleEditInventory = (item) => {
    setEditingItem(item);
    setEditInventoryItem({
      name: item.name,
      quantity: item.quantity || item.qty || item.amount || 1,
      is_broken: item.is_broken || false,
      image: null
    });
    setEditImagePreview(null);
    setShowEditModal(true);
    
    // Scroll to top when modal opens
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleUpdateInventory = async () => {
    try {
      const formData = new FormData();
      formData.append('name', editInventoryItem.name);
      formData.append('quantity', editInventoryItem.quantity);
      formData.append('is_broken', editInventoryItem.is_broken);
      if (editInventoryItem.image) {
        formData.append('photo', editInventoryItem.image);
      }

      await axios.put(`/rooms/${selectedRoom.id}/amenities/${editingItem.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setShowEditModal(false);
      setEditingItem(null);
      setEditInventoryItem({
        name: '',
        quantity: 1,
        is_broken: false,
        image: null
      });
      setEditImagePreview(null);
      
      // Refresh inventory data
      handleViewInventory(selectedRoom);
      
      alert('Amenity updated successfully!');
    } catch (error) {
      console.error('Error updating amenity:', error);
      alert('Error updating amenity. Please try again.');
    }
  };

  const getRoomStatusColor = (room, idx) => {
    if (idx === 0 || idx === 1) {
      // First 2 rooms: reddish gradient
      return 'bg-gradient-to-br from-red-600 to-pink-100';
    } else if (idx >= 2 && idx <= 6) {
      // Room 3 to 7: blue gradient
      return 'bg-gradient-to-br from-blue-500 to-blue-200';
    } else if (idx >= 7 && idx <= 10) {
      // Room 8 to 11: yellow gradient
      return 'bg-gradient-to-br from-yellow-500 to-yellow-200';
    }
    // Default
    return 'bg-gradient-to-br from-slate-500 to-slate-700';
  };

  const getRoomTypeIcon = (room) => {
    return (
      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
        {room.photo ? (
          <>
            <img 
              src={`${axios.defaults.baseURL}${room.photo}`}
              alt={`${room.name}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-500 text-lg" style={{display: 'none'}}>
              {room.type === 'premium' ? '👑' : room.type === 'deluxe' ? '⭐' : room.type === 'standard' ? '🏠' : '🏢'}
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 text-lg">
            {room.type === 'premium' ? '👑' : room.type === 'deluxe' ? '⭐' : room.type === 'standard' ? '🏠' : '🏢'}
          </div>
        )}
      </div>
    );
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'good':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'fair':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'poor':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <div className="text-indigo-300 text-lg font-medium">Loading inventory...</div>
        </div>
      </div>
    );
  }

  const userRole = getCurrentUserRole();
  const canManage = canManageInventory();

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Room Inventory Management
          </h1>
          <p className="text-slate-300 text-lg mb-6">
            Total Rooms: <span className="text-indigo-400 font-semibold">{rooms.length}</span> | 
            {canManage ? ' Click "View Inventory" to see items for each room' : ' View-only access'}
          </p>
          {userRole && (
            <p className="text-slate-400 text-sm mb-4">
              Role: {userRole}
            </p>
          )}
          <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rooms.map((room, idx) => (
            <div
              key={room.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl cursor-pointer overflow-hidden border border-gray-200 transition-shadow duration-200 flex flex-col h-80"
            >
              {/* Room Header */}
              <div className={`${getRoomStatusColor(room, idx)} p-6 text-white flex-shrink-0`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{room.name}</h3>
                    <p className="text-white/90 capitalize text-sm">{room.type} Room</p>
                  </div>
                  <div className="opacity-90">
                    {getRoomTypeIcon(room)}
                  </div>
                </div>
              </div>

              {/* Room Content */}
              <div className="p-6 flex-1 flex flex-col">
                {/* Room Info */}
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Room Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Type</span>
                      <span className="text-xs text-slate-500 capitalize">{room.type}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Amenities</span>
                      <span className="text-xs text-slate-500">{room.amenities ? room.amenities.length : 0}</span>
                    </div>
                  </div>
                </div>

                {/* View Inventory Button */}
                <div className="mt-auto pt-4 flex-shrink-0">
                  <button 
                    onClick={() => handleViewInventory(room)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-200"
                  >
                    View Inventory
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8 flex flex-col">
            {/* Modal Header */}
            <div className={`${getRoomStatusColor(selectedRoom, rooms.findIndex(r => r.id === selectedRoom.id))} p-6 rounded-t-2xl flex-shrink-0`}>
              <div className="flex justify-between items-start">
                <div className="text-white">
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedRoom.name} - Inventory
                  </h2>
                  <p className="text-white/90 capitalize text-lg">
                    {selectedRoom.type} Room Inventory Management
                  </p>
                </div>
                <div className="flex gap-2">
                  {canManage && (
                    <button
                      onClick={() => {
                        setShowAddModal(true);
                        // Scroll to top when modal opens
                        setTimeout(() => {
                          const modalContent = document.querySelector('.modal-content');
                          if (modalContent) {
                            modalContent.scrollTo({ top: 0, behavior: 'smooth' });
                          } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }, 100);
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add Item
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="text-white/80 hover:text-white transition-colors p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto max-h-[70vh] p-6 modal-content">
              {loadingInventory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <div className="text-slate-600 text-lg font-medium">Loading inventory...</div>
                  </div>
                </div>
              ) : roomInventory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left p-3 text-slate-700 font-semibold">Name</th>
                        <th className="text-left p-3 text-slate-700 font-semibold">Quantity</th>
                        <th className="text-left p-3 text-slate-700 font-semibold">Status</th>
                        <th className="text-left p-3 text-slate-700 font-semibold">Image</th>
                        {canManage && (
                          <th className="text-left p-3 text-slate-700 font-semibold">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {roomInventory.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 text-slate-800 font-medium">{item.name}</td>
                          <td className="p-3">
                            <span className="text-slate-700 font-medium">
                              {item.quantity || item.qty || item.amount || 1}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-xs px-3 py-1 rounded-full border ${item.is_broken ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                              {item.is_broken ? 'Broken' : 'Working'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                              {(() => {
                                const imageUrl = getImageUrl(item);
                                return imageUrl ? (
                                  <>
                                    <img 
                                      src={imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.log('Image failed to load for item:', item.name, 'URL:', e.target.src);
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                      onLoad={(e) => {
                                        console.log('Image loaded successfully for item:', item.name, 'URL:', e.target.src);
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-500 text-xs" style={{display: 'none'}}>
                                      📦
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500 text-xs border border-slate-300">
                                    <div className="text-center">
                                      <div className="text-lg mb-1">📦</div>
                                      <div className="text-xs">No Image</div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="p-3">
                            {canManage && (
                              <button
                                onClick={() => handleEditInventory(item)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                title="Edit Item"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-slate-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No Inventory Items</h3>
                  <p className="text-slate-500 mb-6">This room doesn't have any inventory items yet.</p>
                  {canManage && (
                    <button
                      onClick={() => {
                        setShowAddModal(true);
                        // Scroll to top when modal opens
                        setTimeout(() => {
                          const modalContent = document.querySelector('.modal-content');
                          if (modalContent) {
                            modalContent.scrollTo({ top: 0, behavior: 'smooth' });
                          } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }, 100);
                      }}
                      className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Add First Item
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Inventory Modal */}
      {showAddModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="text-white">
                  <h2 className="text-2xl font-bold">Add Inventory Item</h2>
                  <p className="text-white/90">Add new item to {selectedRoom.name}</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 modal-content">
              <div className="space-y-6">
                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Item Name</label>
                  <input
                    type="text"
                    value={newInventoryItem.name}
                    onChange={(e) => setNewInventoryItem({...newInventoryItem, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter item name"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newInventoryItem.quantity}
                    onChange={(e) => setNewInventoryItem({...newInventoryItem, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter quantity"
                  />
                </div>



                {/* Broken Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Item Status</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_broken"
                        value="false"
                        checked={!newInventoryItem.is_broken}
                        onChange={(e) => setNewInventoryItem({...newInventoryItem, is_broken: e.target.value === 'true'})}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">Working</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_broken"
                        value="true"
                        checked={newInventoryItem.is_broken}
                        onChange={(e) => setNewInventoryItem({...newInventoryItem, is_broken: e.target.value === 'true'})}
                        className="mr-2 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-slate-700">Broken</span>
                    </label>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Item Image</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {imagePreview ? (
                        <div>
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden mx-auto mb-4">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-sm text-slate-600">Click to change image</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                          </svg>
                          <p className="text-sm text-slate-600">Click to upload image</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddInventory}
                    disabled={!newInventoryItem.name}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Inventory Modal */}
      {showEditModal && editingItem && selectedRoom && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="text-white">
                  <h2 className="text-2xl font-bold">Edit Inventory Item</h2>
                  <p className="text-white/90">Update item in {selectedRoom.name}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 modal-content">
              <div className="space-y-6">
                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Item Name</label>
                  <input
                    type="text"
                    value={editInventoryItem.name}
                    onChange={(e) => setEditInventoryItem({...editInventoryItem, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter item name"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editInventoryItem.quantity}
                    onChange={(e) => setEditInventoryItem({...editInventoryItem, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter quantity"
                  />
                </div>

                {/* Broken Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Item Status</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="edit_is_broken"
                        value="false"
                        checked={!editInventoryItem.is_broken}
                        onChange={(e) => setEditInventoryItem({...editInventoryItem, is_broken: e.target.value === 'true'})}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Working</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="edit_is_broken"
                        value="true"
                        checked={editInventoryItem.is_broken}
                        onChange={(e) => setEditInventoryItem({...editInventoryItem, is_broken: e.target.value === 'true'})}
                        className="mr-2 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-slate-700">Broken</span>
                    </label>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Item Image</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="hidden"
                      id="edit-image-upload"
                    />
                    <label htmlFor="edit-image-upload" className="cursor-pointer">
                      {editImagePreview ? (
                        <div>
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden mx-auto mb-4">
                            <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-sm text-slate-600">Click to change image</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                          </svg>
                          <p className="text-sm text-slate-600">Click to upload new image (optional)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateInventory}
                    disabled={!editInventoryItem.name}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Update Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
