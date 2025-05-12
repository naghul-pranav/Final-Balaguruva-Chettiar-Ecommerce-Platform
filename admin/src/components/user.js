import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale,   
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  BarElement,
  TimeScale,
  RadialLinearScale,
  RadarController
} from 'chart.js';
import { 
  Search, RefreshCw, ChevronDown, ChevronUp, Download, 
  User as UserIcon, Sun, Moon, Filter, HelpCircle, Bell, 
  BarChart2, LineChart, PieChart, Calendar, Tag, Mail, 
  AlertTriangle, CheckCircle, Activity, PlusCircle,
  Map, Phone, Clock, Settings, Package, Clipboard,
  UserCheck, MapPin, Layers, List, Grid, LogOut, 
  ThumbsUp, Eye, EyeOff, Award
} from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  BarElement,
  TimeScale,
  RadialLinearScale,
  RadarController
);

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [signupData, setSignupData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [notifications, setNotifications] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [userStatistics, setUserStatistics] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [distributionData, setDistributionData] = useState({});
  const [userActivityData, setUserActivityData] = useState({});
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const tableRef = useRef(null);
  const chartContainerRef = useRef(null);

  const API_URL = 'http://localhost:5008';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setUsers(response.data);
      processSignupData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      setLoading(false);
    }
  };

  const fetchUserAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      if (response.data) {
        const userData = response.data;
        setUserStatistics(processUserStats(userData));
        setActivityLog(generateActivityLog(userData));
        processEmailDomainDistribution(userData);
        setUserActivityData(generateActivityPatterns(userData));
      }
      setAnalyticsLoading(false);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      addNotification("Failed to load analytics", "error");
      setAnalyticsLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchUserAnalytics()
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      addNotification("Failed to load data", "error");
    }
  };

  const processUserStats = (userData) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    const activeUsers = userData.filter(user => {
      const lastActivity = new Date(user.lastLogin || user.createdAt);
      return lastActivity >= thirtyDaysAgo;
    }).length;

    const totalUsers = userData.length;
    const monthlyGrowth = calculateMonthlyGrowth(userData);
    
    return {
      totalUsers,
      activeUsers,
      retentionRate: Math.round((activeUsers / totalUsers) * 100),
      growthRate: monthlyGrowth,
      dailyActiveUsers: Math.round(activeUsers * 0.3),
      averageSessionTime: 15
    };
  };

  const calculateMonthlyGrowth = (userData) => {
    const now = new Date();
    const thisMonth = userData.filter(user => {
      const created = new Date(user.createdAt);
      return created.getMonth() === now.getMonth() &&
             created.getFullYear() === now.getFullYear();
    }).length;

    const lastMonth = userData.filter(user => {
      const created = new Date(user.createdAt);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return created.getMonth() === lastMonthDate.getMonth() &&
             created.getFullYear() === lastMonthDate.getFullYear();
    }).length;

    return lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
  };

  const generateActivityLog = (userData) => {
    return userData
      .slice(0, 10)
      .map(user => ({
        id: user._id,
        type: 'signup',
        user: user.email,
        time: user.createdAt,
        details: 'New user registration'
      }))
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  };

  const processSignupData = (userData) => {
    if (!userData || userData.length === 0) return;
    
    const monthlySignups = {};
    const last12Months = [];
    
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.toLocaleString('en-US', { month: 'short' })} ${month.getFullYear()}`;
      last12Months.push(monthKey);
      monthlySignups[monthKey] = 0;
    }
    
    userData.forEach(user => {
      const date = new Date(user.createdAt);
      const monthYear = `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
      if (monthlySignups[monthYear] !== undefined) {
        monthlySignups[monthYear] += 1;
      }
    });
    
    setSignupData({
      labels: last12Months,
      datasets: [{
        label: 'New User Signups',
        data: last12Months.map(month => monthlySignups[month]),
        fill: true,
        backgroundColor: 'rgba(101, 116, 205, 0.2)',
        borderColor: 'rgba(101, 116, 205, 1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(101, 116, 205, 1)'
      }]
    });
  };

  const processEmailDomainDistribution = (userData) => {
    const usersByDomain = userData.reduce((acc, user) => {
      if (user.email) {
        const domain = user.email.split('@')[1];
        acc[domain] = (acc[domain] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topDomains = Object.entries(usersByDomain)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const otherCount = Object.values(usersByDomain)
      .reduce((sum, count) => sum + count, 0) - 
      topDomains.reduce((sum, [_, count]) => sum + count, 0);
    
    if (otherCount > 0) {
      topDomains.push(['Other', otherCount]);
    }
    
    setDistributionData({
      labels: topDomains.map(([domain]) => domain),
      datasets: [{
        data: topDomains.map(([_, count]) => count),
        backgroundColor: [
          '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#84CC16', '#F59E0B'
        ],
        borderWidth: 1
      }]
    });
  };

  const generateActivityPatterns = (userData) => {
    const weekday = Array(24).fill(0);
    const weekend = Array(24).fill(0);

    userData.forEach(user => {
      const date = new Date(user.createdAt);
      const hour = date.getHours();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      if (isWeekend) {
        weekend[hour]++;
      } else {
        weekday[hour]++;
      }
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Weekday',
          data: weekday,
          borderColor: 'rgba(101, 116, 205, 1)',
          backgroundColor: 'rgba(101, 116, 205, 0.2)',
          fill: true,
        },
        {
          label: 'Weekend',
          data: weekend,
          borderColor: 'rgba(236, 72, 153, 1)',
          backgroundColor: 'rgba(236, 72, 153, 0.2)',
          fill: true,
        }
      ]
    };
  };

  const refreshUserData = async () => {
    setRefreshing(true);
    try {
      await fetchAllData();
      addNotification('Data refreshed successfully');
    } catch (err) {
      addNotification('Failed to refresh data', 'error');
    }
    setRefreshing(false);
  };

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedUsers = React.useMemo(() => {
    if (!users.length) return [];
    const sortableUsers = [...users];
    sortableUsers.sort((a, b) => {
      const aValue = a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase() : '';
      const bValue = b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase() : '';
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableUsers;
  }, [users, sortConfig]);

  const filteredUsers = React.useMemo(() => {
    return sortedUsers.filter(user => 
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedUsers, searchTerm]);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Sign-up Date'];
    const csvRows = filteredUsers.map(user => [
      user.name || 'N/A',
      user.email,
      new Date(user.createdAt).toISOString().split('T')[0]
    ].join(','));
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Enhance chart options with more effects
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: { 
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          padding: 10,
          font: { size: 11 },
          color: '#333'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        titleColor: '#333',
        bodyColor: '#333',
        titleFont: { weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        borderColor: 'rgba(101, 116, 205, 0.2)',
        borderWidth: 1,
        cornerRadius: 6,
        callbacks: {
          label: (context) => `${context.raw} users`
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: { 
          precision: 0,
          color: '#333'
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#333',
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  // Enhanced donut chart options
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    animation: {
      animateScale: true,
      animateRotate: true
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        titleColor: '#333',
        bodyColor: '#333',
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    }
  };

  const renderChart = () => {
    if (!signupData.datasets) return null;
    return chartType === 'bar' ? (
      <Bar data={signupData} options={chartOptions} height={200} />
    ) : (
      <Line data={signupData} options={chartOptions} height={200} />
    );
  };

  const renderActivityChart = () => {
    if (!userActivityData.datasets) return null;
    return (
      <Line 
        data={userActivityData} 
        options={{
          ...chartOptions,
          plugins: {
            ...chartOptions.plugins,
            legend: { position: 'bottom' }
          }
        }} 
        height={120} 
      />
    );
  };

  // New function to render the email distribution chart
  const renderEmailDistributionChart = () => {
    if (!distributionData.datasets) return null;
    return (
      <Doughnut 
        data={distributionData} 
        options={donutOptions}
        height={200}
      />
    );
  };

  const addNotification = (message, type = "success") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const formatActivityTime = (isoTime) => {
    const date = new Date(isoTime);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    return type === 'signup' ? (
      <PlusCircle size={16} className="text-green-500" />
    ) : (
      <Activity size={16} className="text-blue-500" />
    );
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Add Navbar component */}
      <Navbar />
      
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        {/* Header with responsive layout */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          
          {/* Controls with responsive wrapping */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={refreshUserData}
              disabled={refreshing}
              className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md"
            >
              {refreshing ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Refresh Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dashboard cards - 3 columns on desktop, 2 on tablet, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {/* User statistic cards here */}
          <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-lg shadow-md border border-indigo-100 transform transition-all hover:scale-105">
            <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
            <p className="text-2xl font-bold text-gray-900">{userStatistics.totalUsers || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-white to-purple-50 p-4 rounded-lg shadow-md border border-purple-100 transform transition-all hover:scale-105">
            <h3 className="text-gray-500 text-sm font-medium">Active Users</h3>
            <p className="text-2xl font-bold text-gray-900">{userStatistics.activeUsers || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-white to-pink-50 p-4 rounded-lg shadow-md border border-pink-100 transform transition-all hover:scale-105">
            <h3 className="text-gray-500 text-sm font-medium">Retention Rate</h3>
            <p className="text-2xl font-bold text-gray-900">{userStatistics.retentionRate || 0}%</p>
          </div>
          
          <div className="bg-gradient-to-br from-white to-emerald-50 p-4 rounded-lg shadow-md border border-emerald-100 transform transition-all hover:scale-105">
            <h3 className="text-gray-500 text-sm font-medium">Growth Rate</h3>
            <p className="text-2xl font-bold text-gray-900">{userStatistics.growthRate || 0}%</p>
          </div>
        </div>

        {/* Chart controls */}
        <div className="mb-4 flex justify-end">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 inline-flex">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-sm rounded-md ${
                chartType === 'line' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LineChart size={14} className="inline mr-1" />
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-sm rounded-md ${
                chartType === 'bar' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart2 size={14} className="inline mr-1" />
              Bar
            </button>
          </div>
        </div>

        {/* Analytics section with responsive chart containers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md border border-indigo-100 transition-all duration-300 hover:shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">User Growth</h3>
            <div className="h-60 md:h-80" ref={chartContainerRef}>
              {renderChart()}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md border border-indigo-100 transition-all duration-300 hover:shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Email Distribution</h3>
            <div className="h-60 md:h-80">
              {renderEmailDistributionChart()}
            </div>
          </div>
        </div>

        {/* User activity patterns */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-indigo-100 mb-8 transition-all duration-300 hover:shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">User Activity Patterns</h3>
          <div className="h-40 md:h-60">
            {renderActivityChart()}
          </div>
        </div>

        {/* User table with horizontal scroll for small screens */}
        <div className="bg-white rounded-lg shadow-md border border-indigo-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">User List</h2>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToCSV}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm text-sm"
              >
                Export to CSV
              </button>
              
              <select
                value={usersPerPage}
                onChange={(e) => setUsersPerPage(Number(e.target.value))}
                className="px-3 py-1.5 border rounded bg-white text-sm"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>
          
          {/* Table with horizontal scroll for mobile */}
          <div className="overflow-x-auto" ref={tableRef}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-blue-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                    <button onClick={() => requestSort('name')}>
                      {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                    <button onClick={() => requestSort('email')}>
                      {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sign-up Date
                    <button onClick={() => requestSort('createdAt')}>
                      {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-indigo-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{user.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination - always visible and responsive */}
          <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            
            <div className="flex flex-wrap justify-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                First
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button 
                  key={number}
                  className={`px-4 py-2 text-sm font-medium ${
                    currentPage === number 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm' 
                      : 'bg-white text-gray-700 hover:bg-indigo-50'
                  } ${number === 1 ? 'rounded-l-md' : ''} ${number === totalPages ? 'rounded-r-md' : ''}`}
                  onClick={() => setCurrentPage(number)}
                >
                  {number}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        </div>

        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">User Details</h2>
              <div className="space-y-3">
                <p><span className="font-medium">Name:</span> {selectedUser.name || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                <p><span className="font-medium">Sign-up Date:</span> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-md hover:from-gray-500 hover:to-gray-600 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="fixed bottom-4 right-4 space-y-2">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`p-3 rounded-lg shadow-lg flex items-center ${
                notification.type === 'error' 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600'
              } text-white`}
            >
              {notification.type === 'error' ? (
                <AlertTriangle className="mr-2 h-5 w-5" />
              ) : (
                <CheckCircle className="mr-2 h-5 w-5" />
              )}
              <p className="text-sm">{notification.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserPage;