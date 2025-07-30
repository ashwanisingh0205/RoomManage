import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, Users, Calendar, Clock } from 'lucide-react';
import axios from '../api/axios';

export default function Analytics() {
  const [summaryData, setSummaryData] = useState({
    total_rooms: 0,
    avg_occupation: 0,
    total_bookings: 0,
    most_occupied_room: ''
  });
  const [roomBookingStats, setRoomBookingStats] = useState([]);
  const [reasonOfStayData, setReasonOfStayData] = useState([]);
  const [rankTypeData, setRankTypeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Helper function to generate date range for a month
  const getDateRangeForMonth = (month) => {
    if (month === 'all') return null;
    
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-${month.padStart(2, '0')}-01`;
    
    // Get the last day of the selected month
    const lastDay = new Date(currentYear, parseInt(month), 0).getDate();
    const endDate = `${currentYear}-${month.padStart(2, '0')}-${lastDay}`;
    
    console.log(`Date range for month ${month}:`, { startDate, endDate });
    return { startDate, endDate };
  };

  // Generate month options
  const monthOptions = [
    { value: 'all', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedMonth]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Generate date range for selected month
      console.log('Selected month:', selectedMonth);
      let summaryUrl = '/analytics/summary';
      const dateRange = getDateRangeForMonth(selectedMonth);
      
      if (dateRange) {
        // Use specific month date range
        summaryUrl = `/analytics/summary?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`;
      } else {
        // For "All Months", use current year date range
        const currentYear = new Date().getFullYear();
        const startDate = `${currentYear}-01-01`;
        const endDate = `${currentYear}-12-31`;
        summaryUrl = `/analytics/summary?start_date=${startDate}&end_date=${endDate}`;
      }
      
      // Fetch summary data with date range
      console.log('Summary URL:', summaryUrl);
      try {
        const summaryResponse = await axios.get(summaryUrl);
        setSummaryData(summaryResponse.data);
      } catch (summaryError) {
        console.error('Summary API error:', summaryError);
        console.error('Summary error details:', summaryError.response?.data);
        setSummaryData({
          total_rooms: 0,
          avg_occupation: 0,
          total_bookings: 0,
          most_occupied_room: 'N/A'
        });
      }
      
      // Fetch room booking stats with month filter
      const roomStatsUrl = selectedMonth === 'all' 
        ? '/analytics/booking-stats'
        : `/analytics/booking-stats?month=${selectedMonth}`;
      
      try {
        const roomStatsResponse = await axios.get(roomStatsUrl);
        setRoomBookingStats(roomStatsResponse.data.room_booking_stats || []);
      } catch (roomStatsError) {
        console.error('Room stats API error:', roomStatsError);
        setRoomBookingStats([]);
      }
      
      // Use room occupation data from summary API if available
      if (summaryData.room_occupation && summaryData.room_occupation.length > 0) {
        const formattedRoomStats = summaryData.room_occupation.map(room => ({
          room: room.room,
          occupation_percent: room.occupation,
          total_bookings: 0 // We don't have this data in the current response
        }));
        setRoomBookingStats(formattedRoomStats);
      }
      
      // Fetch reason of stay distribution with month filter
      let reasonUrl = '/analytics/reason-of-stay-distribution';
      const reasonDateRange = getDateRangeForMonth(selectedMonth);
      
      if (reasonDateRange) {
        reasonUrl = `/analytics/reason-of-stay-distribution?start_date=${reasonDateRange.startDate}&end_date=${reasonDateRange.endDate}`;
      } else {
        // For "All Months", use current year date range
        const currentYear = new Date().getFullYear();
        const startDate = `${currentYear}-01-01`;
        const endDate = `${currentYear}-12-31`;
        reasonUrl = `/analytics/reason-of-stay-distribution?start_date=${startDate}&end_date=${endDate}`;
      }
      
      try {
        const reasonResponse = await axios.get(reasonUrl);
        setReasonOfStayData(Array.isArray(reasonResponse.data) ? reasonResponse.data : [reasonResponse.data]);
      } catch (reasonError) {
        console.error('Reason of stay API error:', reasonError);
        setReasonOfStayData([]);
      }
      
      // Fetch rank type distribution with month filter
      let rankUrl = '/analytics/rank-type-distribution';
      const rankDateRange = getDateRangeForMonth(selectedMonth);
      
      if (rankDateRange) {
        rankUrl = `/analytics/rank-type-distribution?start_date=${rankDateRange.startDate}&end_date=${rankDateRange.endDate}`;
      } else {
        // For "All Months", use current year date range
        const currentYear = new Date().getFullYear();
        const startDate = `${currentYear}-01-01`;
        const endDate = `${currentYear}-12-31`;
        rankUrl = `/analytics/rank-type-distribution?start_date=${startDate}&end_date=${endDate}`;
      }
      
      try {
        const rankResponse = await axios.get(rankUrl);
        setRankTypeData(Array.isArray(rankResponse.data) ? rankResponse.data : [rankResponse.data]);
      } catch (rankError) {
        console.error('Rank type API error:', rankError);
        setRankTypeData([]);
      }
      
    } catch (error) {
      console.error('General analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-[#020B17] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <div className="text-indigo-300 text-lg font-medium">Loading analytics...</div>
        </div>
      </div>
    );
  }



  return (
    <div className="h-full bg-[#020B17] overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
          Room Analytics
        </h1>
        <p className="text-gray-300 text-lg">
          Weekly room occupation and booking statistics
          {selectedMonth !== 'all' && (
            <span className="text-blue-400 ml-2">
              • Filtered for {monthOptions.find(opt => opt.value === selectedMonth)?.label}
            </span>
          )}
        </p>
        

      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-white" />
              <div>
                <p className="text-white/80 text-sm">Total Rooms</p>
                <p className="text-white text-2xl font-bold">{summaryData.total_rooms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-white" />
              <div>
                <p className="text-white/80 text-sm">Avg. Occupation</p>
                <p className="text-white text-2xl font-bold">{summaryData.avg_occupation.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-white" />
              <div>
                <p className="text-white/80 text-sm">Total Bookings</p>
                <p className="text-white text-2xl font-bold">{summaryData.total_bookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-white" />
              <div>
                <p className="text-white/80 text-sm">Most Occupied</p>
                <p className="text-white text-lg font-bold">{summaryData.most_occupied_room}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart - Room Occupation */}
      <Card className="bg-white/5 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl">Room Occupation Statistics</CardTitle>
              <CardDescription className="text-gray-300">
                Occupation percentage and total bookings for each room
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-gray-300 text-sm font-medium">Filter by Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white/10 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={roomBookingStats}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="room" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                  label={{ 
                    value: 'Occupation %', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#9CA3AF',
                    fontSize: 12
                  }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend 
                  wrapperStyle={{ color: '#F9FAFB' }}
                />
                <Bar 
                  dataKey="occupation_percent" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  name="Occupation %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Reason of Stay Chart */}
      <Card className="bg-white/5 border-gray-700 backdrop-blur-sm mt-8">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Reason of Stay Distribution</CardTitle>
          <CardDescription className="text-gray-300">
            Monthly breakdown of bookings by reason of stay (TD vs Leave)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reasonOfStayData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                  label={{ 
                    value: 'Number of Bookings', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#9CA3AF',
                    fontSize: 12
                  }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend 
                  wrapperStyle={{ color: '#F9FAFB' }}
                />
                <Bar 
                  dataKey="TD (Temporary Duty)" 
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  name="TD (Temporary Duty)"
                />
                <Bar 
                  dataKey="Leave" 
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                  name="Leave"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rank Type Chart */}
      <Card className="bg-white/5 border-gray-700 backdrop-blur-sm mt-8">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Rank Type Distribution</CardTitle>
          <CardDescription className="text-gray-300">
            Monthly breakdown of bookings by rank type (Officer vs Civilian)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rankTypeData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                  label={{ 
                    value: 'Number of Bookings', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#9CA3AF',
                    fontSize: 12
                  }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend 
                  wrapperStyle={{ color: '#F9FAFB' }}
                />
                <Bar 
                  dataKey="Officer" 
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                  name="Officer"
                />
                <Bar 
                  dataKey="Civilian" 
                  fill="#06B6D4"
                  radius={[4, 4, 0, 0]}
                  name="Civilian"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
